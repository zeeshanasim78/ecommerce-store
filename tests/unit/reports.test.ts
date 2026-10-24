import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { brands, deliveryZones, orders, products, purchaseOrderItems, purchaseOrders, returnItems, shipments, user, vendors, SYSTEM_USER_ID } from "@/db/schema";
import { completeCounterSale, counterDaySummary } from "@/server/counter/pos";
import { cancelOrder, dispatchOrder } from "@/server/orders/admin-orders";
import { placeOrder } from "@/server/orders/checkout";
import { markDelivered } from "@/server/orders/fulfilment";
import { approveReturn, createReturn, inspectReturn, orderForReturn, recordRefund } from "@/server/returns/returns";
import { updateClaim, listClaims } from "@/server/returns/vendor-claims";
import { dashboardFigures } from "@/server/reports/dashboard";
import { cashierTotals, codOwedNow, codReconciliation, poCostAnalysis, returnsImpact } from "@/server/reports/finance";
import { makeRange, parseRange, lastDays } from "@/server/reports/range";
import { REPORTS, parseOptions, reportBySlug, reportCsv } from "@/server/reports/registry";
import { salesByDay, soldLines } from "@/server/reports/sales";
import { brandVelocity, deadStock, reorderRows, turnover, variantStats } from "@/server/reports/stock";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { writeSetting } from "@/server/settings/store-settings";
import { parseCsv } from "@/lib/csv";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/**
 * Milestone 12 — dashboard and reports (SPECIFICATION §6.6, §7, §29).
 * One small shop history is built below and every figure is worked out by hand in the comments, so the tests
 * answer "do the dashboard numbers match a hand calculation?".
 */

const CTX = { ip: "127.0.0.1", userAgent: "vitest" };
const NOW = new Date("2026-10-24T07:00:00Z"); // 12:00 Friday 24 Oct in Karachi
const rs = (n: number) => n * 100;
const MGR = { id: "u-manager", role: "MANAGER" as const };
const C1 = { id: "u-c1", role: "CASHIER" as const };
const C2 = { id: "u-c2", role: "CASHIER" as const };

let db: DB;
let A: string; // Samsung, OEM Original, cost Rs 1,000, retail Rs 1,500
let B: string; // Apple, OLED A Grade, cost Rs 2,000, retail Rs 3,000
let lahore: string;
let vendorId: string;
const ids: Record<string, string> = {};

const savedEnv = Object.fromEntries(PAYMENT_ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of PAYMENT_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function counter(who: { id: string; role: "CASHIER" | "MANAGER" }, lines: { variantId: string; qty: number }[], total: number, at: string, extra: Record<string, unknown> = {}) {
  return completeCounterSale(db, { idempotencyKey: crypto.randomUUID(), lines, method: "CASH", cashReceivedPaisa: total, expectedTotalPaisa: total, ...extra }, who, CTX, new Date(at)).orderId;
}
function online(variantId: string, placedAt: string) {
  const r = placeOrder(db, { idempotencyKey: crypto.randomUUID(), name: "Ayesha Khan", phone: "0300 1234567", email: "ayesha@example.com", line1: "House 12, Gulberg III", cityId: lahore, method: "COD", lines: [{ variantId, qty: 1 }] });
  if (!r.ok) throw new Error(r.message);
  db.update(orders).set({ placedAt: placedAt.replace("T", " ").slice(0, 19) }).where(eq(orders.id, r.orderId)).run();
  return r.orderId;
}

beforeEach(() => {
  db = testDb();
  for (const k of PAYMENT_ENV_KEYS) delete process.env[k];
  Object.assign(process.env, { COD_MAX_ORDER_PKR: "20000" });
  writeSetting(db, "enabled_payment_methods", ["COD"], SYSTEM_USER_ID);
  lahore = crypto.randomUUID();
  db.insert(deliveryZones).values({ id: lahore, city: "Lahore", province: "Punjab", shippingFeePaisa: rs(250), codFeePaisa: rs(50), etaMinDays: 1, etaMaxDays: 2, mapX: 1, mapY: 1 }).run();
  for (const u of [MGR, C1, C2]) db.insert(user).values({ id: u.id, name: u.id.replace("u-", "").toUpperCase(), email: `${u.id}@caidea.test`, role: u.role, isActive: true }).run();
  vendorId = crypto.randomUUID();
  db.insert(vendors).values({ id: vendorId, code: "V-1", name: "Shenzhen Display Co", currency: "USD", country: "CN", leadTimeDays: 14 }).run();

  db.insert(brands).values({ name: "Apple", slug: "apple" }).run();
  const a = createVariant(db, 20, "a");
  const b = createVariant(db, 10, "b");
  A = a.variantId;
  B = b.variantId;
  db.update(products).set({ isPublished: true }).where(eq(products.id, a.productId)).run();
  db.update(products).set({ isPublished: true, brand: "Apple", qualityGrade: "OLED A Grade", costPrice: 2000, retailPricePKR: 3000, wholesalePricePKR: 2800 }).where(eq(products.id, b.productId)).run();

  // S1 counter, cashier 1, 20 Oct: 2×A = Rs 3,000 (cost 2,000)
  ids.s1 = counter(C1, [{ variantId: A, qty: 2 }], rs(3000), "2026-10-20T07:00:00Z");
  // S2 counter, cashier 2, 20 Oct: 1×B = Rs 3,000 (cost 2,000)
  ids.s2 = counter(C2, [{ variantId: B, qty: 1 }], rs(3000), "2026-10-20T08:00:00Z");
  // S3 counter, manager, 21 Oct: A + B = 4,500 less a Rs 450 discount = 4,050 (A share 150, B share 300); cost 3,000
  ids.s3 = counter(MGR, [{ variantId: A, qty: 1 }, { variantId: B, qty: 1 }], rs(4050), "2026-10-21T07:00:00Z", { discountPaisa: rs(450), discountReason: "Regular customer" });
  // S4 online COD, 22 Oct: 1×A = 1,500 + delivery 250 + COD fee 50 = 1,800; delivered 23 Oct, not yet paid by the courier
  ids.s4 = online(A, "2026-10-22T07:00:00Z");
  dispatchOrder(db, ids.s4, { courier: "LEOPARDS", cn: "LP1001", actorId: MGR.id }, CTX, new Date("2026-10-22T09:00:00Z"));
  markDelivered(db, ids.s4, { actorId: MGR.id }, CTX, new Date("2026-10-23T07:00:00Z"));
  // S5 online COD, 22 Oct: 1×B, cancelled → not a sale
  ids.s5 = online(B, "2026-10-22T08:00:00Z");
  cancelOrder(db, ids.s5, { reason: "Customer changed mind", actorId: MGR.id }, CTX, new Date("2026-10-22T10:00:00Z"));
  // S6 online COD, 23 Oct: 1×A, with the courier
  ids.s6 = online(A, "2026-10-23T07:00:00Z");
  dispatchOrder(db, ids.s6, { courier: "LEOPARDS", cn: "LP1002", actorId: MGR.id }, CTX, new Date("2026-10-23T09:00:00Z"));

  // R1: counter sale S1 — one A comes back faulty-free: refund Rs 1,500, unit back on sale (cost 1,000)
  const r1 = open(ids.s1, "CHANGE_OF_MIND");
  decide(r1, "RESELLABLE", "RESTOCK");
  recordRefund(db, r1, { actorId: MGR.id, method: "CASH" }, CTX, NOW);
  // R2: counter sale S2 — the B is faulty: refund Rs 3,000, unit goes to the supplier (claim Rs 2,000)
  const r2 = open(ids.s2, "TOUCH_FAULT");
  decide(r2, "DEFECTIVE", "RETURN_TO_VENDOR");
  recordRefund(db, r2, { actorId: MGR.id, method: "CASH" }, CTX, NOW);

  // A purchase order that is still on its way: 10×A at US$5.00, 5×B at US$10.00, rate 280, shipping 1,000 + customs 500
  const poId = crypto.randomUUID();
  db.insert(purchaseOrders).values({ id: poId, code: "PO-0001", vendorId, status: "ORDERED", orderedAt: "2026-10-21T05:00:00.000Z", receivedAt: "2026-10-23T05:00:00.000Z", currency: "USD", fxRateToPkr: 280, shippingCostPaisa: rs(1000), customsDutyPaisa: rs(500), createdBy: MGR.id }).run();
  db.insert(purchaseOrderItems).values([{ poId, variantId: A, qtyOrdered: 10, unitCostForeign: 500 }, { poId, variantId: B, qtyOrdered: 5, unitCostForeign: 1000 }]).run();
  db.insert(purchaseOrders).values({ id: crypto.randomUUID(), code: "PO-0002", vendorId, status: "DRAFT", createdAt: "2026-10-22 05:00:00", currency: "PKR", createdBy: MGR.id }).run();

  alignLedger();
});
function open(orderId: string, reason: string) {
  const line = orderForReturn(db, orderId, NOW).lines[0]!;
  return createReturn(db, { orderId, reason, description: "test", items: [{ orderItemId: line.orderItemId, quantity: 1 }], alreadyReceived: true, actorId: MGR.id }, CTX, NOW).id;
}
function decide(returnId: string, condition: string, disposition: string) {
  const items = db.select().from(returnItems).where(eq(returnItems.returnId, returnId)).all();
  inspectReturn(db, returnId, { actorId: MGR.id, notes: "Tested", conditions: Object.fromEntries(items.map((i) => [i.id, condition])) }, CTX);
  approveReturn(db, returnId, { actorId: MGR.id, resolution: "REFUND", dispositions: Object.fromEntries(items.map((i) => [i.id, { disposition, vendorId }])) }, CTX, NOW);
}
/** The ledger stamps real time; give each row the date of the event it belongs to so date-based reports see the story. */
function alignLedger() {
  db.$client.exec("DROP TRIGGER stock_ledger_no_update");
  db.$client.exec(`
    UPDATE stock_ledger SET timestamp = (SELECT replace(substr(o.placed_at,1,19),'T',' ') FROM orders o WHERE o.id = stock_ledger.reference_id) WHERE reference_type = 'ORDER' AND transaction_type IN ('STORE_SALE','COUNTER_POS');
    UPDATE stock_ledger SET timestamp = '2026-10-01 00:00:00' WHERE transaction_type = 'OPENING_BALANCE';
    UPDATE stock_ledger SET timestamp = '2026-10-24 07:00:00' WHERE transaction_type IN ('ORDER_CANCEL_RESTOCK','REPAIR_RETURN');`);
}

const R = makeRange("2026-10-20", "2026-10-24");

describe("what counts as a sale", () => {
  it("counts online and counter orders, leaves out the cancelled one, and shares the discount exactly", () => {
    const { lines } = soldLines(db, R);
    expect(new Set(lines.map((l) => l.orderId))).toEqual(new Set([ids.s1, ids.s2, ids.s3, ids.s4, ids.s6]));
    const s3 = lines.filter((l) => l.orderId === ids.s3);
    expect(s3.map((l) => l.salesPaisa).sort()).toEqual([rs(1350), rs(2700)]); // 1,500 − 150 and 3,000 − 300
    expect(lines.reduce((s, l) => s + l.salesPaisa, 0)).toBe(rs(13_050));
  });

  it("shares an odd discount without losing a paisa", () => {
    // three Rs 1,500 lines with a Rs 1,000 discount: 33,333.33 paisa each, so one line takes the extra paisa
    const v = ["x", "y", "z"].map((n) => createVariant(db, 3, n).variantId);
    const o = counter(MGR, v.map((variantId) => ({ variantId, qty: 1 })), rs(3500), "2026-10-24T05:00:00Z", { discountPaisa: rs(1000), discountReason: "Odd split" });
    const sales = soldLines(db, R).lines.filter((l) => l.orderId === o).map((l) => l.salesPaisa);
    expect(sales.reduce((s, n) => s + n, 0)).toBe(rs(3500));
    expect(sales.map((n) => rs(1500) - n).sort()).toEqual([33_333, 33_333, 33_334]);
  });
});

describe("sales by day", () => {
  it("matches the hand calculation, day by day", () => {
    const s = salesByDay(db, R);
    expect(s.days.map((d) => d.day)).toEqual(["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"]);
    const by = Object.fromEntries(s.days.map((d) => [d.day, d]));
    expect(by["2026-10-20"]).toMatchObject({ counterOrders: 2, counterSales: rs(6000), onlineOrders: 0, units: 3, cost: rs(4000), margin: rs(2000) });
    expect(by["2026-10-21"]).toMatchObject({ counterOrders: 1, counterSales: rs(4050), units: 2, cost: rs(3000), margin: rs(1050) });
    expect(by["2026-10-22"]).toMatchObject({ onlineOrders: 1, onlineSales: rs(1500), fees: rs(300), cost: rs(1000), margin: rs(500) });
    expect(by["2026-10-23"]).toMatchObject({ onlineOrders: 1, onlineSales: rs(1500), fees: rs(300) });
    expect(by["2026-10-24"]).toMatchObject({ onlineOrders: 0, counterOrders: 0, sales: 0, units: 0 });
    expect(s.total).toMatchObject({ sales: rs(13_050), onlineSales: rs(3000), counterSales: rs(10_050), units: 7, cost: rs(9000), margin: rs(4050), fees: rs(600) });
  });

  it("puts a sale made just after midnight in Karachi on the Karachi date", () => {
    const o = counter(C1, [{ variantId: A, qty: 1 }], rs(1500), "2026-10-24T19:30:00Z"); // 00:30 on 25 Oct in Karachi
    expect(o).toBeTruthy();
    const s = salesByDay(db, makeRange("2026-10-24", "2026-10-25"));
    expect(s.days.map((d) => [d.day, d.counterSales])).toEqual([["2026-10-24", 0], ["2026-10-25", rs(1500)]]);
  });
});

describe("margin by brand and grade", () => {
  it("adds up to the sales report", () => {
    const r = reportBySlug("margin")!.run(db, { range: R, options: {}, now: NOW });
    const rows = Object.fromEntries(r.rows.map((x) => [`${x.brand}/${x.grade}`, x]));
    expect(rows["Samsung/OEM Original"]).toMatchObject({ units: 5, sales: rs(7350), cost: rs(5000), margin: rs(2350) });
    expect(rows["Apple/OLED A Grade"]).toMatchObject({ units: 2, sales: rs(5700), cost: rs(4000), margin: rs(1700) });
    expect(r.totals).toMatchObject({ sales: rs(13_050), cost: rs(9000), margin: rs(4050), marginPct: 31 });
    expect(r.rows.reduce((s, x) => s + (x.margin as number), 0)).toBe(salesByDay(db, R).total.margin);
  });
});

describe("velocity, cover and reorder", () => {
  it("counts screens sold net of returns and cancelled orders", () => {
    const stats = variantStats(db, NOW);
    const a = stats.find((s) => s.variantId === A)!;
    const b = stats.find((s) => s.variantId === B)!;
    // A: sold 2+1+1+1 = 5, one came back (R1) → 4. B: sold 1 (S2) + 1 (S3) + 1 (S5 cancelled and put back) → 2; the faulty return added no stock
    expect([a.units7, a.units30, a.units90, a.stock]).toEqual([4, 4, 4, 16]); // 20 − 5 + 1
    expect([b.units7, b.units30, b.units90, b.stock]).toEqual([2, 2, 2, 8]); // 10 − 3 + 1
    const brands = brandVelocity(stats);
    expect(brands.map((x) => [x.brand, x.units30, x.shareOf30])).toEqual([["Samsung", 4, 66.7], ["Apple", 2, 33.3]]);
  });

  it("works out days of cover, lead time from the newest purchase order, and what is on order", () => {
    const rows = reorderRows(db, variantStats(db, NOW));
    const a = rows.find((r) => r.variantId === A)!;
    expect(a).toMatchObject({ perDay: 0.13, daysOfCover: 120, vendor: "Shenzhen Display Co", leadDays: 14, leadSource: "PO", onOrder: 10, triggerDays: 21, status: "OK", suggested: 0 });
  });

  it("flags a fast seller for reorder and suggests lead time + 7 + 30 days of sales, less stock and open orders", () => {
    const f = createVariant(db, 10, "fast");
    for (let i = 0; i < 9; i++) counter(C1, [{ variantId: f.variantId, qty: 1 }], rs(1500), "2026-10-23T07:00:00Z");
    const stats = variantStats(db, new Date());
    const row = reorderRows(db, stats).find((r) => r.variantId === f.variantId)!;
    // 9 sold in 30 days → 0.3 a day; stock 1 → 3.3 days of cover < default lead 7 + 7. Need ceil(0.3 × (7+7+30)) = 14 − 1 in stock = 13
    expect(row).toMatchObject({ stock: 1, units30: 9, daysOfCover: 3.3, leadDays: 7, leadSource: "DEFAULT", status: "REORDER", suggested: 13 });
    expect(reorderRows(db, stats)[0]!.variantId).toBe(f.variantId); // most urgent first
  });

  it("takes the lead time of a supplier that lists the brand when there is no purchase order", () => {
    db.update(vendors).set({ brandsSupplied: ["samsung"] }).where(eq(vendors.id, vendorId)).run();
    const lonely = createVariant(db, 3, "lonely");
    db.update(products).set({ brand: "Samsung" }).where(eq(products.id, lonely.productId)).run();
    const row = reorderRows(db, variantStats(db, NOW)).find((r) => r.variantId === lonely.variantId)!;
    expect(row).toMatchObject({ leadSource: "BRAND", leadDays: 14, vendor: "Shenzhen Display Co", status: "LOW" }); // 3 ≤ alert level 5, no sales
  });
});

describe("dead stock", () => {
  it("lists stocked colours with no net sales in the period and marks new stock", () => {
    const old = createVariant(db, 4, "old");
    const fresh = createVariant(db, 6, "fresh");
    db.$client.exec(`UPDATE stock_ledger SET timestamp = '2026-06-01 00:00:00' WHERE variant_id = '${old.variantId}'`);
    db.$client.exec(`UPDATE stock_ledger SET timestamp = '2026-10-20 00:00:00' WHERE variant_id = '${fresh.variantId}'`);
    const dead = deadStock(db, variantStats(db, NOW), 90, NOW);
    const names = dead.map((d) => d.variantId);
    expect(names).toContain(old.variantId);
    expect(names).toContain(fresh.variantId);
    expect(names).not.toContain(A); // sold this week
    const o = dead.find((d) => d.variantId === old.variantId)!;
    expect(o).toMatchObject({ stock: 4, valuePaisa: rs(4000), newStock: false, daysSinceSale: null });
    expect(dead.find((d) => d.variantId === fresh.variantId)!.newStock).toBe(true);
    expect(deadStock(db, variantStats(db, NOW), 90, NOW)[0]!.valuePaisa).toBeGreaterThanOrEqual(dead[1]!.valuePaisa); // biggest money first
  });
});

describe("inventory turnover", () => {
  it("is cost of goods ÷ average of opening and closing stock value", () => {
    const t = turnover(db, R);
    const by = Object.fromEntries(t.rows.map((r) => [r.brand, r]));
    // Samsung: start 20 × 1,000 = 20,000; end 16 × 1,000 = 16,000; average 18,000; cost of goods 5,000
    expect(by.Samsung).toMatchObject({ openingPaisa: rs(20_000), closingPaisa: rs(16_000), averagePaisa: rs(18_000), cogsPaisa: rs(5000), turns: 0.28 });
    // Apple: start 10 × 2,000; end 8 × 2,000; average 18,000; cost of goods 4,000
    expect(by.Apple).toMatchObject({ openingPaisa: rs(20_000), closingPaisa: rs(16_000), cogsPaisa: rs(4000), turns: 0.22 });
    expect(t.total).toMatchObject({ cogsPaisa: rs(9000), averagePaisa: rs(36_000), turns: 0.25, annualTurns: 18.25, daysToSell: 20 });
  });

  it("uses the same cost of goods as the ledger's sale rows once cancelled orders are taken out", () => {
    const sales = db.$client.prepare("SELECT -sum(quantity_changed * unit_cost_paisa) AS n FROM stock_ledger WHERE transaction_type IN ('STORE_SALE','COUNTER_POS')").get() as { n: number };
    const cancelled = db.$client.prepare("SELECT sum(quantity_changed * unit_cost_paisa) AS n FROM stock_ledger WHERE transaction_type = 'ORDER_CANCEL_RESTOCK'").get() as { n: number };
    expect(sales.n - cancelled.n).toBe(salesByDay(db, R).total.cost);
  });
});

describe("COD reconciliation", () => {
  it("shows what the couriers hold and owe, and agrees with the dashboard's figure", () => {
    const r = codReconciliation(db, R, "range", NOW);
    expect(r.rows.map((x) => [x.cn, x.state])).toEqual([["LP1001", "OWED"], ["LP1002", "WITH_COURIER"]]);
    expect(r.owed).toMatchObject({ n: 1, paisa: rs(1800), oldestDays: 1 });
    expect(r.withCourier).toEqual({ n: 1, paisa: rs(1800) });
    expect(r.owed.paisa).toBe(codOwedNow(db));
    expect(codReconciliation(db, R, "open", NOW).owed.paisa).toBe(codOwedNow(db));
  });

  it("shows a payment with a difference and how long the courier took", () => {
    db.update(shipments).set({ remittedPaisa: rs(1780), remittedAt: "2026-10-24T05:00:00.000Z" }).where(eq(shipments.orderId, ids.s4!)).run();
    const r = codReconciliation(db, R, "range", NOW);
    expect(r.owed.paisa).toBe(0);
    expect(r.paidInRange).toEqual({ n: 1, paisa: rs(1780) });
    expect(r.differencePaisa).toBe(-rs(20));
    expect(r.averageDaysToPay).toBe(0); // delivered 23 Oct 12:00 PKT, paid 24 Oct 10:00 PKT = 22 h
    expect(r.rows.find((x) => x.state === "PAID_DIFFERENT")).toBeTruthy();
  });

  it("leaves out a different period", () => {
    expect(codReconciliation(db, makeRange("2026-10-01", "2026-10-10"), "range", NOW).rows).toHaveLength(0);
  });
});

describe("cashier totals", () => {
  it("matches the End of day summary for the same single day", () => {
    const day = makeRange("2026-10-20", "2026-10-20");
    const t = cashierTotals(db, day);
    const eod = counterDaySummary(db, { date: "2026-10-20" });
    expect(t.rows.reduce((s, r) => s + r.totalPaisa, 0)).toBe(eod.all.totalPaisa);
    expect(t.rows.map((r) => [r.name, r.sales, r.totalPaisa])).toEqual([["C1", 1, rs(3000)], ["C2", 1, rs(3000)]]);
    expect(t.cashRefundsPaisa).toBe(0);
  });

  it("totals the period, including the manager's discounted sale, and the cash refunds paid", () => {
    const t = cashierTotals(db, R);
    const mgr = t.rows.find((r) => r.name === "MANAGER")!;
    expect(mgr).toMatchObject({ sales: 1, items: 2, totalPaisa: rs(4050), cashPaisa: rs(4050), nonCashPaisa: 0, discountPaisa: rs(450), averageTicketPaisa: rs(4050), days: 1 });
    expect(t.rows.reduce((s, r) => s + r.totalPaisa, 0)).toBe(rs(10_050));
    expect(t.cashRefundsPaisa).toBe(rs(4500)); // R1 1,500 + R2 3,000
  });
});

describe("returns, refunds and claims", () => {
  it("works out the effect on margin and follows a supplier credit", () => {
    let r = returnsImpact(db, R);
    expect(r.rows.map((x) => x.reversedPaisa)).toEqual([rs(1500), rs(3000)]);
    expect(r.totals).toMatchObject({ reversedPaisa: rs(4500), recoveredPaisa: rs(1000), replacementPaisa: 0, claimedPaisa: rs(2000), netPaisa: -rs(3500) });
    expect(r.refundsPaidPaisa).toBe(rs(4500));
    expect(r.refundsPaidByMethod).toEqual({ CASH: rs(4500) });
    expect(r.claimCreditsPaisa).toBe(0);
    expect(r.claimsOpenPaisa).toBe(rs(2000));
    const claim = listClaims(db)[0]!;
    updateClaim(db, claim.id, { actorId: MGR.id, action: "CREDIT", creditPaisa: rs(1800) }, CTX, NOW);
    r = returnsImpact(db, R);
    expect(r).toMatchObject({ claimCreditsPaisa: rs(1800), claimsOpenPaisa: 0, netWithCreditsPaisa: -rs(1700) });
  });
});

describe("purchase cost analysis", () => {
  it("adds shipping and customs to the goods and leaves out drafts from the totals", () => {
    const { rows, totals } = poCostAnalysis(db, R);
    expect(rows.map((r) => r.code)).toEqual(["PO-0001", "PO-0002"]);
    // goods: 10 × (500 × 280 = 140,000 paisa) + 5 × (1,000 × 280 = 280,000) = 2,800,000 paisa = Rs 28,000; extras Rs 1,500
    expect(rows[0]).toMatchObject({ unitsOrdered: 15, goodsPaisa: 2_800_000, extrasPaisa: rs(1500), landedPaisa: 2_950_000, upliftPercent: 5.4, landedPerUnitPaisa: 196_667, daysToReceive: 2, promisedDays: 14 });
    expect(totals).toMatchObject({ goodsPaisa: 2_800_000, extrasPaisa: rs(1500), landedPaisa: 2_950_000, unitsOrdered: 15 });
  });
});

describe("dashboard figures", () => {
  it("takes today / 7 / 30 days from the same daily numbers", () => {
    const f = dashboardFigures(db, NOW);
    const p = Object.fromEntries(f.periods.map((x) => [x.key, x]));
    expect(p.today).toMatchObject({ sales: 0, orders: 0 });
    expect(p["7d"]).toMatchObject({ sales: rs(13_050), online: rs(3000), counter: rs(10_050), orders: 5, margin: rs(4050), marginPct: 31 });
    expect(p["30d"]!.sales).toBe(rs(13_050));
    expect(f.chart).toHaveLength(30);
    expect(f.chart.at(-1)!.day).toBe("2026-10-24");
  });
});

describe("report plumbing", () => {
  it("every report runs on this history and writes a CSV with the same number of rows as the table", () => {
    for (const def of REPORTS) {
      const result = def.run(db, { range: R, options: parseOptions(def, {}), now: NOW });
      const csv = parseCsv(reportCsv(result));
      expect(csv[0]).toEqual(result.columns.map((c) => c.label));
      expect(csv.length - 1).toBe(result.rows.length + (result.totals ? 1 : 0));
      expect(result.slug).toBe(def.slug);
    }
  });

  it("writes money in rupees and guards against spreadsheet formulas", () => {
    const sales = reportBySlug("sales")!.run(db, { range: R, options: {}, now: NOW });
    const csv = parseCsv(reportCsv(sales));
    expect(csv[1]![0]).toBe("2026-10-20");
    expect(csv[1]![sales.columns.findIndex((c) => c.key === "counterSales")]).toBe("6000.00");
    const margin = reportBySlug("margin")!.run(db, { range: R, options: {}, now: NOW });
    expect(reportCsv({ ...margin, rows: [{ ...margin.rows[0]!, brand: "=HYPERLINK(1)" }] })).toContain("'=HYPERLINK(1)");
  });

  it("reads periods from the address, caps them, and ignores nonsense", () => {
    expect(parseRange({ range: "7d" }, NOW)).toMatchObject({ from: "2026-10-18", to: "2026-10-24", days: 7 });
    expect(parseRange({ range: "month" }, NOW)).toMatchObject({ from: "2026-10-01", to: "2026-10-24" });
    expect(parseRange({ from: "2026-10-24", to: "2026-10-20" }, NOW)).toMatchObject({ from: "2026-10-20", to: "2026-10-24", days: 5 });
    expect(parseRange({ from: "2020-01-01", to: "2026-10-24" }, NOW).days).toBe(366);
    expect(parseRange({ from: "nope", to: "2026-13-45" }, NOW)).toMatchObject({ days: 30, to: "2026-10-24" });
    expect(lastDays(1, NOW).start).toBe("2026-10-23 19:00:00");
  });

  it("only accepts a report option from its list", () => {
    const def = reportBySlug("dead-stock")!;
    expect(parseOptions(def, { days: "180" })).toEqual({ days: "180" });
    expect(parseOptions(def, { days: "1; DROP TABLE orders" })).toEqual({ days: "90" });
  });

  it("changes nothing in the database", () => {
    const before = db.$client.prepare("SELECT (SELECT count(*) FROM orders) o, (SELECT count(*) FROM stock_ledger) l, (SELECT sum(current_stock) FROM product_variants) s").get();
    for (const def of REPORTS) def.run(db, { range: R, options: parseOptions(def, {}), now: NOW });
    dashboardFigures(db, NOW);
    expect(db.$client.prepare("SELECT (SELECT count(*) FROM orders) o, (SELECT count(*) FROM stock_ledger) l, (SELECT sum(current_stock) FROM product_variants) s").get()).toEqual(before);
  });
});
