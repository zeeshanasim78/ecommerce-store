"use server";

import { and, asc, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { db } from "@/db/client";
import { brands, categories, heroSlides, productImages, productVariants, products } from "@/db/schema";
import { IMAGE_ANGLES } from "@/db/schema/catalog";
import { slugify } from "@/lib/slug";
import { karachiInputToIso } from "@/lib/time";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { friendlyDbError } from "@/server/db-errors";
import { checked, list, optionalText, text } from "@/server/forms";
import { activeSlideCount, syncHeroFlag } from "@/server/hero";
import { revalidateStorefront } from "@/server/revalidate";
import { UPLOAD_ROOT, UploadError, saveImage } from "@/server/uploads";
import { attempt, goTo } from "@/server/action-helpers";
import { importProductsCsv } from "@/server/catalog/product-csv";
import { StockAdjustError, adjustStock, countStock } from "@/server/inventory/adjust";

const go = (path: string, params: Record<string, string>) => redirect(`${path}?${new URLSearchParams(params)}`);

/** Rupees from a form field, at most 2 decimals (blueprint `real` columns, spec §3). */
const rupees = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .min(0, `${label} can’t be negative.`)
    .max(10_000_000, `${label} looks too large.`)
    .transform((n) => Math.round(n * 100) / 100);

const ProductSchema = z
  .object({
    brand: z.string().min(1, "Choose a brand."),
    model: z.string().min(1, "Add the phone model.").max(80),
    displayType: z.string().min(1, "Add the display type.").max(60),
    qualityGrade: z.string().min(1, "Add the quality grade.").max(60),
    sku: z
      .string()
      .transform((s) => s.toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9-]{3,40}$/, "SKU: 3–40 capital letters, numbers or dashes.")),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Web address: lower-case letters, numbers and dashes."),
    description: z.string().max(2000).nullable(),
    compatibility: z.array(z.string().max(40)).max(30),
    featureTags: z.array(z.string().max(24, "Feature tags must be 24 characters or fewer.")).max(6, "Use at most 6 feature tags."),
    costPrice: rupees("Cost price"),
    retailPricePKR: rupees("Retail price").refine((n) => n > 0, "Retail price must be above zero."),
    wholesalePricePKR: rupees("Wholesale price").refine((n) => n > 0, "Wholesale price must be above zero."),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000),
    warrantyDays: z.coerce.number().int().min(0).max(365),
    categoryId: z.string().nullable(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    salePricePKR: rupees("Sale price").nullable(),
    saleStartsAt: z.string().nullable(),
    saleEndsAt: z.string().nullable(),
  })
  .refine((p) => p.wholesalePricePKR <= p.retailPricePKR, { message: "Wholesale price should not be higher than the retail price." })
  .refine((p) => p.salePricePKR === null || (p.salePricePKR > 0 && p.salePricePKR < p.retailPricePKR), {
    message: "The sale price must be above zero and below the retail price.",
  })
  .refine((p) => !p.saleStartsAt || !p.saleEndsAt || p.saleEndsAt > p.saleStartsAt, { message: "The sale must end after it starts." });

const VariantSchema = z.object({
  color: z.string().min(1, "Add the colour.").max(40),
  variantLabel: z.string().max(40).nullable(),
  binLocation: z.string().max(20).nullable(),
});

function readProduct(formData: FormData) {
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  const qualityGrade = text(formData, "qualityGrade");
  const sale = text(formData, "salePricePKR");
  const startsRaw = text(formData, "saleStartsAt");
  const endsRaw = text(formData, "saleEndsAt");
  return ProductSchema.safeParse({
    brand,
    model,
    displayType: text(formData, "displayType"),
    qualityGrade,
    sku: text(formData, "sku"),
    slug: text(formData, "slug") || slugify(`${brand} ${model} ${qualityGrade}`),
    description: optionalText(formData, "description"),
    compatibility: list(formData, "compatibility"),
    featureTags: list(formData, "featureTags"),
    costPrice: text(formData, "costPrice") || "0",
    retailPricePKR: text(formData, "retailPricePKR"),
    wholesalePricePKR: text(formData, "wholesalePricePKR"),
    lowStockThreshold: text(formData, "lowStockThreshold") || "5",
    warrantyDays: text(formData, "warrantyDays") || "7",
    categoryId: optionalText(formData, "categoryId"),
    isPublished: checked(formData, "isPublished"),
    isFeatured: checked(formData, "isFeatured"),
    salePricePKR: sale === "" ? null : sale,
    saleStartsAt: startsRaw ? karachiInputToIso(startsRaw) : null,
    saleEndsAt: endsRaw ? karachiInputToIso(endsRaw) : null,
  });
}

/**
 * "Featured on Hero" (spec §4.16): ticking it creates a hero slide for the product
 * (or re-activates its existing one); unticking hides the product's slides.
 * Returns a note when the carousel is already full.
 */
function applyHeroFeature(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], product: { id: string; brand: string; model: string; qualityGrade: string; displayType: string; slug: string }, wanted: boolean): string | null {
  const existing = tx.select().from(heroSlides).where(eq(heroSlides.productId, product.id)).orderBy(asc(heroSlides.sortOrder)).all();
  let note: string | null = null;
  if (wanted && !existing.some((s) => s.isActive)) {
    const room = activeSlideCount(tx) < 5;
    if (existing[0]) {
      if (room) tx.update(heroSlides).set({ isActive: true }).where(eq(heroSlides.id, existing[0].id)).run();
    } else {
      const last = tx.select({ s: heroSlides.sortOrder }).from(heroSlides).orderBy(asc(heroSlides.sortOrder)).all().at(-1);
      tx.insert(heroSlides)
        .values({
          heading: `${product.brand} ${product.model}`,
          subheading: `${product.qualityGrade} ${product.displayType} display assembly`,
          ctaLabel: "View screen",
          ctaHref: `/store/${product.slug}`,
          productId: product.id,
          visualType: "PHONE_3D",
          isActive: room,
          sortOrder: (last?.s ?? -1) + 1,
        })
        .run();
    }
    if (!room) note = "The hero carousel already has 5 live slides, so this product’s slide was saved hidden. Turn another slide off in Hero carousel.";
  }
  if (!wanted) tx.update(heroSlides).set({ isActive: false }).where(and(eq(heroSlides.productId, product.id), eq(heroSlides.isActive, true))).run();
  syncHeroFlag(tx, product.id);
  return note;
}

export async function saveProduct(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/products/${id}` : "/admin/products/new";

  const parsed = readProduct(formData);
  if (!parsed.success) go(formPath, { error: parsed.error.issues[0]?.message ?? "Check the form." });
  const data = parsed.data!;

  if (!db.select({ id: brands.id }).from(brands).where(eq(brands.name, data.brand)).get()) go(formPath, { error: "Choose a brand from the list." });
  if (data.categoryId && !db.select({ id: categories.id }).from(categories).where(eq(categories.id, data.categoryId)).get()) {
    go(formPath, { error: "Choose a category from the list." });
  }

  let variant: z.infer<typeof VariantSchema> | null = null;
  if (!id) {
    const v = VariantSchema.safeParse({ color: text(formData, "color"), variantLabel: optionalText(formData, "variantLabel"), binLocation: optionalText(formData, "binLocation") });
    if (!v.success) go(formPath, { error: v.error.issues[0]?.message ?? "Add the first colour." });
    variant = v.data!;
  }

  const ctx = await auditContext();
  let error: string | null = null;
  let savedId = id;
  let note: string | null = null;
  try {
    db.transaction(
      (tx) => {
        const before = id ? tx.select().from(products).where(eq(products.id, id)).get() : undefined;
        if (id && !before) throw new Error("Product not found");
        const values = { ...data, updatedAt: new Date().toISOString() };
        if (id) {
          tx.update(products).set(values).where(eq(products.id, id)).run();
        } else {
          savedId = crypto.randomUUID();
          tx.insert(products).values({ id: savedId, ...values }).run();
          // Stock starts at 0; it arrives through a purchase order or a stock count (spec §6.5).
          tx.insert(productVariants).values({ id: crypto.randomUUID(), productId: savedId, ...variant!, variantSku: `${data.sku}-01` }).run();
        }
        note = applyHeroFeature(tx, { id: savedId!, ...data }, checked(formData, "isFeaturedHero"));
        writeAudit(tx, ctx, { actorId: staff.id, action: id ? "product.update" : "product.create", entity: "products", entityId: savedId, before, after: data });
      },
      { behavior: "immediate" },
    );
  } catch (e) {
    error = friendlyDbError(e);
  }
  if (error) go(formPath, { error });
  revalidateStorefront();
  go(`/admin/products/${savedId}`, { saved: note ?? (id ? "Product saved." : "Product created. Add photos below.") });
}

export async function setArchived(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = text(formData, "id");
  const archive = text(formData, "archive") === "1";
  const ctx = await auditContext();
  db.transaction((tx) => {
    tx.update(products)
      .set({ archivedAt: archive ? new Date().toISOString() : null, isPublished: archive ? false : undefined, updatedAt: new Date().toISOString() })
      .where(eq(products.id, id))
      .run();
    if (archive) tx.update(heroSlides).set({ isActive: false }).where(eq(heroSlides.productId, id)).run();
    syncHeroFlag(tx, id);
    writeAudit(tx, ctx, { actorId: staff.id, action: archive ? "product.archive" : "product.restore", entity: "products", entityId: id });
  });
  revalidateStorefront();
  go(`/admin/products/${id}`, { saved: archive ? "Product archived and hidden from the shop. Its stock history is kept." : "Product restored. Publish it when ready." });
}

export async function addVariant(formData: FormData) {
  const staff = await requireStaff("catalog");
  const productId = text(formData, "productId");
  const path = `/admin/products/${productId}`;
  const v = VariantSchema.safeParse({ color: text(formData, "color"), variantLabel: optionalText(formData, "variantLabel"), binLocation: optionalText(formData, "binLocation") });
  if (!v.success) go(path, { error: v.error.issues[0]?.message ?? "Check the variant." });

  const ctx = await auditContext();
  let error: string | null = null;
  try {
    db.transaction((tx) => {
      const product = tx.select({ sku: products.sku }).from(products).where(eq(products.id, productId)).get();
      if (!product) throw new Error("Product not found");
      const n = tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, productId)).all().length + 1;
      const variantId = crypto.randomUUID();
      tx.insert(productVariants).values({ id: variantId, productId, ...v.data!, variantSku: `${product.sku}-${String(n).padStart(2, "0")}` }).run();
      writeAudit(tx, ctx, { actorId: staff.id, action: "variant.create", entity: "product_variants", entityId: variantId, after: v.data });
    });
  } catch (e) {
    error = friendlyDbError(e);
  }
  if (error) go(path, { error });
  revalidateStorefront();
  go(path, { saved: "Colour added with 0 in stock. Stock arrives through a purchase order or a stock count below." });
}

const ImageMetaSchema = z.object({
  angle: z.enum(IMAGE_ANGLES),
  alt: z.string().min(3, "Describe the photo for people using screen readers.").max(140),
  variantId: z.string().nullable(),
});

export async function uploadImages(formData: FormData) {
  const staff = await requireStaff("catalog");
  const productId = text(formData, "productId");
  const path = `/admin/products/${productId}`;
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) go(path, { error: "Choose at least one image." });
  if (files.length > 6) go(path, { error: "Upload up to 6 images at a time." });

  const product = db.select({ brand: products.brand, model: products.model }).from(products).where(eq(products.id, productId)).get();
  if (!product) go("/admin/products", { error: "Product not found." });
  const meta = ImageMetaSchema.safeParse({
    angle: text(formData, "angle") || "FRONT",
    alt: text(formData, "alt") || `${product!.brand} ${product!.model} screen`,
    variantId: optionalText(formData, "variantId"),
  });
  if (!meta.success) go(path, { error: meta.error.issues[0]?.message ?? "Check the image details." });
  if (meta.data!.variantId && !db.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, meta.data!.variantId), eq(productVariants.productId, productId))).get()) {
    go(path, { error: "That colour doesn’t belong to this product." });
  }

  const urls: string[] = [];
  try {
    for (const f of files) urls.push(await saveImage(f, "products"));
  } catch (e) {
    if (e instanceof UploadError) go(path, { error: e.message });
    throw e;
  }

  const ctx = await auditContext();
  db.transaction((tx) => {
    const last = tx.select({ s: productImages.sortOrder }).from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder)).all().at(-1);
    urls.forEach((url, i) => tx.insert(productImages).values({ productId, url, ...meta.data!, sortOrder: (last?.s ?? -1) + 1 + i }).run());
    writeAudit(tx, ctx, { actorId: staff.id, action: "product.images.upload", entity: "product_images", entityId: productId, after: urls });
  });
  revalidateStorefront();
  go(path, { saved: `${urls.length} image${urls.length === 1 ? "" : "s"} added.` });
}

export async function updateImage(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = text(formData, "id");
  const image = db.select().from(productImages).where(eq(productImages.id, id)).get();
  if (!image) go("/admin/products", { error: "Image not found." });
  const path = `/admin/products/${image!.productId}`;
  const meta = ImageMetaSchema.safeParse({ angle: text(formData, "angle"), alt: text(formData, "alt"), variantId: optionalText(formData, "variantId") });
  if (!meta.success) go(path, { error: meta.error.issues[0]?.message ?? "Check the image details." });

  const ctx = await auditContext();
  db.transaction((tx) => {
    tx.update(productImages).set(meta.data!).where(eq(productImages.id, id)).run();
    writeAudit(tx, ctx, { actorId: staff.id, action: "product.image.update", entity: "product_images", entityId: id, before: image, after: meta.data });
  });
  revalidateStorefront();
  go(path, { saved: "Image details saved." });
}

export async function moveImage(formData: FormData) {
  await requireStaff("catalog");
  const id = text(formData, "id");
  const image = db.select().from(productImages).where(eq(productImages.id, id)).get();
  if (!image) go("/admin/products", { error: "Image not found." });
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  db.transaction((tx) => {
    const ordered = tx.select({ id: productImages.id }).from(productImages).where(eq(productImages.productId, image!.productId)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)).all();
    const i = ordered.findIndex((x) => x.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j]!, ordered[i]!];
    ordered.forEach((x, k) => tx.update(productImages).set({ sortOrder: k }).where(eq(productImages.id, x.id)).run());
  });
  revalidateStorefront();
  go(`/admin/products/${image!.productId}`, { saved: "Image order updated." });
}

export async function deleteImage(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = text(formData, "id");
  const image = db.select().from(productImages).where(eq(productImages.id, id)).get();
  if (!image) go("/admin/products", { error: "Image not found." });
  const ctx = await auditContext();
  db.transaction((tx) => {
    tx.delete(productImages).where(eq(productImages.id, id)).run();
    writeAudit(tx, ctx, { actorId: staff.id, action: "product.image.delete", entity: "product_images", entityId: id, before: image });
  });
  // Remove the file only if no other row still points at it
  const stillUsed = db.select({ id: productImages.id }).from(productImages).where(and(eq(productImages.url, image!.url), ne(productImages.id, id))).get();
  if (!stillUsed && image!.url.startsWith("/uploads/products/")) {
    await unlink(join(UPLOAD_ROOT, image!.url.replace("/uploads/", ""))).catch(() => undefined);
  }
  revalidateStorefront();
  go(`/admin/products/${image!.productId}`, { saved: "Image deleted." });
}

/**
 * Stock count / adjustment / damage write-off for one colour (spec §6.5). OWNER and MANAGER only;
 * always a new ledger row written through the stock engine.
 */
export async function changeStock(formData: FormData) {
  const staff = await requireStaff("stockAdjust");
  const productId = text(formData, "productId");
  const path = `/admin/products/${productId}`;
  const [variantId = "", expected = ""] = text(formData, "variant").split("|");
  const expectedStock = Number(expected);
  const mode = text(formData, "mode");
  const raw = text(formData, "quantity");
  const notes = text(formData, "notes").slice(0, 300);

  const owns = db.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId))).get();
  if (!owns || !Number.isSafeInteger(expectedStock)) goTo(path, { error: "Choose a colour." });
  if (!/^-?\d{1,7}$/.test(raw)) goTo(path, { error: "Enter a whole number." });
  const n = Number(raw);

  const ctx = await auditContext();
  const actor = { id: staff.id };
  const r = attempt(() => {
    if (mode === "count") {
      if (n < 0) throw new StockAdjustError("A count can’t be negative.");
      const res = countStock(db, { variantId, counted: n, notes, expectedStock }, actor, ctx);
      return res.changed ? `Counted ${n}. Stock corrected from ${res.previousStock} to ${res.newStock}.` : `Counted ${n} — matches the system. Nothing to correct.`;
    }
    if (mode === "damage") {
      if (n <= 0) throw new StockAdjustError("Enter how many units were damaged.");
      const res = adjustStock(db, { variantId, delta: -n, reason: "DAMAGED_WRITE_OFF", notes, expectedStock }, actor, ctx);
      return `${n} written off as damaged. Stock is now ${res.newStock}.`;
    }
    const res = adjustStock(db, { variantId, delta: n, reason: "MANUAL_ADJUST", notes, expectedStock }, actor, ctx);
    return `Stock adjusted by ${n > 0 ? `+${n}` : n}. It is now ${res.newStock}.`;
  });
  if (!r.ok) goTo(path, { error: r.error });
  revalidateStorefront();
  goTo(path, { saved: r.value });
}

/** Product CSV import (spec §7). All-or-nothing; errors come back as a list on the import page. */
export async function importProducts(formData: FormData) {
  const staff = await requireStaff("catalog");
  const upload = formData.get("file");
  if (!(upload instanceof File) || upload.size === 0) goTo("/admin/products/import", { error: "Choose a CSV file." });
  const f = upload as File;
  if (f.size > 1_000_000) goTo("/admin/products/import", { error: "The file is larger than 1 MB. Split it into smaller files." });
  if (!/\.csv$/i.test(f.name) && !/csv|text\/plain/.test(f.type)) goTo("/admin/products/import", { error: "Upload a .csv file (in Excel: File → Save As → CSV UTF-8)." });

  const result = importProductsCsv(db, await f.text(), { id: staff.id }, await auditContext());
  if (!result.ok) goTo("/admin/products/import", { error: result.errors.join("\n") });
  revalidateStorefront();
  const r = result as Extract<typeof result, { ok: true }>;
  goTo("/admin/products", {
    saved: `Import done: ${r.productsCreated} new and ${r.productsUpdated} updated products, ${r.variantsCreated} new and ${r.variantsUpdated} updated colours${r.openingUnits ? `, ${r.openingUnits} units of opening stock` : ""}.`,
  });
}
