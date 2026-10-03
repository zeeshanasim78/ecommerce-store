import { and, eq, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { couponRedemptions, coupons } from "@/db/schema";
import type { CouponUsage, DiscountType } from "@/db/schema/discounts";
import { formatMoney, paisa, type Paisa } from "@/lib/money";
import { discountedAmount, isWithinWindow } from "./price";

/**
 * Coupon engine — SPECIFICATION.md §4.16 (v1.2).
 * `checkCoupon` is a read-only preview (cart page); `redeemCoupon` is the only way a coupon
 * is used, and must run inside the checkout transaction so the order and the redemption
 * succeed or fail together.
 */

export type CouponRule = {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  minOrderPaisa: number;
  maxDiscountPaisa: number | null;
  usage: CouponUsage;
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type CouponResult = { ok: true; couponId: string; code: string; discountPaisa: Paisa } | { ok: false; reason: string };

/** Codes are stored upper-case; shoppers can type them any way. */
export function normaliseCouponCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** Pure rule check for one coupon against an order subtotal. */
export function evaluateCoupon(coupon: CouponRule | undefined, subtotalPaisa: Paisa, now: Date = new Date()): CouponResult {
  if (!coupon || !coupon.isActive) return { ok: false, reason: "This code isn’t valid." };
  if (now.getTime() < Date.parse(coupon.startsAt)) return { ok: false, reason: "This code isn’t active yet." };
  if (!isWithinWindow(now, coupon.startsAt, coupon.endsAt)) return { ok: false, reason: "This code has expired." };
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return {
      ok: false,
      reason: coupon.usage === "SINGLE_USE" ? "This code has already been used." : "This code has reached its usage limit.",
    };
  }
  if (subtotalPaisa < coupon.minOrderPaisa) {
    const short = paisa(coupon.minOrderPaisa - subtotalPaisa);
    return { ok: false, reason: `Add ${formatMoney(short)} more to use this code.` };
  }

  let discount =
    coupon.discountType === "PERCENT"
      ? subtotalPaisa - (discountedAmount(subtotalPaisa, "PERCENT", coupon.value) ?? subtotalPaisa)
      : coupon.value;
  if (coupon.maxDiscountPaisa !== null) discount = Math.min(discount, coupon.maxDiscountPaisa);
  // An order is never made free by a coupon: keep at least Rs 1 payable.
  discount = Math.min(discount, subtotalPaisa - 100);
  if (discount <= 0) return { ok: false, reason: "This code doesn’t apply to this order." };

  return { ok: true, couponId: coupon.id, code: coupon.code, discountPaisa: paisa(discount) };
}

function loadCoupon(db: DB | Tx, code: string): CouponRule | undefined {
  return db.select().from(coupons).where(eq(coupons.code, normaliseCouponCode(code))).get();
}

/** Preview for the cart: does this code work for this subtotal right now? Changes nothing. */
export function checkCoupon(db: DB | Tx, code: string, subtotalPaisa: Paisa, now: Date = new Date()): CouponResult {
  return evaluateCoupon(loadCoupon(db, code), subtotalPaisa, now);
}

export class CouponRejectedError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}

/**
 * Uses a coupon for an order. MUST be called inside `db.transaction(..., { behavior: "immediate" })`.
 * The usage counter is incremented with a conditional UPDATE, so a single-use code can't be
 * claimed twice even by two checkouts at the same instant (same pattern as stock, spec §6.1).
 * Throws CouponRejectedError → the caller's transaction rolls back.
 */
export function redeemCoupon(
  tx: Tx,
  input: { code: string; orderId: string; subtotalPaisa: Paisa; customerPhone?: string | null; now?: Date },
): { couponId: string; discountPaisa: Paisa } {
  const now = input.now ?? new Date();
  const coupon = loadCoupon(tx, input.code);
  const result = evaluateCoupon(coupon, input.subtotalPaisa, now);
  if (!result.ok || !coupon) throw new CouponRejectedError(result.ok ? "This code isn’t valid." : result.reason);

  const nowIso = now.toISOString();
  const claimed = tx
    .update(coupons)
    .set({ redemptionCount: sql`${coupons.redemptionCount} + 1` })
    .where(
      and(
        eq(coupons.id, coupon.id),
        eq(coupons.isActive, true),
        sql`${coupons.startsAt} <= ${nowIso} AND ${coupons.endsAt} > ${nowIso}`,
        sql`(${coupons.maxRedemptions} IS NULL OR ${coupons.redemptionCount} < ${coupons.maxRedemptions})`,
      ),
    )
    .returning({ id: coupons.id })
    .all();

  if (claimed.length === 0) {
    throw new CouponRejectedError(coupon.usage === "SINGLE_USE" ? "This code has already been used." : "This code has reached its usage limit.");
  }

  tx.insert(couponRedemptions)
    .values({
      couponId: coupon.id,
      orderId: input.orderId,
      customerPhone: input.customerPhone ?? null,
      discountPaisa: result.discountPaisa,
      redeemedAt: nowIso,
    })
    .run();

  return { couponId: coupon.id, discountPaisa: result.discountPaisa };
}

/** Random, unambiguous code for the admin "Generate" button, e.g. CAIDEA-7KQ2-M9XP. */
export function generateCouponCode(prefix = "CAIDEA"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
