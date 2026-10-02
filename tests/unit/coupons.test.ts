import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { couponRedemptions, coupons, orders } from "@/db/schema";
import { paisa } from "@/lib/money";
import {
  CouponRejectedError,
  checkCoupon,
  evaluateCoupon,
  generateCouponCode,
  normaliseCouponCode,
  redeemCoupon,
  type CouponRule,
} from "@/server/pricing/coupons";
import { testDb } from "../helpers/db";

const NOW = new Date("2026-10-02T09:00:00.000Z");
const rule = (o: Partial<CouponRule> = {}): CouponRule => ({
  id: "c1",
  code: "EID10",
  discountType: "PERCENT",
  value: 1000,
  minOrderPaisa: 0,
  maxDiscountPaisa: null,
  usage: "MULTI_USE",
  maxRedemptions: null,
  redemptionCount: 0,
  startsAt: "2026-10-01T00:00:00.000Z",
  endsAt: "2026-10-31T00:00:00.000Z",
  isActive: true,
  ...o,
});

describe("evaluateCoupon (pure rules)", () => {
  it("applies a percentage off the subtotal", () => {
    expect(evaluateCoupon(rule(), paisa(2_000_000), NOW)).toEqual({ ok: true, couponId: "c1", code: "EID10", discountPaisa: 200_000 });
  });
  it("applies a fixed PKR amount", () => {
    expect(evaluateCoupon(rule({ discountType: "FIXED", value: 50_000 }), paisa(2_000_000), NOW)).toMatchObject({ ok: true, discountPaisa: 50_000 });
  });
  it("caps percentage discounts at max_discount_paisa", () => {
    expect(evaluateCoupon(rule({ value: 5000, maxDiscountPaisa: 100_000 }), paisa(2_000_000), NOW)).toMatchObject({ discountPaisa: 100_000 });
  });
  it("never makes an order free", () => {
    expect(evaluateCoupon(rule({ discountType: "FIXED", value: 900_000 }), paisa(500_000), NOW)).toMatchObject({ ok: true, discountPaisa: 499_900 });
  });
  it("enforces the minimum order with a helpful message", () => {
    const r = evaluateCoupon(rule({ minOrderPaisa: 1_000_000 }), paisa(750_000), NOW);
    expect(r).toEqual({ ok: false, reason: "Add Rs 2,500 more to use this code." });
  });
  it("respects start and end times", () => {
    expect(evaluateCoupon(rule({ startsAt: "2026-10-03T00:00:00.000Z" }), paisa(100_000), NOW)).toEqual({ ok: false, reason: "This code isn’t active yet." });
    expect(evaluateCoupon(rule({ endsAt: "2026-10-02T09:00:00.000Z" }), paisa(100_000), NOW)).toEqual({ ok: false, reason: "This code has expired." });
  });
  it("rejects inactive, unknown and used-up codes", () => {
    expect(evaluateCoupon(undefined, paisa(100_000), NOW).ok).toBe(false);
    expect(evaluateCoupon(rule({ isActive: false }), paisa(100_000), NOW).ok).toBe(false);
    expect(evaluateCoupon(rule({ usage: "SINGLE_USE", maxRedemptions: 1, redemptionCount: 1 }), paisa(100_000), NOW)).toEqual({
      ok: false,
      reason: "This code has already been used.",
    });
  });
});

describe("code helpers", () => {
  it("normalises what shoppers type", () => {
    expect(normaliseCouponCode("  eid 10 ")).toBe("EID10");
  });
  it("generates codes the database accepts", () => {
    for (let i = 0; i < 50; i++) expect(generateCouponCode()).toMatch(/^CAIDEA-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});

describe("redeemCoupon (database)", () => {
  let db: DB;
  let orderSeq = 0;

  const createOrder = (tx: Parameters<Parameters<DB["transaction"]>[0]>[0]) => {
    orderSeq += 1;
    const id = `order-${orderSeq}`;
    tx.insert(orders)
      .values({
        id,
        code: `CA-ORD-TEST-${orderSeq}`,
        channel: "ONLINE",
        guestPhone: "+923001234567",
        subtotalPaisa: 2_000_000,
        totalPaisa: 2_000_000,
        paymentMethod: "COD",
        idempotencyKey: `idem-${orderSeq}`,
      })
      .run();
    return id;
  };

  const checkout = (code: string) =>
    db.transaction(
      (tx) => {
        const orderId = createOrder(tx);
        return redeemCoupon(tx, { code, orderId, subtotalPaisa: paisa(2_000_000), now: NOW });
      },
      { behavior: "immediate" },
    );

  beforeEach(() => {
    db = testDb();
    db.insert(coupons)
      .values([
        { id: "single", code: "WELCOME-ONCE", discountType: "FIXED", value: 50_000, usage: "SINGLE_USE", maxRedemptions: 1, startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-10-31T00:00:00.000Z" },
        { id: "multi", code: "EID10", discountType: "PERCENT", value: 1000, usage: "MULTI_USE", maxRedemptions: 3, startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-10-31T00:00:00.000Z" },
      ])
      .run();
  });

  it("records the redemption and increments the counter", () => {
    expect(checkout("welcome-once")).toEqual({ couponId: "single", discountPaisa: 50_000 });
    expect(db.select().from(coupons).where(eq(coupons.id, "single")).get()?.redemptionCount).toBe(1);
    expect(db.select().from(couponRedemptions).all()).toHaveLength(1);
  });

  it("refuses a single-use code the second time and rolls that whole order back", () => {
    checkout("WELCOME-ONCE");
    expect(() => checkout("WELCOME-ONCE")).toThrow(CouponRejectedError);
    expect(db.select().from(orders).all()).toHaveLength(1); // the second order was rolled back
    expect(db.select().from(couponRedemptions).all()).toHaveLength(1);
    expect(checkCoupon(db, "WELCOME-ONCE", paisa(2_000_000), NOW)).toEqual({ ok: false, reason: "This code has already been used." });
  });

  it("stops a multi-use code at its limit", () => {
    checkout("EID10");
    checkout("EID10");
    checkout("EID10");
    expect(() => checkout("EID10")).toThrow("This code has reached its usage limit.");
    expect(db.select().from(coupons).where(eq(coupons.id, "multi")).get()?.redemptionCount).toBe(3);
  });

  it("is backed by a database constraint even if code is bypassed", () => {
    expect(() => db.$client.prepare("UPDATE coupons SET redemption_count = 2 WHERE id = 'single'").run()).toThrow(/coupons_redemptions/);
    expect(() =>
      db.$client
        .prepare("INSERT INTO coupons (id, code, discount_type, value, usage, max_redemptions, starts_at, ends_at) VALUES ('x', 'bad code', 'FIXED', 1, 'MULTI_USE', NULL, '2026-01-01', '2026-02-01')")
        .run(),
    ).toThrow(/coupons_code_format/);
  });
});
