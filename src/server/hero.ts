import "server-only";
import { and, count, eq } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { heroSlides, products } from "@/db/schema";
import { MAX_HERO_SLIDES } from "@/db/schema/catalog";

/** Keeps products.is_featured_hero equal to "this product has an active hero slide" (spec §4.16). */
export function syncHeroFlag(tx: DB | Tx, productId: string | null | undefined) {
  if (!productId) return;
  const active = tx
    .select({ n: count() })
    .from(heroSlides)
    .where(and(eq(heroSlides.productId, productId), eq(heroSlides.isActive, true)))
    .all()[0]?.n;
  tx.update(products).set({ isFeaturedHero: (active ?? 0) > 0 }).where(eq(products.id, productId)).run();
}

export function activeSlideCount(tx: DB | Tx, excludeId?: string): number {
  return tx
    .select({ id: heroSlides.id })
    .from(heroSlides)
    .where(eq(heroSlides.isActive, true))
    .all()
    .filter((s) => s.id !== excludeId).length;
}

export const HERO_LIMIT_MESSAGE = `The carousel shows at most ${MAX_HERO_SLIDES} slides. Turn another slide off first.`;
