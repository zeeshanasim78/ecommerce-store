"use server";

import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { heroSlides, products } from "@/db/schema";
import { HERO_THEMES, HERO_VISUAL_TYPES, PHONE_LAYOUTS } from "@/db/schema/catalog";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { checked, file, optionalText, text } from "@/server/forms";
import { HERO_LIMIT_MESSAGE, activeSlideCount, syncHeroFlag } from "@/server/hero";
import { revalidateStorefront } from "@/server/revalidate";
import { UploadError, saveImage } from "@/server/uploads";

const back = (path: string, params: Record<string, string>) => redirect(`${path}?${new URLSearchParams(params)}`);

const SlideSchema = z
  .object({
    heading: z.string().min(3, "Add a heading.").max(90, "Keep the heading under 90 characters."),
    subheading: z.string().max(140).nullable(),
    bodyMd: z.string().max(800, "Keep the description under 800 characters.").nullable(),
    ctaLabel: z.string().min(2, "Add button text.").max(30),
    ctaHref: z
      .string()
      .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || v.startsWith("https://"), "The button link must start with / or https://"),
    productId: z.string().nullable(),
    visualType: z.enum(HERO_VISUAL_TYPES),
    visualUrl: z
      .string()
      .refine((v) => v.startsWith("/uploads/") || v.startsWith("https://"), "Image links must be an upload or start with https://")
      .nullable(),
    isActive: z.boolean(),
    theme: z.enum(HERO_THEMES),
    phoneLayout: z.enum(PHONE_LAYOUTS),
  })
  .refine((s) => s.visualType !== "IMAGE" || s.visualUrl, { message: "Upload an image or paste an image link for an image slide." });

export async function saveSlide(formData: FormData) {
  const staff = await requireStaff("hero");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/hero/${id}` : "/admin/hero/new";

  let visualUrl = optionalText(formData, "visualUrl");
  const upload = file(formData, "visualFile");
  if (upload) {
    try {
      visualUrl = await saveImage(upload, "hero");
    } catch (error) {
      if (error instanceof UploadError) back(formPath, { error: error.message });
      throw error;
    }
  }

  const parsed = SlideSchema.safeParse({
    heading: text(formData, "heading"),
    subheading: optionalText(formData, "subheading"),
    bodyMd: optionalText(formData, "bodyMd"),
    ctaLabel: text(formData, "ctaLabel"),
    ctaHref: text(formData, "ctaHref"),
    productId: optionalText(formData, "productId"),
    visualType: upload ? "IMAGE" : text(formData, "visualType") || "PHONE_3D",
    visualUrl,
    isActive: checked(formData, "isActive"),
    theme: text(formData, "theme") || "MIDNIGHT",
    phoneLayout: text(formData, "phoneLayout") || "RIGHT",
  });
  if (!parsed.success) back(formPath, { error: parsed.error.issues[0]?.message ?? "Check the form." });
  const data = parsed.data!;

  if (data.productId && !db.select({ id: products.id }).from(products).where(eq(products.id, data.productId)).get()) {
    back(formPath, { error: "That product no longer exists." });
  }
  if (data.isActive && activeSlideCount(db, id ?? undefined) >= 5) back(formPath, { error: HERO_LIMIT_MESSAGE });

  const ctx = await auditContext();
  const savedId = db.transaction(
    (tx) => {
      const before = id ? tx.select().from(heroSlides).where(eq(heroSlides.id, id)).get() : undefined;
      if (id && !before) throw new Error("Slide not found");
      let slideId = id;
      if (id) {
        tx.update(heroSlides).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(heroSlides.id, id)).run();
      } else {
        const last = tx.select({ sortOrder: heroSlides.sortOrder }).from(heroSlides).orderBy(asc(heroSlides.sortOrder)).all().at(-1);
        slideId = tx
          .insert(heroSlides)
          .values({ ...data, sortOrder: (last?.sortOrder ?? -1) + 1 })
          .returning({ id: heroSlides.id })
          .get().id;
      }
      syncHeroFlag(tx, data.productId);
      if (before?.productId !== data.productId) syncHeroFlag(tx, before?.productId);
      writeAudit(tx, ctx, { actorId: staff.id, action: id ? "hero.update" : "hero.create", entity: "hero_slides", entityId: slideId, before, after: data });
      return slideId!;
    },
    { behavior: "immediate" },
  );

  revalidateStorefront();
  back("/admin/hero", { saved: id ? "Slide updated." : "Slide added.", highlight: savedId });
}

export async function toggleSlide(formData: FormData) {
  const staff = await requireStaff("hero");
  const id = text(formData, "id");
  const slide = db.select().from(heroSlides).where(eq(heroSlides.id, id)).get();
  if (!slide) back("/admin/hero", { error: "Slide not found." });
  if (!slide!.isActive && activeSlideCount(db) >= 5) back("/admin/hero", { error: HERO_LIMIT_MESSAGE });

  const ctx = await auditContext();
  db.transaction(
    (tx) => {
      tx.update(heroSlides).set({ isActive: !slide!.isActive, updatedAt: new Date().toISOString() }).where(eq(heroSlides.id, id)).run();
      syncHeroFlag(tx, slide!.productId);
      writeAudit(tx, ctx, { actorId: staff.id, action: slide!.isActive ? "hero.deactivate" : "hero.activate", entity: "hero_slides", entityId: id });
    },
    { behavior: "immediate" },
  );
  revalidateStorefront();
  back("/admin/hero", { saved: slide!.isActive ? "Slide hidden." : "Slide is live." });
}

/** Swap a slide with its neighbour, then renumber 0..n so the order stays tidy. */
export async function moveSlide(formData: FormData) {
  const staff = await requireStaff("hero");
  const id = text(formData, "id");
  const direction = text(formData, "direction") === "up" ? -1 : 1;

  const ctx = await auditContext();
  db.transaction(
    (tx) => {
      const ordered = tx.select({ id: heroSlides.id }).from(heroSlides).orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt)).all();
      const index = ordered.findIndex((s) => s.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return;
      [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
      ordered.forEach((s, i) => tx.update(heroSlides).set({ sortOrder: i }).where(eq(heroSlides.id, s.id)).run());
      writeAudit(tx, ctx, { actorId: staff.id, action: "hero.reorder", entity: "hero_slides", entityId: id, after: ordered.map((s) => s.id) });
    },
    { behavior: "immediate" },
  );
  revalidateStorefront();
  back("/admin/hero", { saved: "Order updated.", highlight: id });
}

export async function deleteSlide(formData: FormData) {
  const staff = await requireStaff("hero");
  const id = text(formData, "id");
  const ctx = await auditContext();
  db.transaction(
    (tx) => {
      const slide = tx.select().from(heroSlides).where(eq(heroSlides.id, id)).get();
      if (!slide) return;
      tx.delete(heroSlides).where(eq(heroSlides.id, id)).run();
      syncHeroFlag(tx, slide.productId);
      writeAudit(tx, ctx, { actorId: staff.id, action: "hero.delete", entity: "hero_slides", entityId: id, before: slide });
    },
    { behavior: "immediate" },
  );
  revalidateStorefront();
  back("/admin/hero", { saved: "Slide deleted." });
}
