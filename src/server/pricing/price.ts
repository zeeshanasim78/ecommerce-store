import { paisa, type Paisa } from "@/lib/money";
import type { DiscountType, PromotionScope } from "@/db/schema/discounts";

/**
 * Effective price — SPECIFICATION.md §3 (v1.2).
 * Pure functions (no database access) so every rule is unit-tested.
 *
 *   final = min(retail, active product sale price, best active promotion price)
 *
 * PERCENT values are basis points (1500 = 15 %); FIXED values are paisa.
 * Time windows are [start, end): active from `start` up to, but not including, `end`.
 */

export type PricedProduct = {
  productId: string;
  brand: string;
  categoryId: string | null;
  retailPaisa: Paisa;
  salePaisa: Paisa | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
};

export type PromotionRule = {
  id: string;
  name: string;
  bannerText: string | null;
  discountType: DiscountType;
  value: number;
  scope: PromotionScope;
  scopeValue: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type PriceResult = {
  originalPaisa: Paisa;
  finalPaisa: Paisa;
  isDiscounted: boolean;
  savingPaisa: Paisa;
  /** Rounded whole percent for badges, e.g. 15 */
  percentOff: number;
  source: "SALE" | "PROMOTION" | null;
  promotion: { id: string; name: string; bannerText: string | null } | null;
};

/** True when `now` is inside [start, end). A missing bound is open-ended. */
export function isWithinWindow(now: Date, start: string | null, end: string | null): boolean {
  const t = now.getTime();
  if (start && t < Date.parse(start)) return false;
  if (end && t >= Date.parse(end)) return false;
  return true;
}

/**
 * Price after a discount, or null when the discount can't apply
 * (a fixed amount that would make the item free or negative).
 */
export function discountedAmount(amount: Paisa, type: DiscountType, value: number): Paisa | null {
  if (!Number.isInteger(value) || value <= 0) return null;
  if (type === "PERCENT") {
    if (value > 9000) return null; // never more than 90 % off
    return paisa(Math.round((amount * (10_000 - value)) / 10_000));
  }
  return value < amount ? paisa(amount - value) : null;
}

export function promotionApplies(promo: PromotionRule, product: PricedProduct, now: Date): boolean {
  if (!promo.isActive || !isWithinWindow(now, promo.startsAt, promo.endsAt)) return false;
  switch (promo.scope) {
    case "ALL":
      return true;
    case "BRAND":
      return promo.scopeValue === product.brand;
    case "CATEGORY":
      return product.categoryId !== null && promo.scopeValue === product.categoryId;
    case "PRODUCT":
      return promo.scopeValue === product.productId;
  }
}

export function effectivePrice(product: PricedProduct, promotions: readonly PromotionRule[], now: Date = new Date()): PriceResult {
  const original = product.retailPaisa;
  let best: Paisa = original;
  let source: PriceResult["source"] = null;
  let promotion: PriceResult["promotion"] = null;

  if (
    product.salePaisa !== null &&
    product.salePaisa > 0 &&
    product.salePaisa < original &&
    isWithinWindow(now, product.saleStartsAt, product.saleEndsAt)
  ) {
    best = product.salePaisa;
    source = "SALE";
  }

  for (const promo of promotions) {
    if (!promotionApplies(promo, product, now)) continue;
    const price = discountedAmount(original, promo.discountType, promo.value);
    if (price !== null && price < best) {
      best = price;
      source = "PROMOTION";
      promotion = { id: promo.id, name: promo.name, bannerText: promo.bannerText };
    }
  }

  const saving = paisa(original - best);
  return {
    originalPaisa: original,
    finalPaisa: best,
    isDiscounted: saving > 0,
    savingPaisa: saving,
    percentOff: original > 0 ? Math.round((saving / original) * 100) : 0,
    source,
    promotion: source === "PROMOTION" ? promotion : null,
  };
}
