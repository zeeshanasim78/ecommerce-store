import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, orderItems, orders, payments, products, productVariants, promotions, stockLedger, user } from "@/db/schema";
import { findLedgerDrift } from "@/server/inventory/stock";
import { placeOrder } from "@/server/orders/checkout";
import { writeSetting } from "@/server/settings/store-settings";
import { SYSTEM_USER_ID, deliveryZones } from "@/db/schema";
import {
  CounterSaleError,
  addTechnician,
  completeCounterSale,
  counterDaySummary,
  findTechnician,
  karachiDayBounds,
  loadCounterReceipt,
  quoteTicket,
  recentCounterSales,
  searchCounterItems,
  setTechnicianStatus,
  type CounterSaleInput,
} from "@/server/counter/pos";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 9 — counter sale / POS (SPECIFICATION.md §6.4, §25; owner rules Q54–Q56). */

let db: DB;
const ctx = { ip: "127.0.0.1", userAgent: "vitest" };
const OWNER = { id: "u-owner", role: "OWNER" as const };
const MANAGER = { id: "u-manager", role: "MANAGER" as const };
const CASHIER = { id: "u-cashier", role: "CASHIER" as const };
const CASHIER2 = { id: "u-cashier2", role: "CASHIER" as const };
const NOW = new Date("2026-10-04T07:00:00Z"); // 12:00 in Karachi

const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const rs = (n: number) => n * 100;

const sale = (variantId: string, extra: Partial<CounterSaleInput> = {}): CounterSaleInput => ({
  idempotencyKey: crypto.randomUUID(),
  lines: [{ variantId, qty: 1 }],
  method: "CASH",
  cashReceivedPaisa: rs(2000),
  expectedTotalPaisa: rs(1500),
  ...extra,
});
const fails = (fn: () => unknown, re: RegExp) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(CounterSaleError);
    expect((e as Error).message).toMatch(re);
    return e as CounterSaleError;
  }
  throw new Error("expected CounterSaleError");
};

beforeEach(() => {
  db = testDb();
  for (const u of [OWNER, MANAGER, CASHIER, CASHIER2]) db.insert(user).values({ id: u.id, name: u.id.replace("u-", "").replace(/^./, (c) => c.toUpperCase()), email: `${u.id}@caidea.test`, role: u.role, isActive: true }).run();
});

describe("cash sale by a cashier", () => {
  it("records a PAID + DELIVERED counter order, COUNTER_POS ledger rows with the cashier as operator, change and warranty", () => {
    const { variantId } = createVariant(db, 5); // Rs 1,500 retail, warranty 7 days by default
    const r = completeCounterSale(db, sale(variantId, { lines: [{ variantId, qty: 2 }], expectedTotalPaisa: rs(3000), cashReceivedPaisa: rs(5000) }), CASHIER, ctx, NOW);
    expect(r.code).toBe("CA-POS-261004-0001");
    expect(r.changePaisa).toBe(rs(2000));
    expect(stockOf(variantId)).toBe(3);

    const o = db.select().from(orders).where(eq(orders.id, r.orderId)).get()!;
    expect(o).toMatchObject({ channel: "COUNTER", paymentMethod: "CASH", paymentStatus: "PAID", fulfillmentStatus: "DELIVERED", createdBy: CASHIER.id, totalPaisa: rs(3000), cashReceivedPaisa: rs(5000), priceTier: "RETAIL", placedAt: "2026-10-04 07:00:00" });

    const ledger = db.select().from(stockLedger).where(eq(stockLedger.referenceId, r.orderId)).all();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ transactionType: "COUNTER_POS", quantityChanged: -2, previousStock: 5, newStock: 3, operatorId: CASHIER.id, referenceType: "ORDER", unitCostPaisa: rs(1000) });

    const item = db.select().from(orderItems).where(eq(orderItems.orderId, r.orderId)).get()!;
    expect(item.warrantyUntil).toBe("2026-10-11T07:00:00.000Z");
    expect(item.unitCostPaisa).toBe(rs(1000));

    const pay = db.select().from(payments).where(eq(payments.orderId, r.orderId)).get()!;
    expect(pay).toMatchObject({ provider: "CASH", status: "SUCCEEDED", amountPaisa: rs(3000), verifiedBy: CASHIER.id });
    expect(db.select().from(adminAuditLog).where(eq(adminAuditLog.action, "counter.sale")).all()).toHaveLength(1);
    expect(findLedgerDrift(db)).toEqual([]);
  });

  it("refuses cash below the total, and a missing cash amount", () => {
    const { variantId } = createVariant(db, 5);
    fails(() => completeCounterSale(db, sale(variantId, { cashReceivedPaisa: rs(1000) }), CASHIER, ctx, NOW), /less than the total/);
    fails(() => completeCounterSale(db, sale(variantId, { cashReceivedPaisa: undefined }), CASHIER, ctx, NOW), /cash received/);
    expect(stockOf(variantId)).toBe(5);
    expect(db.select().from(orders).all()).toHaveLength(0);
  });

  it("exact cash gives zero change; codes run per Karachi day", () => {
    const { variantId } = createVariant(db, 5);
    expect(completeCounterSale(db, sale(variantId, { cashReceivedPaisa: rs(1500) }), CASHIER, ctx, NOW).changePaisa).toBe(0);
    expect(completeCounterSale(db, sale(variantId), CASHIER, ctx, NOW).code).toBe("CA-POS-261004-0002");
    // 20:00 UTC = 01:00 next day in Karachi
    expect(completeCounterSale(db, sale(variantId), CASHIER, ctx, new Date("2026-10-04T20:00:00Z")).code).toBe("CA-POS-261005-0001");
  });

  it("a double press (same ticket key) saves one sale and takes stock once", () => {
    const { variantId } = createVariant(db, 5);
    const input = sale(variantId);
    const a = completeCounterSale(db, input, CASHIER, ctx, NOW);
    const b = completeCounterSale(db, input, CASHIER, ctx, NOW);
    expect(b).toMatchObject({ orderId: a.orderId, repeated: true, changePaisa: rs(500) });
    expect(stockOf(variantId)).toBe(4);
    // another person can't reuse someone else's ticket key
    fails(() => completeCounterSale(db, input, CASHIER2, ctx, NOW), /already used/);
  });

  it("selling more than is on the shelf saves nothing", () => {
    const { variantId } = createVariant(db, 2);
    fails(() => completeCounterSale(db, sale(variantId, { lines: [{ variantId, qty: 3 }], expectedTotalPaisa: rs(4500), cashReceivedPaisa: rs(5000) }), CASHIER, ctx, NOW), /Only 2 left/);
    expect(stockOf(variantId)).toBe(2);
    expect(db.select().from(stockLedger).where(eq(stockLedger.transactionType, "COUNTER_POS")).all()).toHaveLength(0);
  });

  it("the last unit: the counter and the website share one stock pool", () => {
    const { variantId, productId } = createVariant(db, 1);
    db.update(products).set({ isPublished: true }).where(eq(products.id, productId)).run();
    completeCounterSale(db, sale(variantId), CASHIER, ctx, NOW);
    const zone = crypto.randomUUID();
    db.insert(deliveryZones).values({ id: zone, city: "Lahore", province: "Punjab", shippingFeePaisa: 0, etaMinDays: 1, etaMaxDays: 2, mapX: 1, mapY: 1 }).run();
    writeSetting(db, "enabled_payment_methods", ["COD"], SYSTEM_USER_ID);
    const online = placeOrder(db, { idempotencyKey: crypto.randomUUID(), name: "Ali", phone: "03001234567", email: "a@b.pk", line1: "House 1 Street 2", cityId: zone, method: "COD", lines: [{ variantId, qty: 1 }] });
    expect(online.ok).toBe(false);
    expect(online.ok === false && online.kind).toBe("SOLD_OUT");
  });

  it("re-prices from the database: a stale screen total is refused", () => {
    const { variantId, productId } = createVariant(db, 5);
    db.update(products).set({ retailPricePKR: 1600 }).where(eq(products.id, productId)).run();
    const e = fails(() => completeCounterSale(db, sale(variantId), CASHIER, ctx, NOW), /total changed to Rs 1,600/);
    expect(e.kind).toBe("PRICE_CHANGED");
    expect(stockOf(variantId)).toBe(5);
  });

  it("uses the website's sale/promotion price at retail", () => {
    const { variantId } = createVariant(db, 5);
    db.insert(promotions).values({ name: "Ten off", discountType: "PERCENT", value: 1000, scope: "ALL", startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-10-30T00:00:00Z", isActive: true }).run();
    const r = completeCounterSale(db, sale(variantId, { expectedTotalPaisa: rs(1350) }), CASHIER, ctx, NOW);
    expect(r.totalPaisa).toBe(rs(1350));
  });

  it("sells unpublished stock but not archived items", () => {
    const { variantId } = createVariant(db, 3); // not published
    expect(completeCounterSale(db, sale(variantId), CASHIER, ctx, NOW).totalPaisa).toBe(rs(1500));
    db.update(productVariants).set({ archivedAt: NOW.toISOString() }).where(eq(productVariants.id, variantId)).run();
    fails(() => completeCounterSale(db, sale(variantId), CASHIER, ctx, NOW), /no longer on sale/);
  });
});

describe("owner rule: cashiers take cash only; only the owner records non-cash payments", () => {
  it.each([CASHIER, MANAGER])("$role cannot take JazzCash / bank / card", (who) => {
    const { variantId } = createVariant(db, 5);
    for (const method of ["JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "POS_CARD"] as const) {
      const e = fails(() => completeCounterSale(db, sale(variantId, { method, cashReceivedPaisa: undefined, reference: "TID123456", referenceConfirmed: true }), who, ctx, NOW), /Only the owner/);
      expect(e.kind).toBe("NOT_ALLOWED");
    }
    expect(stockOf(variantId)).toBe(5);
  });

  it("the owner must enter the transaction ID and confirm it is genuine and checked", () => {
    const { variantId } = createVariant(db, 5);
    const base = { method: "JAZZCASH" as const, cashReceivedPaisa: undefined };
    fails(() => completeCounterSale(db, sale(variantId, base), OWNER, ctx, NOW), /transaction ID/);
    fails(() => completeCounterSale(db, sale(variantId, { ...base, reference: "abc" }), OWNER, ctx, NOW), /6–30/);
    fails(() => completeCounterSale(db, sale(variantId, { ...base, reference: "TID123456" }), OWNER, ctx, NOW), /genuine/);
    const r = completeCounterSale(db, sale(variantId, { ...base, reference: "tid123456", referenceConfirmed: true }), OWNER, ctx, NOW);
    const pay = db.select().from(payments).where(eq(payments.orderId, r.orderId)).get()!;
    expect(pay).toMatchObject({ provider: "MANUAL", manualReference: "TID123456", status: "SUCCEEDED", verifiedBy: OWNER.id });
    const audit = db.select().from(adminAuditLog).where(eq(adminAuditLog.entityId, r.orderId)).get()!;
    expect(audit.after).toMatchObject({ reference: "TID123456", referenceConfirmed: true, method: "JAZZCASH" });
  });

  it("a transaction ID can never be used twice — not at the counter, not shared with an online order", () => {
    const { variantId } = createVariant(db, 5);
    const pay = (ref: string, method: "JAZZCASH" | "BANK_TRANSFER" | "POS_CARD" = "JAZZCASH") => sale(variantId, { method, cashReceivedPaisa: undefined, reference: ref, referenceConfirmed: true });
    completeCounterSale(db, pay("TID123456"), OWNER, ctx, NOW);
    fails(() => completeCounterSale(db, pay("tid123456", "BANK_TRANSFER"), OWNER, ctx, NOW), /already recorded/);
    // card slips live in their own series, so a card number can't clash with a wallet ID
    expect(completeCounterSale(db, pay("TID123456", "POS_CARD"), OWNER, ctx, NOW).code).toMatch(/^CA-POS-/);
    fails(() => completeCounterSale(db, pay("TID123456", "POS_CARD"), OWNER, ctx, NOW), /already recorded/);
    expect(stockOf(variantId)).toBe(3);
  });

  it("cash sales can't carry a transaction ID", () => {
    const { variantId } = createVariant(db, 5);
    fails(() => completeCounterSale(db, sale(variantId, { reference: "TID123456" }), OWNER, ctx, NOW), /only for JazzCash/);
  });
});

describe("manager discount", () => {
  it("a cashier cannot discount", () => {
    const { variantId } = createVariant(db, 5);
    const e = fails(() => completeCounterSale(db, sale(variantId, { discountPaisa: rs(100), discountReason: "regular", expectedTotalPaisa: rs(1400) }), CASHIER, ctx, NOW), /manager or the owner/);
    expect(e.kind).toBe("NOT_ALLOWED");
  });

  it("a manager discounts the ticket with a reason; it is stored, totalled and audited", () => {
    const { variantId } = createVariant(db, 5);
    fails(() => completeCounterSale(db, sale(variantId, { discountPaisa: rs(100), expectedTotalPaisa: rs(1400) }), MANAGER, ctx, NOW), /reason/);
    fails(() => completeCounterSale(db, sale(variantId, { discountPaisa: 150, discountReason: "old customer", expectedTotalPaisa: rs(1500) - 150 }), MANAGER, ctx, NOW), /whole rupees/);
    fails(() => completeCounterSale(db, sale(variantId, { discountPaisa: rs(1500), discountReason: "free", expectedTotalPaisa: 0 }), MANAGER, ctx, NOW), /less than the ticket total/);
    const r = completeCounterSale(db, sale(variantId, { discountPaisa: rs(100), discountReason: "Regular customer", expectedTotalPaisa: rs(1400) }), MANAGER, ctx, NOW);
    expect(r).toMatchObject({ totalPaisa: rs(1400), changePaisa: rs(600) });
    const o = db.select().from(orders).where(eq(orders.id, r.orderId)).get()!;
    expect(o).toMatchObject({ subtotalPaisa: rs(1500), discountPaisa: rs(100), discountReason: "Regular customer" });
    expect(db.select().from(adminAuditLog).where(eq(adminAuditLog.entityId, r.orderId)).get()!.after).toMatchObject({ discountPaisa: rs(100), discountReason: "Regular customer" });
  });
});

describe("wholesale for approved technicians", () => {
  it("a cashier's new technician waits as PENDING and pays retail; a manager approves; then wholesale works", () => {
    const { variantId } = createVariant(db, 5); // wholesale Rs 1,300
    const t = addTechnician(db, { name: "Bilal", shopName: "Bilal Mobile Repair", phone: "0321 5556667", city: "Faisalabad" }, CASHIER, ctx);
    expect(t.status).toBe("PENDING");
    const wholesale = { tier: "WHOLESALE" as const, technicianPhone: "03215556667", expectedTotalPaisa: rs(1300) };
    fails(() => completeCounterSale(db, sale(variantId, wholesale), CASHIER, ctx, NOW), /waiting for a manager/);
    fails(() => setTechnicianStatus(db, t.id, "APPROVED", CASHIER, ctx), /manager or the owner/);
    setTechnicianStatus(db, t.id, "APPROVED", MANAGER, ctx);
    const r = completeCounterSale(db, sale(variantId, wholesale), CASHIER, ctx, NOW);
    const o = db.select().from(orders).where(eq(orders.id, r.orderId)).get()!;
    expect(o).toMatchObject({ priceTier: "WHOLESALE", totalPaisa: rs(1300), customerId: t.id, guestName: "Bilal", guestPhone: "+923215556667" });
    expect(db.select().from(adminAuditLog).where(and(eq(adminAuditLog.entity, "customers"), eq(adminAuditLog.entityId, t.id))).all().map((a) => a.action)).toEqual(["technician.create", "technician.approved"]);
  });

  it("a manager's new technician is approved at once; unknown or rejected numbers get no wholesale", () => {
    const { variantId } = createVariant(db, 5);
    const t = addTechnician(db, { name: "Sana", shopName: "Fix It", phone: "0333 1112223" }, MANAGER, ctx);
    expect(t.status).toBe("APPROVED");
    fails(() => addTechnician(db, { name: "Sana", shopName: "Fix It", phone: "03331112223" }, MANAGER, ctx), /already a technician/);
    fails(() => completeCounterSale(db, sale(variantId, { tier: "WHOLESALE", technicianPhone: "03009999999", expectedTotalPaisa: rs(1300) }), CASHIER, ctx, NOW), /registered technicians/);
    fails(() => completeCounterSale(db, sale(variantId, { tier: "WHOLESALE", expectedTotalPaisa: rs(1300) }), CASHIER, ctx, NOW), /registered technicians/);
    setTechnicianStatus(db, t.id, "REJECTED", OWNER, ctx);
    fails(() => completeCounterSale(db, sale(variantId, { tier: "WHOLESALE", technicianPhone: "03331112223", expectedTotalPaisa: rs(1300) }), CASHIER, ctx, NOW), /not approved/);
    expect(findTechnician(db, "0333-1112223")?.status).toBe("REJECTED");
  });

  it("a technician never pays more than retail (wholesale above a sale price uses the sale price)", () => {
    const { variantId, productId } = createVariant(db, 5);
    db.update(products).set({ salePricePKR: 1200 }).where(eq(products.id, productId)).run();
    const q = quoteTicket(db, [{ variantId, qty: 2 }], "WHOLESALE", NOW);
    expect(q.lines[0]!.unitPaisa).toBe(rs(1200));
    expect(q.subtotalPaisa).toBe(rs(2400));
  });
});

describe("search, quote and scanner input", () => {
  it("an exact colour SKU (barcode) returns one exact hit; words search brand / model / colour", () => {
    createVariant(db, 5, "1");
    createVariant(db, 0, "2");
    const scan = searchCounterItems(db, "test-1-blk", NOW);
    expect(scan).toHaveLength(1);
    expect(scan[0]).toMatchObject({ exact: true, sku: "TEST-1-BLK", stock: 5, retailPaisa: rs(1500), wholesalePaisa: rs(1300) });
    expect(searchCounterItems(db, "TEST-2", NOW).map((i) => i.sku)).toEqual(["TEST-2-BLK"]); // product SKU → its colours
    const words = searchCounterItems(db, "galaxy black", NOW);
    expect(words.map((i) => i.sku)).toEqual(["TEST-1-BLK", "TEST-2-BLK"]); // in stock first
    expect(searchCounterItems(db, "  ", NOW)).toEqual([]);
    expect(searchCounterItems(db, "%", NOW).length).toBeGreaterThan(0); // wildcards are treated as text, not SQL
  });

  it("quote merges duplicate lines and flags short stock", () => {
    const { variantId } = createVariant(db, 3);
    const q = quoteTicket(db, [{ variantId, qty: 2 }, { variantId, qty: 2 }], "RETAIL", NOW);
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]).toMatchObject({ qty: 4, short: true });
    expect(q.ready).toBe(false);
    expect(quoteTicket(db, [{ variantId: "nope", qty: 1 }], "RETAIL", NOW).missing).toEqual(["nope"]);
  });
});

describe("receipts and end of day", () => {
  it("receipt shows items, warranty, cash and change; online orders are not counter receipts", () => {
    const { variantId } = createVariant(db, 5);
    const r = completeCounterSale(db, sale(variantId, { customerName: "Walk-in Ahmed", customerPhone: "0300 7654321" }), CASHIER, ctx, NOW);
    const rec = loadCounterReceipt(db, { code: r.code.toLowerCase() })!;
    expect(rec).toMatchObject({ code: r.code, cashierName: "Cashier", method: "CASH", totalPaisa: rs(1500), cashReceivedPaisa: rs(2000), changePaisa: rs(500), customerName: "Walk-in Ahmed", customerPhone: "0300 7654321" });
    expect(rec.items[0]).toMatchObject({ sku: "TEST-1-BLK", qty: 1, warrantyUntil: "2026-10-11T07:00:00.000Z" });
    expect(rec.items[0]!.description).toContain("Samsung Galaxy Test 1");
    fails(() => completeCounterSale(db, sale(variantId, { customerPhone: "12345" }), CASHIER, ctx, NOW), /Customer mobile/);
    expect(loadCounterReceipt(db, { code: "CA-ORD-261004-0001" })).toBeNull();
  });

  it("summarises each cashier's day: totals, cash in drawer, methods, wholesale and discounts", () => {
    const { variantId } = createVariant(db, 20);
    const t = addTechnician(db, { name: "Bilal", shopName: "Bilal Repair", phone: "03215556667" }, OWNER, ctx);
    completeCounterSale(db, sale(variantId), CASHIER, ctx, NOW);
    completeCounterSale(db, sale(variantId, { lines: [{ variantId, qty: 2 }], expectedTotalPaisa: rs(3000), cashReceivedPaisa: rs(3000) }), CASHIER, ctx, new Date("2026-10-04T12:00:00Z"));
    completeCounterSale(db, sale(variantId, { tier: "WHOLESALE", technicianPhone: t.phone, expectedTotalPaisa: rs(1300) }), CASHIER2, ctx, NOW);
    completeCounterSale(db, sale(variantId, { discountPaisa: rs(200), discountReason: "bulk", expectedTotalPaisa: rs(1300) }), MANAGER, ctx, NOW);
    completeCounterSale(db, sale(variantId, { method: "BANK_TRANSFER", cashReceivedPaisa: undefined, reference: "IBFT998877", referenceConfirmed: true }), OWNER, ctx, NOW);
    // yesterday (Karachi) and an online order are not counted
    completeCounterSale(db, sale(variantId), CASHIER, ctx, new Date("2026-10-03T18:59:00Z"));

    const day = counterDaySummary(db, { date: "2026-10-04" });
    expect(day.all).toMatchObject({ sales: 5, items: 6, totalPaisa: rs(1500 + 3000 + 1300 + 1300 + 1500), cashPaisa: rs(1500 + 3000 + 1300 + 1300), wholesaleSales: 1, wholesalePaisa: rs(1300), discounts: 1, discountPaisa: rs(200) });
    expect(day.all.byMethod.BANK_TRANSFER).toEqual({ sales: 1, totalPaisa: rs(1500) });
    const cashier = day.cashiers.find((c) => c.cashierId === CASHIER.id)!;
    expect(cashier).toMatchObject({ sales: 2, items: 3, totalPaisa: rs(4500), cashPaisa: rs(4500), firstSaleAt: "2026-10-04 07:00:00", lastSaleAt: "2026-10-04 12:00:00" });

    const own = counterDaySummary(db, { date: "2026-10-04", cashierId: CASHIER2.id });
    expect(own.cashiers.map((c) => c.cashierName)).toEqual(["Cashier2"]);
    expect(counterDaySummary(db, { date: "2026-10-03" }).all.sales).toBe(1);
    expect(recentCounterSales(db, { date: "2026-10-04", cashierId: CASHIER.id }).map((s) => s.code)).toEqual(["CA-POS-261004-0002", "CA-POS-261004-0001"]);
    expect(findLedgerDrift(db)).toEqual([]);
  });

  it("Karachi day bounds are UTC 19:00 → 19:00", () => {
    expect(karachiDayBounds("2026-10-04")).toEqual({ start: "2026-10-03 19:00:00", end: "2026-10-04 19:00:00" });
    expect(() => karachiDayBounds("04/10/2026")).toThrow(CounterSaleError);
  });
});
