import type { ImageAngle } from "@/db/schema/catalog";
import type { PriceResult } from "@/server/pricing/price";

/** Shapes of the storefront catalogue rows (kept apart from catalog.ts so pure code can import them). */
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
