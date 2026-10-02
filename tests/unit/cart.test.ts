import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { coupons, products, productVariants, promotions, SYSTEM_USER_ID } from "@/db/schema";
import { applyStockMovement, withStockTransaction } from "@/server/inventory/stock";
import { CartInputSchema, quoteCart } from "@/server/storefront/cart";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 7 — the cart is re-priced from the database every time (spec §6.3 step 1). */

const NOW = new Date("2026-10-03T09:00:00.000Z");
let db: DB;

function publishedVariant(stock: number, suffix = "1") {
  const ids = createVariant(db, stock, suffix); // retail Rs 1,500, low-stock alert at 5
  db.update(products).set({ isPublished: true }).where(eq(products.id, ids.productId)).run();
  return ids;
}

beforeEach(() => {
  db = testDb();
});

describe("quoteCart", () => {
  it("prices lines from the database, not from the browser", () => {
    const { variantId } = publishedVariant(10);
    const q = quoteCart(db, { lines: [{ variantId, qty: 2 }] }, NOW);
    expect(q.lines[0]).toMatchObject({ status: "ok", qty: 2, unitPaisa: 150_000, lineTotalPaisa: 300_000, color: "Black", lowStock: false });
    expect(q.lines[0]!.product).toMatchObject({ brand: "Samsung", model: "Galaxy Test 1", grade: "OEM Original" });
    expect(q).toMatchObject({ itemCount: 2, subtotalPaisa: 300_000, ready: true, totalBeforeDeliveryPaisa: 300_000 });
  });

  it("applies the product sale price and active promotions like the catalogue does", () => {
    const a = publishedVariant(10, "a");
    const b = publishedVariant(10, "b");
    db.update(products).set({ salePricePKR: 1200 }).where(eq(products.id, a.productId)).run();
    db.insert(promotions).values({ name: "Samsung week", discountType: "PERCENT", value: 1000, scope: "PRODUCT", scopeValue: b.productId, startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-10-10T00:00:00.000Z", isActive: true }).run();

    const q = quoteCart(db, { lines: [{ variantId: a.variantId, qty: 1 }, { variantId: b.variantId, qty: 1 }] }, NOW);
    expect(q.lines.map((l) => [l.unitPaisa, l.originalUnitPaisa])).toEqual([
      [120_000, 150_000],
      [135_000, 150_000],
    ]);
    expect(q.savingsPaisa).toBe(45_000);
  });

  it("flags short and sold-out lines and only counts units that can be bought", () => {
    const short = publishedVariant(2, "s");
    const gone = publishedVariant(0, "g");
    const q = quoteCart(db, { lines: [{ variantId: short.variantId, qty: 5 }, { variantId: gone.variantId, qty: 1 }] }, NOW);
    expect(q.lines.map((l) => [l.status, l.available, l.lineTotalPaisa])).toEqual([
      ["short", 2, 300_000],
      ["sold_out", 0, 0],
    ]);
    expect(q.lines[0]!.lowStock).toBe(true);
    expect(q).toMatchObject({ itemCount: 2, subtotalPaisa: 300_000, ready: false });
  });

  it("reflects a sale made after the item was added (the Done-when case)", () => {
    const { variantId } = publishedVariant(1);
    expect(quoteCart(db, { lines: [{ variantId, qty: 1 }] }, NOW).lines[0]!.status).toBe("ok");
    withStockTransaction(db, (tx) => applyStockMovement(tx, { variantId, delta: -1, type: "COUNTER_POS", operatorId: SYSTEM_USER_ID }));
    expect(quoteCart(db, { lines: [{ variantId, qty: 1 }] }, NOW).lines[0]!.status).toBe("sold_out");
  });

  it("treats unpublished, archived and unknown screens as unavailable", () => {
    const hidden = createVariant(db, 5, "h"); // never published
    const archived = publishedVariant(5, "a");
    db.update(productVariants).set({ archivedAt: NOW.toISOString() }).where(eq(productVariants.id, archived.variantId)).run();
    const q = quoteCart(db, { lines: [{ variantId: hidden.variantId, qty: 1 }, { variantId: archived.variantId, qty: 1 }, { variantId: "nope", qty: 1 }] }, NOW);
    expect(q.lines.map((l) => l.status)).toEqual(["unavailable", "unavailable", "unavailable"]);
    expect(q.lines[0]!.product).toBeNull(); // nothing about a hidden product is revealed
    expect(q.subtotalPaisa).toBe(0);
  });

  it("merges repeated lines for the same colour", () => {
    const { variantId } = publishedVariant(10);
    const q = quoteCart(db, { lines: [{ variantId, qty: 2 }, { variantId, qty: 3 }] }, NOW);
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]!.qty).toBe(5);
  });

  it("previews a coupon against the subtotal without using it up", () => {
    const { variantId } = publishedVariant(10);
    db.insert(coupons).values({ code: "EID10", discountType: "PERCENT", value: 1000, usage: "MULTI_USE", startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-10-31T00:00:00.000Z" }).run();
    const ok = quoteCart(db, { lines: [{ variantId, qty: 2 }], coupon: "eid10" }, NOW);
    expect(ok.coupon).toEqual({ code: "EID10", ok: true, discountPaisa: 30_000 });
    expect(ok.totalBeforeDeliveryPaisa).toBe(270_000);
    expect(db.select().from(coupons).get()!.redemptionCount).toBe(0);

    const bad = quoteCart(db, { lines: [{ variantId, qty: 2 }], coupon: "NOPE" }, NOW);
    expect(bad.coupon).toMatchObject({ code: "NOPE", ok: false });
    expect(bad.totalBeforeDeliveryPaisa).toBe(300_000);
  });

  it("rejects malformed carts sent by a browser", () => {
    expect(CartInputSchema.safeParse({ lines: [{ variantId: "x", qty: 0 }] }).success).toBe(false);
    expect(CartInputSchema.safeParse({ lines: [{ variantId: "x", qty: 1.5 }] }).success).toBe(false);
    expect(CartInputSchema.safeParse({ lines: [{ variantId: "x", qty: 1, price: 1 }] }).success).toBe(true); // extra fields like a price are ignored
    expect(CartInputSchema.safeParse({ lines: Array.from({ length: 31 }, (_, i) => ({ variantId: `v${i}`, qty: 1 })) }).success).toBe(false);
  });
});
