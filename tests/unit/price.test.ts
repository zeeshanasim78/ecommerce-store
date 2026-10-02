import { describe, expect, it } from "vitest";
import { paisa } from "@/lib/money";
import { discountedAmount, effectivePrice, isWithinWindow, type PricedProduct, type PromotionRule } from "@/server/pricing/price";

const NOW = new Date("2026-10-02T09:00:00.000Z");
const product: PricedProduct = {
  productId: "p1",
  brand: "Samsung",
  categoryId: "cat-oled",
  retailPaisa: paisa(1_450_000), // Rs 14,500
  salePaisa: null,
  saleStartsAt: null,
  saleEndsAt: null,
};
const promo = (overrides: Partial<PromotionRule>): PromotionRule => ({
  id: "promo",
  name: "Test promotion",
  bannerText: null,
  discountType: "PERCENT",
  value: 1000,
  scope: "ALL",
  scopeValue: null,
  startsAt: "2026-10-01T00:00:00.000Z",
  endsAt: "2026-10-31T00:00:00.000Z",
  isActive: true,
  ...overrides,
});

describe("isWithinWindow", () => {
  it("treats the start as inclusive and the end as exclusive", () => {
    expect(isWithinWindow(new Date("2026-10-01T00:00:00.000Z"), "2026-10-01T00:00:00.000Z", "2026-10-02T00:00:00.000Z")).toBe(true);
    expect(isWithinWindow(new Date("2026-10-02T00:00:00.000Z"), "2026-10-01T00:00:00.000Z", "2026-10-02T00:00:00.000Z")).toBe(false);
  });
  it("treats missing bounds as open-ended", () => {
    expect(isWithinWindow(NOW, null, null)).toBe(true);
    expect(isWithinWindow(NOW, null, "2026-10-01T00:00:00.000Z")).toBe(false);
  });
});

describe("discountedAmount", () => {
  it("applies basis-point percentages and rounds to the nearest paisa", () => {
    expect(discountedAmount(paisa(1_450_000), "PERCENT", 1500)).toBe(1_232_500); // 15 % off Rs 14,500 = Rs 12,325
    expect(discountedAmount(paisa(333), "PERCENT", 1000)).toBe(300); // 299.7 → 300
  });
  it("applies fixed amounts in paisa", () => {
    expect(discountedAmount(paisa(1_450_000), "FIXED", 100_000)).toBe(1_350_000);
  });
  it("refuses discounts that would make the item free or exceed 90 %", () => {
    expect(discountedAmount(paisa(10_000), "FIXED", 10_000)).toBeNull();
    expect(discountedAmount(paisa(10_000), "PERCENT", 9500)).toBeNull();
    expect(discountedAmount(paisa(10_000), "PERCENT", 0)).toBeNull();
  });
});

describe("effectivePrice", () => {
  it("returns the retail price when nothing is active", () => {
    const r = effectivePrice(product, [], NOW);
    expect(r).toMatchObject({ finalPaisa: 1_450_000, isDiscounted: false, savingPaisa: 0, percentOff: 0, source: null });
  });

  it("uses a product sale price only inside its window", () => {
    const onSale = { ...product, salePaisa: paisa(1_300_000), saleStartsAt: "2026-10-01T00:00:00.000Z", saleEndsAt: "2026-10-05T00:00:00.000Z" };
    expect(effectivePrice(onSale, [], NOW)).toMatchObject({ finalPaisa: 1_300_000, source: "SALE", savingPaisa: 150_000, percentOff: 10 });
    expect(effectivePrice(onSale, [], new Date("2026-10-06T00:00:00.000Z")).isDiscounted).toBe(false);
  });

  it("ignores a sale price that isn't below retail", () => {
    expect(effectivePrice({ ...product, salePaisa: paisa(1_500_000) }, [], NOW).isDiscounted).toBe(false);
  });

  it("picks the lowest of sale price and promotions", () => {
    const onSale = { ...product, salePaisa: paisa(1_400_000) };
    const r = effectivePrice(onSale, [promo({ id: "a", value: 1000 }), promo({ id: "b", value: 2000, name: "Big sale" })], NOW);
    expect(r).toMatchObject({ finalPaisa: 1_160_000, source: "PROMOTION", promotion: { id: "b", name: "Big sale" } });
  });

  it("keeps the sale price when it beats every promotion", () => {
    const onSale = { ...product, salePaisa: paisa(1_000_000) };
    expect(effectivePrice(onSale, [promo({ value: 1000 })], NOW)).toMatchObject({ finalPaisa: 1_000_000, source: "SALE", promotion: null });
  });

  it("matches promotions by brand, category and product", () => {
    expect(effectivePrice(product, [promo({ scope: "BRAND", scopeValue: "Samsung" })], NOW).isDiscounted).toBe(true);
    expect(effectivePrice(product, [promo({ scope: "BRAND", scopeValue: "Apple" })], NOW).isDiscounted).toBe(false);
    expect(effectivePrice(product, [promo({ scope: "CATEGORY", scopeValue: "cat-oled" })], NOW).isDiscounted).toBe(true);
    expect(effectivePrice({ ...product, categoryId: null }, [promo({ scope: "CATEGORY", scopeValue: "cat-oled" })], NOW).isDiscounted).toBe(false);
    expect(effectivePrice(product, [promo({ scope: "PRODUCT", scopeValue: "p1" })], NOW).isDiscounted).toBe(true);
  });

  it("skips inactive, future and expired promotions", () => {
    expect(effectivePrice(product, [promo({ isActive: false })], NOW).isDiscounted).toBe(false);
    expect(effectivePrice(product, [promo({ startsAt: "2026-11-01T00:00:00.000Z", endsAt: "2026-11-30T00:00:00.000Z" })], NOW).isDiscounted).toBe(false);
    expect(effectivePrice(product, [promo({ startsAt: "2026-09-01T00:00:00.000Z", endsAt: "2026-10-01T00:00:00.000Z" })], NOW).isDiscounted).toBe(false);
  });
});
