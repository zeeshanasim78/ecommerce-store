import { asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connection";
import { brands, categories, productVariants, products, stockLedger } from "@/db/schema";
import { csvRecords, CsvParseError, toCsv } from "@/lib/csv";
import { toPaisa } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { applyStockMovement, withStockTransaction } from "@/server/inventory/stock";

/**
 * Product CSV import/export — SPECIFICATION.md §7 "bulk CSV import/export" (v1.5 rules):
 *  - one row per colour (variant); product columns repeat on each of its rows;
 *  - matched by product `sku` and `variant_sku`: existing rows are updated, new ones created;
 *  - all-or-nothing: any error and nothing is written;
 *  - never changes existing stock. `opening_stock` may set the first stock of a colour that has
 *    no stock history yet (written as OPENING_BALANCE through the stock engine);
 *  - `cost_price` is used only for new products — existing products keep their weighted average cost;
 *  - sale prices, photos, home/hero flags are managed on the product page, not by CSV.
 */

export const PRODUCT_CSV_COLUMNS = [
  "sku",
  "brand",
  "model",
  "display_type",
  "quality_grade",
  "category",
  "retail_price_pkr",
  "wholesale_price_pkr",
  "cost_price",
  "low_stock_threshold",
  "warranty_days",
  "compatibility",
  "feature_tags",
  "description",
  "is_published",
  "variant_sku",
  "color",
  "variant_label",
  "bin_location",
  "current_stock",
  "opening_stock",
] as const;

const REQUIRED = ["sku", "brand", "model", "display_type", "quality_grade", "retail_price_pkr", "wholesale_price_pkr", "color"] as const;
export const MAX_IMPORT_ROWS = 2000;

/** Every live product colour, ready to edit in a spreadsheet and import back. */
export function exportProductsCsv(db: DB): string {
  const rows = db
    .select({ p: products, v: productVariants, category: categories.slug })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(isNull(products.archivedAt))
    .orderBy(asc(products.brand), asc(products.model), asc(productVariants.variantSku))
    .all();
  return toCsv(
    PRODUCT_CSV_COLUMNS,
    rows
      .filter((r) => !r.v.archivedAt)
      .map(({ p, v, category }) => [
        p.sku,
        p.brand,
        p.model,
        p.displayType,
        p.qualityGrade,
        category ?? "",
        p.retailPricePKR,
        p.wholesalePricePKR,
        p.costPrice,
        p.lowStockThreshold,
        p.warrantyDays,
        p.compatibility.join(" | "),
        p.featureTags.join(" | "),
        p.description ?? "",
        p.isPublished,
        v.variantSku,
        v.color,
        v.variantLabel ?? "",
        v.binLocation ?? "",
        v.currentStock,
        "",
      ]),
  );
}

const rupees = (label: string) =>
  z
    .string()
    .transform((s) => s.replaceAll(",", "").replace(/^rs\.?\s*/i, ""))
    .transform((s) => (s === "" ? Number.NaN : Number(s)))
    .pipe(z.number({ error: `${label} must be a number` }).min(0, `${label} can’t be negative`).max(10_000_000, `${label} looks too large`))
    .transform((n) => Math.round(n * 100) / 100);

const wholeNumber = (label: string, max: number) =>
  z
    .string()
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .pipe(z.number().max(max, `${label} is too large`));

const yesNo = z
  .string()
  .transform((s) => s.toLowerCase())
  .pipe(z.enum(["yes", "no", "true", "false", "1", "0", "y", "n"], { error: "is_published must be yes or no" }))
  .transform((s) => ["yes", "true", "1", "y"].includes(s));

const pipeList = (s: string) =>
  s
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

const ProductRow = z
  .object({
    sku: z
      .string()
      .transform((s) => s.toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9-]{3,40}$/, "sku: 3–40 capital letters, numbers or dashes")),
    brand: z.string().min(1, "brand is required"),
    model: z.string().min(1, "model is required").max(80),
    display_type: z.string().min(1, "display_type is required").max(60),
    quality_grade: z.string().min(1, "quality_grade is required").max(60),
    retail_price_pkr: rupees("retail_price_pkr").refine((n) => n > 0, "retail_price_pkr must be above 0"),
    wholesale_price_pkr: rupees("wholesale_price_pkr").refine((n) => n > 0, "wholesale_price_pkr must be above 0"),
  })
  .refine((r) => r.wholesale_price_pkr <= r.retail_price_pkr, "wholesale_price_pkr should not be higher than retail_price_pkr");

const VariantRow = z.object({
  variant_sku: z
    .string()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^([A-Z0-9-]{3,48})?$/, "variant_sku: capital letters, numbers or dashes")),
  color: z.string().min(1, "color is required").max(40),
  variant_label: z.string().max(40),
  bin_location: z.string().max(20),
});

/** Product-level columns that must be identical on every row of the same sku. */
const PRODUCT_COLUMNS = PRODUCT_CSV_COLUMNS.filter((c) => !["variant_sku", "color", "variant_label", "bin_location", "current_stock", "opening_stock"].includes(c));

export type ImportResult =
  | { ok: true; productsCreated: number; productsUpdated: number; variantsCreated: number; variantsUpdated: number; openingUnits: number }
  | { ok: false; errors: string[] };

type PlannedProduct = {
  existingId: string | null;
  sku: string;
  values: Partial<typeof products.$inferInsert>;
  variants: { existingId: string | null; variantSku: string; color: string; variantLabel: string | null; binLocation: string | null; openingStock: number }[];
};

export function importProductsCsv(db: DB, text: string, actor: { id: string }, ctx: AuditContext): ImportResult {
  let parsed: ReturnType<typeof csvRecords>;
  try {
    parsed = csvRecords(text);
  } catch (e) {
    if (e instanceof CsvParseError) return { ok: false, errors: [`The file isn’t valid CSV: ${e.message}.`] };
    throw e;
  }
  const { header, records } = parsed;
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) return { ok: false, errors: [`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Download the export to get the right headings.`] };
  if (records.length === 0) return { ok: false, errors: ["The file has headings but no rows."] };
  if (records.length > MAX_IMPORT_ROWS) return { ok: false, errors: [`The file has ${records.length} rows; the limit is ${MAX_IMPORT_ROWS}. Split it into smaller files.`] };

  const has = (c: string) => header.includes(c);
  const errors: string[] = [];
  const err = (row: number, msg: string) => errors.length < 50 && errors.push(`Row ${row}: ${msg}`);

  // Reference data
  const brandNames = new Set(db.select({ n: brands.name }).from(brands).all().map((b) => b.n));
  const categoryBySlug = new Map(db.select({ id: categories.id, slug: categories.slug }).from(categories).all().map((c) => [c.slug, c.id]));
  const existingProducts = new Map(db.select().from(products).all().map((p) => [p.sku, p]));
  const existingVariants = new Map(db.select().from(productVariants).all().map((v) => [v.variantSku, v]));
  const variantsWithHistory = new Set(
    db
      .selectDistinct({ id: stockLedger.variantId })
      .from(stockLedger)
      .all()
      .map((r) => r.id),
  );
  const usedSlugs = new Set(db.select({ s: products.slug }).from(products).all().map((p) => p.s));

  // Group rows by product sku (row numbers are spreadsheet rows: header is row 1)
  const groups = new Map<string, { row: number; rec: Record<string, string> }[]>();
  records.forEach((rec, i) => {
    const sku = (rec.sku ?? "").toUpperCase();
    const list = groups.get(sku) ?? [];
    list.push({ row: i + 2, rec });
    groups.set(sku, list);
  });

  const plans: PlannedProduct[] = [];
  const seenVariantSkus = new Set<string>();

  for (const [sku, rows] of groups) {
    const first = rows[0]!;
    // Product columns must agree across the product's rows
    for (const { row, rec } of rows.slice(1)) {
      const differs = PRODUCT_COLUMNS.filter((c) => has(c) && (rec[c] ?? "") !== (first.rec[c] ?? ""));
      if (differs.length) err(row, `product ${sku} has different ${differs.join(", ")} than on row ${first.row} — product details must match on every row of the same sku`);
    }

    const p = ProductRow.safeParse(first.rec);
    if (!p.success) {
      err(first.row, p.error.issues[0]?.message ?? "invalid product");
      continue;
    }
    const r = first.rec;
    if (!brandNames.has(p.data.brand)) err(first.row, `brand “${p.data.brand}” isn’t in Brands — add it there first (spelling must match)`);

    const existing = existingProducts.get(p.data.sku) ?? null;
    const values: Partial<typeof products.$inferInsert> = {
      brand: p.data.brand,
      model: p.data.model,
      displayType: p.data.display_type,
      qualityGrade: p.data.quality_grade,
      retailPricePKR: p.data.retail_price_pkr,
      wholesalePricePKR: p.data.wholesale_price_pkr,
    };

    if (has("category")) {
      const slug = (r.category ?? "").toLowerCase();
      if (slug && !categoryBySlug.has(slug)) err(first.row, `category “${r.category}” doesn’t exist — use the category’s web address, e.g. ${[...categoryBySlug.keys()][0] ?? "oled-screens"}`);
      values.categoryId = slug ? (categoryBySlug.get(slug) ?? null) : null;
    }
    for (const [col, key, max] of [
      ["low_stock_threshold", "lowStockThreshold", 1000],
      ["warranty_days", "warrantyDays", 365],
    ] as const) {
      if (has(col) && r[col]) {
        const n = wholeNumber(col, max).safeParse(r[col]);
        if (!n.success) err(first.row, n.error.issues[0]?.message ?? `${col} is invalid`);
        else values[key] = n.data;
      }
    }
    if (has("compatibility")) values.compatibility = pipeList(r.compatibility ?? "").slice(0, 30);
    if (has("feature_tags")) {
      const tags = pipeList(r.feature_tags ?? "");
      if (tags.length > 6 || tags.some((t) => t.length > 24)) err(first.row, "feature_tags: at most 6, each 24 characters or fewer");
      values.featureTags = tags.slice(0, 6);
    }
    if (has("description")) values.description = (r.description ?? "").slice(0, 2000) || null;
    if (has("is_published") && r.is_published) {
      const b = yesNo.safeParse(r.is_published);
      if (!b.success) err(first.row, b.error.issues[0]?.message ?? "is_published must be yes or no");
      else values.isPublished = b.data;
    }

    if (!existing) {
      const cost = has("cost_price") && r.cost_price ? rupees("cost_price").safeParse(r.cost_price) : null;
      if (cost && !cost.success) err(first.row, cost.error.issues[0]?.message ?? "cost_price is invalid");
      values.costPrice = cost?.success ? cost.data : 0;
      let slug = slugify(`${p.data.brand} ${p.data.model} ${p.data.quality_grade}`);
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(`${p.data.brand} ${p.data.model} ${p.data.quality_grade}`)}-${n}`;
      usedSlugs.add(slug);
      values.slug = slug;
    } else if (existing.salePricePKR !== null && p.data.retail_price_pkr <= existing.salePricePKR) {
      err(first.row, `retail_price_pkr ${p.data.retail_price_pkr} is at or below this product’s sale price (${existing.salePricePKR}) — change the sale price on the product page first`);
    }

    const plan: PlannedProduct = { existingId: existing?.id ?? null, sku: p.data.sku, values, variants: [] };
    for (const { row, rec } of rows) {
      const v = VariantRow.safeParse({
        variant_sku: rec.variant_sku ?? "",
        color: rec.color ?? "",
        variant_label: rec.variant_label ?? "",
        bin_location: rec.bin_location ?? "",
      });
      if (!v.success) {
        err(row, v.error.issues[0]?.message ?? "invalid colour");
        continue;
      }
      const vsku = v.data.variant_sku;
      const ev = vsku ? existingVariants.get(vsku) : undefined;
      if (vsku) {
        if (seenVariantSkus.has(vsku)) err(row, `variant_sku ${vsku} appears more than once in the file`);
        seenVariantSkus.add(vsku);
        if (ev && ev.productId !== existing?.id) err(row, `variant_sku ${vsku} belongs to a different product`);
      }
      let opening = 0;
      if (has("opening_stock") && rec.opening_stock) {
        const n = wholeNumber("opening_stock", 1_000_000).safeParse(rec.opening_stock);
        if (!n.success) err(row, n.error.issues[0]?.message ?? "opening_stock is invalid");
        else opening = n.data;
        if (opening > 0 && ev && variantsWithHistory.has(ev.id)) {
          err(row, `${vsku} already has stock history — opening_stock only works for colours with no stock yet. Use a stock count on the product page instead`);
        }
      }
      plan.variants.push({
        existingId: ev?.id ?? null,
        variantSku: vsku,
        color: v.data.color,
        variantLabel: v.data.variant_label || null,
        binLocation: v.data.bin_location || null,
        openingStock: opening,
      });
    }
    plans.push(plan);
  }

  if (errors.length) return { ok: false, errors };

  // Apply everything in one transaction
  const summary = { productsCreated: 0, productsUpdated: 0, variantsCreated: 0, variantsUpdated: 0, openingUnits: 0 };
  try {
    withStockTransaction(db, (tx) => {
      for (const plan of plans) {
        let productId = plan.existingId;
        const now = new Date().toISOString();
        if (productId) {
          const before = tx.select().from(products).where(eq(products.id, productId)).get();
          tx.update(products).set({ ...plan.values, updatedAt: now }).where(eq(products.id, productId)).run();
          writeAudit(tx, ctx, { actorId: actor.id, action: "product.update", entity: "products", entityId: productId, before, after: { ...plan.values, via: "csv" } });
          summary.productsUpdated += 1;
        } else {
          productId = crypto.randomUUID();
          tx.insert(products)
            .values({ ...(plan.values as typeof products.$inferInsert), id: productId, sku: plan.sku, updatedAt: now })
            .run();
          writeAudit(tx, ctx, { actorId: actor.id, action: "product.create", entity: "products", entityId: productId, after: { sku: plan.sku, ...plan.values, via: "csv" } });
          summary.productsCreated += 1;
        }

        const taken = new Set(
          tx
            .select({ s: productVariants.variantSku })
            .from(productVariants)
            .where(inArray(productVariants.productId, [productId]))
            .all()
            .map((x) => x.s),
        );
        for (const v of plan.variants) {
          let variantId = v.existingId;
          if (variantId) {
            tx.update(productVariants).set({ color: v.color, variantLabel: v.variantLabel, binLocation: v.binLocation }).where(eq(productVariants.id, variantId)).run();
            summary.variantsUpdated += 1;
          } else {
            let vsku = v.variantSku;
            for (let n = taken.size + 1; !vsku || taken.has(vsku); n++) vsku = `${plan.sku}-${String(n).padStart(2, "0")}`;
            taken.add(vsku);
            variantId = crypto.randomUUID();
            tx.insert(productVariants).values({ id: variantId, productId, color: v.color, variantLabel: v.variantLabel, binLocation: v.binLocation, variantSku: vsku }).run();
            summary.variantsCreated += 1;
          }
          if (v.openingStock > 0) {
            const cost = tx.select({ c: products.costPrice }).from(products).where(eq(products.id, productId)).get()!.c;
            applyStockMovement(tx, {
              variantId,
              delta: v.openingStock,
              type: "OPENING_BALANCE",
              referenceType: "COUNT",
              operatorId: actor.id,
              unitCostPaisa: toPaisa(cost),
              notes: "Opening stock from CSV import",
            });
            summary.openingUnits += v.openingStock;
          }
        }
      }
      writeAudit(tx, ctx, { actorId: actor.id, action: "product.import", entity: "products", after: summary });
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, errors: [`Nothing was imported: ${message}`] };
  }
  return { ok: true, ...summary };
}
