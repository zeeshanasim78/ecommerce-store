import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { couponRedemptions, coupons, deliveryZones, orderItems, orders, payments, products, productVariants, stockLedger, SYSTEM_USER_ID } from "@/db/schema";
import { findLedgerDrift } from "@/server/inventory/stock";
import { expireUnpaidOrders, findCustomerOrder, placeOrder, submitTransactionId, TidError, type CheckoutInput } from "@/server/orders/checkout";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { getCheckoutSettings, writeSetting } from "@/server/settings/store-settings";
import { settings as settingsTable } from "@/db/schema";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 8 — checkout (SPECIFICATION.md §6.3, §8). */

let db: DB;
let lahore: string;
let gwadar: string;

const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const orderCount = () => db.select().from(orders).all().length;

function published(stock: number, suffix = "1") {
  const ids = createVariant(db, stock, suffix); // Rs 1,500 each
  db.update(products).set({ isPublished: true }).where(eq(products.id, ids.productId)).run();
  return ids.variantId;
}

const form = (variantId: string, extra: Partial<CheckoutInput> = {}): CheckoutInput => ({
  idempotencyKey: crypto.randomUUID(),
  name: "Ayesha Khan",
  phone: "0300 1234567",
  email: "ayesha@example.com",
  line1: "House 12, Street 4, Gulberg III",
  cityId: lahore,
  method: "COD",
  lines: [{ variantId, qty: 1 }],
  ...extra,
});

beforeEach(() => {
  db = testDb();
  lahore = crypto.randomUUID();
  gwadar = crypto.randomUUID();
  db.insert(deliveryZones)
    .values([
      { id: lahore, city: "Lahore", province: "Punjab", shippingFeePaisa: 25_000, codFeePaisa: 5_000, etaMinDays: 1, etaMaxDays: 2, mapX: 1, mapY: 1 },
      { id: gwadar, city: "Gwadar", province: "Balochistan", shippingFeePaisa: 60_000, codAvailable: false, etaMinDays: 4, etaMaxDays: 7, mapX: 2, mapY: 2 },
    ])
    .run();
  writeSetting(db, "enabled_payment_methods", ["COD", "JAZZCASH", "EASYPAISA", "NAYAPAY", "BANK_TRANSFER"], SYSTEM_USER_ID);
  writeSetting(db, "manual_tid_ttl_minutes", 24 * 60, SYSTEM_USER_ID);
  // v1.8: COD limit and account numbers come from the environment
  for (const k of PAYMENT_ENV_KEYS) delete process.env[k];
  Object.assign(process.env, { COD_MAX_ORDER_PKR: "5000", JAZZCASH_ACCOUNT_TITLE: "Caidea", JAZZCASH_ACCOUNT_NUMBER: "0300-1112223" });
});

const savedEnv = Object.fromEntries(PAYMENT_ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of PAYMENT_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("placeOrder", () => {
  it("places a COD order: re-priced, fees added, stock out through the ledger", () => {
    const v = published(5);
    const r = placeOrder(db, form(v, { lines: [{ variantId: v, qty: 2 }] }));
    expect(r).toMatchObject({ ok: true, repeated: false, method: "COD", totalPaisa: 330_000 }); // 2 × 1,500 + 250 delivery + 50 COD fee
    if (!r.ok) return;
    expect(r.code).toMatch(/^CA-ORD-\d{6}-0001$/);

    const o = db.select().from(orders).where(eq(orders.id, r.orderId)).get()!;
    expect(o).toMatchObject({ channel: "ONLINE", subtotalPaisa: 300_000, shippingFeePaisa: 25_000, codFeePaisa: 5_000, paymentStatus: "COD_PENDING", fulfillmentStatus: "CONFIRMED", guestPhone: "+923001234567" });
    expect(o.shippingAddress).toMatchObject({ city: "Lahore", name: "Ayesha Khan" });
    expect(db.select().from(orderItems).where(eq(orderItems.orderId, r.orderId)).get()).toMatchObject({ quantity: 2, unitPricePaisa: 150_000, unitCostPaisa: 100_000, lineTotalPaisa: 300_000 });
    expect(stockOf(v)).toBe(3);
    expect(db.select().from(stockLedger).where(eq(stockLedger.referenceId, r.orderId)).get()).toMatchObject({ transactionType: "STORE_SALE", quantityChanged: -2, operatorId: SYSTEM_USER_ID, referenceType: "ORDER" });
    expect(db.select().from(payments).where(eq(payments.orderId, r.orderId)).get()).toMatchObject({ provider: "CASH", status: "INITIATED", amountPaisa: 330_000 });
  });

  it("a repeated submit (double click) returns the same order and takes stock once", () => {
    const v = published(5);
    const f = form(v);
    const a = placeOrder(db, f);
    const b = placeOrder(db, f);
    expect(a.ok && b.ok && a.code === b.code).toBe(true);
    expect(b).toMatchObject({ repeated: true });
    expect(orderCount()).toBe(1);
    expect(stockOf(v)).toBe(4);
  });

  it("two shoppers, one last unit: the second gets a friendly sold-out answer and nothing is saved", () => {
    const v = published(1);
    expect(placeOrder(db, form(v)).ok).toBe(true);
    const second = placeOrder(db, form(v, { phone: "0321 7654321" }));
    expect(second).toMatchObject({ ok: false, kind: "SOLD_OUT", problemLines: [{ variantId: v, status: "sold_out", available: 0 }] });
    expect(second.ok ? "" : second.message).toMatch(/just sold out/);
    expect(orderCount()).toBe(1);
    expect(stockOf(v)).toBe(0);
  });

  it("refuses when the price changed since the review step", () => {
    const v = published(5);
    const r = placeOrder(db, form(v, { expectedTotalPaisa: 100 }));
    expect(r).toMatchObject({ ok: false, kind: "PRICE_CHANGED", totalPaisa: 180_000 });
    expect(orderCount()).toBe(0);
  });

  it("enforces cash-on-delivery rules: city and order limit", () => {
    const v = published(10);
    expect(placeOrder(db, form(v, { cityId: gwadar }))).toMatchObject({ ok: false, kind: "PAYMENT" });
    const big = placeOrder(db, form(v, { lines: [{ variantId: v, qty: 4 }] })); // Rs 6,300 > Rs 5,000 limit
    expect(big).toMatchObject({ ok: false, kind: "PAYMENT" });
    expect(big.ok ? "" : big.message).toMatch(/up to Rs 5,000/);
    expect(stockOf(v)).toBe(10);
  });

  it("only offers wallets whose account number is set", () => {
    const v = published(5);
    expect(placeOrder(db, form(v, { method: "EASYPAISA" }))).toMatchObject({ ok: false, kind: "PAYMENT" }); // no Easypaisa account
    expect(placeOrder(db, form(v, { method: "BANK_TRANSFER" }))).toMatchObject({ ok: false, kind: "PAYMENT" }); // no bank details
    expect(placeOrder(db, form(v, { method: "JAZZCASH" }))).toMatchObject({ ok: true });
  });

  it("an order above the COD limit can still be placed by wallet or bank transfer (v1.8)", () => {
    const v = published(10);
    Object.assign(process.env, { BANK_NAME: "Meezan Bank", BANK_ACCOUNT_TITLE: "Caidea Traders", BANK_IBAN: "PK40MEZN0000001123456702" });
    const four = { lines: [{ variantId: v, qty: 4 }] }; // Rs 6,000 + delivery > Rs 5,000 limit
    expect(placeOrder(db, form(v, four))).toMatchObject({ ok: false, kind: "PAYMENT" });
    expect(placeOrder(db, form(v, { ...four, method: "JAZZCASH" }))).toMatchObject({ ok: true, totalPaisa: 600_000 }); // no COD fee, and v1.12: free delivery when paying in advance
    expect(placeOrder(db, form(v, { ...four, method: "BANK_TRANSFER", phone: "0321 7654321" }))).toMatchObject({ ok: true });
  });

  it("changing COD_MAX_ORDER_PKR changes the limit without a code change", () => {
    const v = published(10);
    const four = { lines: [{ variantId: v, qty: 4 }] };
    expect(placeOrder(db, form(v, four))).toMatchObject({ ok: false, kind: "PAYMENT" });
    process.env.COD_MAX_ORDER_PKR = "20000";
    expect(placeOrder(db, form(v, four))).toMatchObject({ ok: true, method: "COD" });
  });

  it("validates contact details — email is required (v1.11)", () => {
    const v = published(5);
    expect(placeOrder(db, form(v, { email: "" }))).toMatchObject({ ok: false, kind: "INVALID", message: expect.stringMatching(/valid email/) });
    expect(placeOrder(db, { ...form(v), email: undefined })).toMatchObject({ ok: false, kind: "INVALID", message: expect.stringMatching(/email/) });
    expect(placeOrder(db, form(v, { email: "not-an-email" }))).toMatchObject({ ok: false, kind: "INVALID" });
    expect(placeOrder(db, form(v, { phone: "12345" }))).toMatchObject({ ok: false, kind: "INVALID", message: expect.stringMatching(/mobile number/) });
    expect(placeOrder(db, form(v, { cityId: "nowhere" }))).toMatchObject({ ok: false, kind: "INVALID" });
    expect(placeOrder(db, form(v, { lines: [] }))).toMatchObject({ ok: false, kind: "INVALID" });
  });

  it("redeems a coupon inside the order, and a single-use code works only once", () => {
    const v = published(10);
    db.insert(coupons).values({ code: "ONCE", discountType: "FIXED", value: 20_000, usage: "SINGLE_USE", maxRedemptions: 1, startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2099-01-01T00:00:00.000Z" }).run();
    const a = placeOrder(db, form(v, { coupon: "once" }));
    expect(a).toMatchObject({ ok: true, totalPaisa: 160_000 }); // 1,500 − 200 + 250 + 50
    const b = placeOrder(db, form(v, { coupon: "ONCE", phone: "0321 7654321" }));
    expect(b).toMatchObject({ ok: false, kind: "COUPON" });
    expect(stockOf(v)).toBe(9); // the rejected order took nothing
  });

  it("wallet orders: TID at checkout, duplicate TIDs refused, TID can be added later", () => {
    const v = published(10);
    const withTid = placeOrder(db, form(v, { method: "JAZZCASH", tid: "TX12345678", payerPhone: "03331234567" }));
    expect(withTid).toMatchObject({ ok: true });
    if (!withTid.ok) return;
    expect(db.select().from(orders).where(eq(orders.id, withTid.orderId)).get()).toMatchObject({ paymentStatus: "PENDING_VERIFICATION", fulfillmentStatus: "NEW", codFeePaisa: 0 });
    expect(db.select().from(payments).where(eq(payments.orderId, withTid.orderId)).get()).toMatchObject({ provider: "MANUAL", manualReference: "TX12345678", payerMsisdn: "+923331234567", status: "PENDING" });

    expect(placeOrder(db, form(v, { method: "JAZZCASH", tid: "tx12345678" }))).toMatchObject({ ok: false, kind: "PAYMENT" });

    const later = placeOrder(db, form(v, { method: "JAZZCASH" }));
    if (!later.ok) throw new Error("expected order");
    expect(db.select().from(orders).where(eq(orders.id, later.orderId)).get()!.paymentStatus).toBe("UNPAID");
    expect(() => submitTransactionId(db, { code: later.code, phone: "0399 0000000", tid: "TX99999999" })).toThrow(TidError);
    expect(() => submitTransactionId(db, { code: later.code, phone: "0300 1234567", tid: "TX12345678" })).toThrow(/already been used/);
    submitTransactionId(db, { code: later.code, phone: "0300-1234567", tid: "TX99999999" });
    expect(db.select().from(orders).where(eq(orders.id, later.orderId)).get()!.paymentStatus).toBe("PENDING_VERIFICATION");
  });

  it("shows an order only to someone with the right phone number", () => {
    const v = published(5);
    const r = placeOrder(db, form(v));
    if (!r.ok) throw new Error("expected order");
    expect(findCustomerOrder(db, r.code.toLowerCase(), "+92 300 1234567")?.order.id).toBe(r.orderId);
    expect(findCustomerOrder(db, r.code, "0300 7654321")).toBeNull();
  });
});

describe("v1.11 — prepaid ordering and the COD switch", () => {
  it("COD paused in Shop settings: COD refused with a clear message, bank / wallet orders still go through", () => {
    const v = published(5);
    writeSetting(db, "enabled_payment_methods", ["JAZZCASH", "BANK_TRANSFER"], SYSTEM_USER_ID);
    const cod = placeOrder(db, form(v));
    expect(cod).toMatchObject({ ok: false, kind: "PAYMENT", message: expect.stringMatching(/paused/) });
    const jc = placeOrder(db, form(v, { method: "JAZZCASH" }));
    expect(jc).toMatchObject({ ok: true, method: "JAZZCASH" });
    if (!jc.ok) return;
    expect(db.select().from(orders).where(eq(orders.id, jc.orderId)).get()).toMatchObject({ paymentStatus: "UNPAID", fulfillmentStatus: "NEW", guestEmail: "ayesha@example.com" });
  });

  it("every order gets a private access token; a repeated submit gets a new one for the same order", () => {
    const v = published(5);
    const f = form(v);
    const a = placeOrder(db, f);
    const b = placeOrder(db, f);
    if (!a.ok || !b.ok) throw new Error("expected order");
    expect(a.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(b.accessToken).not.toBe(a.accessToken);
    expect(b.orderId).toBe(a.orderId);
  });

  it("the default payment waiting time is 24 hours (owner decision v1.12; v1.11 had 48)", () => {
    db.delete(settingsTable).run();
    expect(getCheckoutSettings(db).manualTtlMinutes).toBe(24 * 60);
  });
});

describe("v1.12 — free delivery when paying in advance", () => {
  it("prepaid orders pay no delivery; cash on delivery still pays delivery + COD fee", () => {
    const v = published(10);
    const jc = placeOrder(db, form(v, { method: "JAZZCASH" }));
    const cod = placeOrder(db, form(v, { phone: "0321 7654321" }));
    expect(jc).toMatchObject({ ok: true, totalPaisa: 150_000 });
    expect(cod).toMatchObject({ ok: true, totalPaisa: 180_000 });
    if (!jc.ok) return;
    expect(db.select().from(orders).where(eq(orders.id, jc.orderId)).get()).toMatchObject({ shippingFeePaisa: 0, codFeePaisa: 0, totalPaisa: 150_000 });
  });

  it("the owner can switch free delivery off in Shop settings", () => {
    const v = published(10);
    writeSetting(db, "prepaid_free_delivery", false, SYSTEM_USER_ID);
    expect(getCheckoutSettings(db).prepaidFreeDelivery).toBe(false);
    expect(placeOrder(db, form(v, { method: "JAZZCASH" }))).toMatchObject({ ok: true, totalPaisa: 175_000 });
  });

  it("the total the shopper saw must match: a stale total with the delivery fee is refused", () => {
    const v = published(10);
    expect(placeOrder(db, form(v, { method: "JAZZCASH", expectedTotalPaisa: 175_000 }))).toMatchObject({ ok: false, kind: "PRICE_CHANGED", totalPaisa: 150_000 });
  });
});

describe("expireUnpaidOrders (cron)", () => {
  it("cancels unpaid wallet orders after the waiting time, returns stock and the coupon use", () => {
    const v = published(5);
    db.insert(coupons).values({ code: "ONCE", discountType: "FIXED", value: 10_000, usage: "SINGLE_USE", maxRedemptions: 1, startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2099-01-01T00:00:00.000Z" }).run();
    const unpaid = placeOrder(db, form(v, { method: "JAZZCASH", coupon: "ONCE", lines: [{ variantId: v, qty: 2 }] }));
    const paidTid = placeOrder(db, form(v, { method: "JAZZCASH", tid: "TXAAAAAA11" }));
    const cod = placeOrder(db, form(v));
    if (!unpaid.ok || !paidTid.ok || !cod.ok) throw new Error("expected orders");
    expect(stockOf(v)).toBe(1);

    expect(expireUnpaidOrders(db, new Date(Date.now() + 23 * 3600_000))).toEqual([]); // not due yet

    expect(expireUnpaidOrders(db, new Date(Date.now() + 25 * 3600_000))).toEqual([unpaid.code]);
    expect(db.select().from(orders).where(eq(orders.id, unpaid.orderId)).get()).toMatchObject({ fulfillmentStatus: "CANCELLED", cancelReason: "Payment not received in time" });
    expect(stockOf(v)).toBe(3);
    expect(db.select().from(stockLedger).where(and(eq(stockLedger.referenceId, unpaid.orderId), eq(stockLedger.transactionType, "ORDER_CANCEL_RESTOCK"))).get()).toMatchObject({ quantityChanged: 2, operatorId: SYSTEM_USER_ID });
    expect(db.select().from(coupons).get()!.redemptionCount).toBe(0);
    expect(db.select().from(couponRedemptions).all()).toHaveLength(0);
    expect(db.select().from(payments).where(eq(payments.orderId, unpaid.orderId)).get()!.status).toBe("FAILED");

    // Running again changes nothing; the TID and COD orders are untouched
    expect(expireUnpaidOrders(db, new Date(Date.now() + 48 * 3600_000))).toEqual([]);
    expect(db.select().from(orders).where(eq(orders.id, paidTid.orderId)).get()!.fulfillmentStatus).toBe("NEW");
    expect(db.select().from(orders).where(eq(orders.id, cod.orderId)).get()!.fulfillmentStatus).toBe("CONFIRMED");
    expect(() => submitTransactionId(db, { code: unpaid.code, phone: "03001234567", tid: "TXLATE1234" })).toThrow(/cancelled/);
    expect(findLedgerDrift(db)).toEqual([]);
  });
});
