import "server-only";
import { and, asc, eq, gt, inArray, isNull, like, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { brands, categories, heroSlides, productImages, productVariants, products, promotions } from "@/db/schema";
import { MAX_HERO_SLIDES, type HeroTheme, type ImageAngle, type PhoneLayout } from "@/db/schema/catalog";
import { toPaisa } from "@/lib/money";
import { effectivePrice, type PriceResult, type PromotionRule } from "@/server/pricing/price";

/**
 * Storefront catalogue reads (v1.2). Every price shown to shoppers goes through
 * effectivePrice(), so sale prices and promotions are applied the same way everywhere.
 */

export type CardImage = { url: string; alt: string; angle: ImageAngle; variantId: string | null };
export type CardVariant = { id: string; color: string; label: string | null; stock: number };
export type CatalogCard = {
  id: string;
  slug: string;
  brand: string;
  brandSlug: string;
  model: string;
  displayType: string;
  qualityGrade: string;
  description: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  compatibility: string[];
  featureTags: string[];
  warrantyDays: number;
  lowStockThreshold: number;
  totalStock: number;
  images: CardImage[];
  variants: CardVariant[];
  price: PriceResult;
};

export function getActivePromotions(now = new Date()): (PromotionRule & typeof promotions.$inferSelect)[] {
  const iso = now.toISOString();
  return db
    .select()
    .from(promotions)
    .where(and(eq(promotions.isActive, true), lte(promotions.startsAt, iso), gt(promotions.endsAt, iso)))
    .all();
}

/** The promotion shown in the site-wide banner, if any (newest first). */
export function getBannerPromotion(now = new Date()) {
  return getActivePromotions(now)
    .filter((p) => p.showBanner && p.bannerText)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0];
}

export type CatalogFilter = {
  brand?: string; // brand slug
  category?: string; // category slug
  q?: string;
  ids?: string[];
  featured?: boolean;
  discountedOnly?: boolean;
  limit?: number;
};

export function listCatalog(filter: CatalogFilter = {}): CatalogCard[] {
  const conditions: (SQL | undefined)[] = [eq(products.isPublished, true), isNull(products.archivedAt)];
  if (filter.brand) conditions.push(eq(brands.slug, filter.brand));
  if (filter.category) conditions.push(eq(categories.slug, filter.category));
  if (filter.featured) conditions.push(eq(products.isFeatured, true));
  if (filter.ids) conditions.push(filter.ids.length ? inArray(products.id, filter.ids) : sql`0`);
  if (filter.q) {
    const term = `%${filter.q.slice(0, 60)}%`;
    conditions.push(or(like(products.model, term), like(products.brand, term), like(products.compatibility, term), like(products.displayType, term)));
  }

  const rows = db
    .select({ p: products, brandSlug: brands.slug, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .innerJoin(brands, and(eq(brands.name, products.brand), eq(brands.isActive, true)))
    .leftJoin(categories, and(eq(categories.id, products.categoryId), eq(categories.isActive, true)))
    .where(and(...conditions))
    .orderBy(asc(brands.sortOrder), asc(products.brand), asc(products.model))
    .all();
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.p.id);
  const variants = db
    .select()
    .from(productVariants)
    .where(and(inArray(productVariants.productId, ids), isNull(productVariants.archivedAt)))
    .orderBy(asc(productVariants.variantSku))
    .all();
  const images = db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)).all();
  const promos = getActivePromotions();

  let cards = rows.map(({ p, brandSlug, categoryName, categorySlug }): CatalogCard => {
    const v = variants.filter((x) => x.productId === p.id);
    return {
      id: p.id,
      slug: p.slug,
      brand: p.brand,
      brandSlug,
      model: p.model,
      displayType: p.displayType,
      qualityGrade: p.qualityGrade,
      description: p.description,
      categoryName,
      categorySlug,
      compatibility: p.compatibility,
      featureTags: p.featureTags,
      warrantyDays: p.warrantyDays,
      lowStockThreshold: p.lowStockThreshold,
      totalStock: v.reduce((n, x) => n + x.currentStock, 0),
      variants: v.map((x) => ({ id: x.id, color: x.color, label: x.variantLabel, stock: x.currentStock })),
      images: images.filter((i) => i.productId === p.id).map((i) => ({ url: i.url, alt: i.alt, angle: i.angle, variantId: i.variantId })),
      price: effectivePrice(
        {
          productId: p.id,
          brand: p.brand,
          categoryId: p.categoryId,
          retailPaisa: toPaisa(p.retailPricePKR),
          salePaisa: p.salePricePKR === null ? null : toPaisa(p.salePricePKR),
          saleStartsAt: p.saleStartsAt,
          saleEndsAt: p.saleEndsAt,
        },
        promos,
      ),
    };
  });

  if (filter.discountedOnly) cards = cards.filter((c) => c.price.isDiscounted);
  return filter.limit ? cards.slice(0, filter.limit) : cards;
}

export function getProductBySlug(slug: string): CatalogCard | undefined {
  const row = db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
  return row ? listCatalog({ ids: [row.id] })[0] : undefined;
}

export type HeroSlideView = {
  id: string;
  heading: string;
  subheading: string | null;
  bodyMd: string | null;
  ctaLabel: string;
  ctaHref: string;
  visualType: "PHONE_3D" | "IMAGE";
  visualUrl: string | null;
  theme: HeroTheme;
  phoneLayout: PhoneLayout;
  product: CatalogCard | null;
};

export function getHeroSlides(): HeroSlideView[] {
  const slides = db.select().from(heroSlides).where(eq(heroSlides.isActive, true)).orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt)).limit(MAX_HERO_SLIDES).all();
  const productIds = slides.map((s) => s.productId).filter((x): x is string => Boolean(x));
  const cards = new Map(listCatalog({ ids: productIds }).map((c) => [c.id, c]));
  return slides.map((s) => ({
    id: s.id,
    heading: s.heading,
    subheading: s.subheading,
    bodyMd: s.bodyMd,
    ctaLabel: s.ctaLabel,
    ctaHref: s.ctaHref,
    visualType: s.visualType,
    visualUrl: s.visualUrl,
    theme: s.theme,
    phoneLayout: s.phoneLayout,
    // A slide whose product was unpublished keeps working, just without product details
    product: s.productId ? (cards.get(s.productId) ?? null) : null,
  }));
}

export type BrandSummary = { name: string; slug: string; logoUrl: string | null; count: number };

export function getBrandSummaries(): BrandSummary[] {
  return db
    .select({ name: brands.name, slug: brands.slug, logoUrl: brands.logoUrl, count: sql<number>`count(${products.id})` })
    .from(brands)
    .innerJoin(products, and(eq(products.brand, brands.name), eq(products.isPublished, true), isNull(products.archivedAt)))
    .where(eq(brands.isActive, true))
    .groupBy(brands.id)
    .orderBy(asc(brands.sortOrder), asc(brands.name))
    .all();
}

export type CategorySummary = { name: string; slug: string; description: string | null; count: number };

export function getCategorySummaries(): CategorySummary[] {
  return db
    .select({ name: categories.name, slug: categories.slug, description: categories.description, count: sql<number>`count(${products.id})` })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isPublished, true), isNull(products.archivedAt)))
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
    .all();
}
