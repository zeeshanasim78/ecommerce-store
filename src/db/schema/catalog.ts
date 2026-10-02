import { sqliteTable, text, integer, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { productVariants, products } from "./inventory";

/** Catalogue taxonomy, product galleries and hero slides — SPECIFICATION.md §4.16 (v1.2). */

export const IMAGE_ANGLES = ["FRONT", "BACK", "SIDE", "DETAIL"] as const;
export type ImageAngle = (typeof IMAGE_ANGLES)[number];

export const HERO_VISUAL_TYPES = ["PHONE_3D", "IMAGE"] as const;
export type HeroVisualType = (typeof HERO_VISUAL_TYPES)[number];

/** v1.3: per-slide colour themes, built only from the six Caidea tokens (spec §16). */
export const HERO_THEMES = ["MIDNIGHT", "TERRACOTTA", "AMBER", "CREAM", "DUSK"] as const;
export type HeroTheme = (typeof HERO_THEMES)[number];

/** v1.3: where and how big the 3D phone sits on the slide (spec §16). */
export const PHONE_LAYOUTS = ["RIGHT", "LOW_LEFT", "HIGH_RIGHT", "CENTER", "FAR_RIGHT"] as const;
export type PhoneLayout = (typeof PHONE_LAYOUTS)[number];

/** Max slides shown in the hero carousel (spec §0.3.1a: 4–5 slides). */
export const MAX_HERO_SLIDES = 5;

/** Brands. `name` matches the blueprint's free-text `products.brand`; a trigger keeps them in sync. */
export const brands = sqliteTable("brands", {
  id: id(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

export const categories = sqliteTable("categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

export const productImages = sqliteTable(
  "product_images",
  {
    id: id(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Set for colour-specific shots so swatches can swap the image */
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    angle: text("angle", { enum: IMAGE_ANGLES }).default("FRONT").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [check("product_images_angle", inList("angle", IMAGE_ANGLES)), index("product_images_product_idx").on(t.productId, t.sortOrder)],
);

export const heroSlides = sqliteTable(
  "hero_slides",
  {
    id: id(),
    heading: text("heading").notNull(),
    subheading: text("subheading"),
    /** Markdown (bold, italics, links, lists). Rendered without raw HTML, so it can't inject scripts. */
    bodyMd: text("body_md"),
    ctaLabel: text("cta_label").notNull(),
    ctaHref: text("cta_href").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    visualType: text("visual_type", { enum: HERO_VISUAL_TYPES }).default("PHONE_3D").notNull(),
    /** Image URL when visualType = IMAGE (an uploaded file under /uploads or an https URL) */
    visualUrl: text("visual_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    // v1.3 — allowed values are enforced by triggers in migration 0005 (adding CHECKs would rebuild the table)
    theme: text("theme", { enum: HERO_THEMES }).default("MIDNIGHT").notNull(),
    phoneLayout: text("phone_layout", { enum: PHONE_LAYOUTS }).default("RIGHT").notNull(),
  },
  (t) => [
    check("hero_slides_visual_type", inList("visual_type", HERO_VISUAL_TYPES)),
    check("hero_slides_image_needs_url", sql`${t.visualType} <> 'IMAGE' OR ${t.visualUrl} IS NOT NULL`),
    // Internal paths or https links only — never javascript: or data: URLs
    check("hero_slides_cta_href_safe", sql`${t.ctaHref} GLOB '/*' OR ${t.ctaHref} GLOB 'https://*'`),
    index("hero_slides_order_idx").on(t.isActive, t.sortOrder),
  ],
);
