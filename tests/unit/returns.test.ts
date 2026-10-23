import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import {
  adminAuditLog,
  deliveryZones,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  purchaseOrderItems,
  purchaseOrders,
  returnItems,
  returns,
  stockLedger,
  user,
  vendorClaims,
  vendors,
  SYSTEM_USER_ID,
} from "@/db/schema";
import { completeCounterSale, karachiDayBounds } from "@/server/counter/pos";
import { applyStockMovement, findLedgerDrift, withStockTransaction } from "@/server/inventory/stock";
import { dispatchOrder } from "@/server/orders/admin-orders";
import { placeOrder, type CheckoutInput } from "@/server/orders/checkout";
import { markDelivered } from "@/server/orders/fulfilment";
import {
  ReturnError,
  approveReturn,
  cashRefundsPaid,
  closeReturn,
  createReturn,
  findOrders,
  inspectReturn,
  listReturns,
  orderForReturn,
  receiveReturn,
  recordRefund,
  rejectReturn,
  returnCounts,
  returnDetails,
  warrantyLookup,
} from "@/server/returns/returns";
import { claimTotals, listClaims, updateClaim } from "@/server/returns/vendor-claims";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { writeSetting } from "@/server/settings/store-settings";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 11 — returns (RMA), warranty, refunds and supplier claims (SPECIFICATION §4.12, §28). */

let db: DB;
let lahore: string;
let vendorId: string;
const CTX = { ip: "127.0.0.1", userAgent: "vitest" };
const MGR = "u-manager";
const OWNER = { id: "u-owner", role: "OWNER" as const };
const T0 = new Date("2026-10-04T07:00:00Z"); // sale / delivery day
const day = (n: number) => new Date(T0.getTime() + n * 86_400_000);
const rs = (n: number) => n * 100;

const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const ret = (id: string) => db.select().from(returns).where(eq(returns.id, id)).get()!;
const orderRow = (id: string) => db.select().from(orders).where(eq(orders.id, id)).get()!;
const ledger = (variantId: string, type: string) => db.select().from(stockLedger).where(and(eq(stockLedger.variantId, variantId), eq(stockLedger.transactionType, type as never))).all();
const retItems = (id: string) => db.select().from(returnItems).where(eq(returnItems.returnId, id)).all();
const fails = (fn: () => unknown, re: RegExp) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ReturnError);
    expect((e as Error).message).toMatch(re);
    return;
  }
  throw new Error("expected ReturnError");
};

/** A published variant, `stock` units, 30-day warranty, Rs 1,500 retail, cost Rs 1,000. */
function product(stock: number, suffix = "1", warrantyDays = 30) {
  const ids = createVariant(db, stock, suffix);
  db.update(products).set({ isPublished: true, warrantyDays }).where(eq(products.id, ids.productId)).run();
  return ids.variantId;
}

/** Counter cash sale at T0 → the order id. */
function counterSale(variantId: string, qty = 1, extra: Record<string, unknown> = {}) {
  const r = completeCounterSale(
    db,
    { idempotencyKey: crypto.randomUUID(), lines: [{ variantId, qty }], method: "CASH", cashReceivedPaisa: rs(1500) * qty, expectedTotalPaisa: rs(1500) * qty, ...extra },
    { id: MGR, role: "MANAGER" },
    CTX,
    T0,
  );
  return r.orderId;
}

/** Online COD order: placed → dispatched with a pasted CN → delivered at `deliveredAt`. */
function deliveredOnline(variantId: string, qty = 1, deliveredAt: Date = T0, extra: Partial<CheckoutInput> = {}) {
  const r = placeOrder(db, {
    idempotencyKey: crypto.randomUUID(),
    name: "Ayesha Khan",
    phone: "0300 1234567",
    email: "ayesha@example.com",
    line1: "House 12, Gulberg III",
    cityId: lahore,
    method: "COD",
    lines: [{ variantId, qty }],
    ...extra,
  });
  if (!r.ok) throw new Error(r.message);
  dispatchOrder(db, r.orderId, { courier: "SELF", cn: "", actorId: MGR }, CTX);
  markDelivered(db, r.orderId, { actorId: MGR }, CTX, deliveredAt);
  return r.orderId;
}

function open(orderId: string, reason = "TOUCH_FAULT", opts: { qty?: number; item?: number; received?: boolean; now?: Date } = {}) {
  const info = orderForReturn(db, orderId, opts.now);
  const line = info.lines[opts.item ?? 0]!;
  return createReturn(db, { orderId, reason, description: "Touch dead on the lower half", items: [{ orderItemId: line.orderItemId, quantity: opts.qty ?? 1 }], alreadyReceived: opts.received ?? true, actorId: MGR }, CTX, opts.now ?? day(2));
}
const inspect = (id: string, condition: string, notes = "Tested on a known-good phone") => {
  const conditions = Object.fromEntries(retItems(id).map((i) => [i.id, condition]));
  return inspectReturn(db, id, { actorId: MGR, notes, conditions }, CTX);
};
const approve = (id: string, over: Partial<Parameters<typeof approveReturn>[2]> = {}, now?: Date) => {
  const dispositions = Object.fromEntries(retItems(id).map((i) => [i.id, { disposition: i.condition === "RESELLABLE" ? "RESTOCK" : i.condition === "DEFECTIVE" ? "RETURN_TO_VENDOR" : "WRITE_OFF" }]));
  return approveReturn(db, id, { actorId: MGR, resolution: "REFUND", dispositions, ...over }, CTX, now);
};

const savedEnv = Object.fromEntries(PAYMENT_ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of PAYMENT_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

beforeEach(() => {
  db = testDb();
  writeSetting(db, "enabled_payment_methods", ["COD", "JAZZCASH", "BANK_TRANSFER"], SYSTEM_USER_ID);
  for (const k of PAYMENT_ENV_KEYS) delete process.env[k];
  Object.assign(process.env, { COD_MAX_ORDER_PKR: "20000" });
  lahore = crypto.randomUUID();
  db.insert(deliveryZones).values({ id: lahore, city: "Lahore", province: "Punjab", shippingFeePaisa: 25_000, codFeePaisa: 5_000, etaMinDays: 1, etaMaxDays: 2, mapX: 1, mapY: 1 }).run();
  for (const [id, role] of [[MGR, "MANAGER"], [OWNER.id, "OWNER"]] as const) db.insert(user).values({ id, name: id.replace("u-", ""), email: `${id}@caidea.test`, role, isActive: true }).run();
  vendorId = crypto.randomUUID();
  db.insert(vendors).values({ id: vendorId, code: "V-1", name: "Shenzhen Display Co", currency: "USD", country: "CN" }).run();
});

// ---------------------------------------------------------------------------------------------

describe("opening a return", () => {
  it("counter sale: opens as RMA-0001, received at once, warranty covered, nothing moves in stock yet", () => {
    const v = product(5);
    const orderId = counterSale(v);
    expect(stockOf(v)).toBe(4);
    const r = open(orderId);
    expect(r).toMatchObject({ code: "RMA-0001", withinWarranty: true });
    const row = ret(r.id);
    expect(row).toMatchObject({ status: "RECEIVED", reason: "TOUCH_FAULT", withinWarranty: true, createdBy: MGR });
    expect(row.receivedAt).not.toBeNull();
    expect(retItems(r.id)).toHaveLength(1);
    expect(retItems(r.id)[0]).toMatchObject({ quantity: 1, refundPaisa: rs(1500), condition: null, disposition: null });
    expect(stockOf(v)).toBe(4); // spec §4.12: stock moves only at disposition
    expect(open(counterSale(v)).code).toBe("RMA-0002");
  });

  it("online order must be delivered; a delivered one works and carries the warranty set on delivery", () => {
    const v = product(5);
    const placed = placeOrder(db, { idempotencyKey: crypto.randomUUID(), name: "Ayesha", phone: "0300 1234567", email: "a@example.com", line1: "House 1", cityId: lahore, method: "COD", lines: [{ variantId: v, qty: 1 }] });
    if (!placed.ok) throw new Error(placed.message);
    fails(() => open(placed.orderId), /once the order is delivered/);
    const delivered = deliveredOnline(v);
    const info = orderForReturn(db, delivered, day(1));
    expect(info.blocked).toBeNull();
    expect(info.lines[0]).toMatchObject({ remaining: 1, warrantyActive: true });
    expect(open(delivered).withinWarranty).toBe(true);
  });

  it("warranty check: a fault after the warranty ended is flagged outside warranty; no-warranty products too", () => {
    const v = product(5, "1", 30);
    const orderId = counterSale(v);
    const late = open(orderId, "TOUCH_FAULT", { now: day(31) });
    expect(late.withinWarranty).toBe(false);
    expect(late.warrantyText).toMatch(/warranty has ended/);
    const none = product(5, "2", 0);
    const o2 = counterSale(none);
    expect(open(o2).withinWarranty).toBe(false);
    expect(returnDetails(db, late.id)!.warrantyText).toMatch(/ended|warranty/);
  });

  it("“changed my mind” uses a 7-day window, counted from delivery for online orders", () => {
    const v = product(5);
    const orderId = counterSale(v);
    expect(open(orderId, "CHANGE_OF_MIND", { now: day(6) }).withinWarranty).toBe(true);
    const o2 = counterSale(v);
    expect(open(o2, "CHANGE_OF_MIND", { now: day(9) }).withinWarranty).toBe(false);
    const online = deliveredOnline(v, 1, day(10)); // delivered day 10
    expect(open(online, "CHANGE_OF_MIND", { now: day(14) }).withinWarranty).toBe(true); // 4 days after delivery
  });

  it("can't return more than was bought, across returns; a rejected return frees its units; the trigger backs this up", () => {
    const v = product(10);
    const orderId = counterSale(v, 2);
    const a = open(orderId, "TOUCH_FAULT", { qty: 2 });
    fails(() => open(orderId), /already been returned/);
    rejectReturn(db, a.id, { actorId: MGR, notes: "Customer damage" }, CTX);
    const b = open(orderId, "TOUCH_FAULT", { qty: 1 });
    fails(() => open(orderId, "TOUCH_FAULT", { qty: 2 }), /Only 1/);
    expect(b.code).toBe("RMA-0002");
    // even a hand-made insert is blocked by the database
    const itemId = db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).get()!.id;
    db.insert(returns).values({ id: "r-x", code: "RMA-9999", orderId, reason: "TOUCH_FAULT", withinWarranty: true }).run();
    expect(() => db.insert(returnItems).values({ returnId: "r-x", orderItemId: itemId, quantity: 2 }).run()).toThrow(/cannot return more units/);
  });

  it("input checks: reason, description, whole quantities, items from another order", () => {
    const v = product(5);
    const orderId = counterSale(v);
    const other = counterSale(v);
    const line = orderForReturn(db, orderId).lines[0]!;
    const otherLine = orderForReturn(db, other).lines[0]!;
    const base = { orderId, reason: "TOUCH_FAULT", description: "dead", items: [{ orderItemId: line.orderItemId, quantity: 1 }], actorId: MGR };
    fails(() => createReturn(db, { ...base, reason: "BORED" }, CTX), /why the item/);
    fails(() => createReturn(db, { ...base, description: " " }, CTX), /what is wrong/i);
    fails(() => createReturn(db, { ...base, items: [] }, CTX), /at least one item/);
    fails(() => createReturn(db, { ...base, items: [{ orderItemId: line.orderItemId, quantity: 1.5 }] }, CTX), /whole numbers/);
    fails(() => createReturn(db, { ...base, items: [{ orderItemId: otherLine.orderItemId, quantity: 1 }] }, CTX), /isn’t on this order/);
    fails(() => createReturn(db, { ...base, orderId: "nope" }, CTX), /Order not found/);
    expect(db.select().from(returns).all()).toHaveLength(0);
  });

  it("never-paid and cancelled orders can't be returned", () => {
    const v = product(5);
    const placed = placeOrder(db, { idempotencyKey: crypto.randomUUID(), name: "Ayesha", phone: "0300 1234567", email: "a@example.com", line1: "House 1", cityId: lahore, method: "COD", lines: [{ variantId: v, qty: 1 }] });
    if (!placed.ok) throw new Error(placed.message);
    db.update(orders).set({ fulfillmentStatus: "CANCELLED" }).where(eq(orders.id, placed.orderId)).run();
    fails(() => open(placed.orderId), /cancelled/);
    const o = counterSale(v);
    db.update(orders).set({ paymentStatus: "UNPAID" }).where(eq(orders.id, o)).run();
    fails(() => open(o), /never paid/);
  });
});

describe("receive → inspect → decide", () => {
  it("steps must come in order", () => {
    const v = product(5);
    const r = open(counterSale(v), "TOUCH_FAULT", { received: false });
    expect(ret(r.id).status).toBe("REQUESTED");
    fails(() => inspect(r.id, "DEFECTIVE"), /received/);
    fails(() => approve(r.id), /Inspect the item first/);
    receiveReturn(db, r.id, { actorId: MGR }, CTX);
    fails(() => receiveReturn(db, r.id, { actorId: MGR }, CTX), /already been received/);
    fails(() => approve(r.id), /Inspect the item first/);
    fails(() => inspect(r.id, "WEIRD"), /Choose the condition/);
    fails(() => inspect(r.id, "DEFECTIVE", ""), /inspection found/);
    inspect(r.id, "DEFECTIVE");
    expect(ret(r.id)).toMatchObject({ status: "INSPECTING", inspectedBy: MGR });
    inspect(r.id, "RESELLABLE"); // can be redone before a decision
    expect(retItems(r.id)[0]!.condition).toBe("RESELLABLE");
  });

  it("RESTOCK puts a resellable unit back on sale through the engine: REPAIR_RETURN row linked to the return", () => {
    const v = product(5);
    const r = open(counterSale(v));
    inspect(r.id, "RESELLABLE");
    approve(r.id);
    expect(stockOf(v)).toBe(5);
    const rows = ledger(v, "REPAIR_RETURN");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quantityChanged: 1, referenceType: "RETURN", referenceId: r.id, operatorId: MGR, unitCostPaisa: rs(1000), previousStock: 4, newStock: 5 });
    expect(retItems(r.id)[0]!.disposition).toBe("RESTOCK");
    expect(findLedgerDrift(db)).toEqual([]);
  });

  it("a DEFECTIVE unit does NOT add sellable stock; it becomes an OPEN claim on the supplier (cost × qty)", () => {
    const v = product(5);
    const po = crypto.randomUUID();
    db.insert(purchaseOrders).values({ id: po, code: "PO-0001", vendorId, status: "RECEIVED", createdBy: MGR }).run();
    db.insert(purchaseOrderItems).values({ poId: po, variantId: v, qtyOrdered: 5, qtyReceived: 5, unitCostForeign: 1000 }).run();
    const r = open(counterSale(v));
    inspect(r.id, "DEFECTIVE");
    approve(r.id);
    expect(stockOf(v)).toBe(4);
    expect(ledger(v, "REPAIR_RETURN")).toHaveLength(0);
    const claim = db.select().from(vendorClaims).get()!;
    expect(claim).toMatchObject({ vendorId, status: "OPEN", claimPaisa: rs(1000) });
    expect(retItems(r.id)[0]).toMatchObject({ disposition: "RETURN_TO_VENDOR", vendorId });
    expect(listClaims(db)).toHaveLength(1);
    expect(listClaims(db)[0]).toMatchObject({ vendorName: "Shenzhen Display Co", returnCode: r.code, quantity: 1 });
    expect(claimTotals(db, vendorId)).toMatchObject({ open: 1, owedPaisa: rs(1000) });
  });

  it("claims need a supplier when none ever supplied the unit; the whole approval rolls back", () => {
    const v = product(5);
    const r = open(counterSale(v));
    inspect(r.id, "DEFECTIVE");
    fails(() => approve(r.id), /Choose which supplier/);
    expect(ret(r.id).status).toBe("INSPECTING");
    expect(db.select().from(vendorClaims).all()).toHaveLength(0);
    const ids = retItems(r.id);
    approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: { [ids[0]!.id]: { disposition: "RETURN_TO_VENDOR", vendorId } } }, CTX);
    expect(db.select().from(vendorClaims).get()!.vendorId).toBe(vendorId);
  });

  it("dispositions must fit the condition", () => {
    const v = product(5);
    const r = open(counterSale(v));
    inspect(r.id, "DEFECTIVE");
    const id = retItems(r.id)[0]!.id;
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: { [id]: { disposition: "RESTOCK" } } }, CTX), /can’t go back on sale/);
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: {} }, CTX), /Choose what happens/);
    inspect(r.id, "PHYSICALLY_DAMAGED");
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: { [id]: { disposition: "RETURN_TO_VENDOR", vendorId } }, overrideReason: "goodwill" }, CTX), /only a faulty item/);
    inspect(r.id, "RESELLABLE");
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "WIN", dispositions: { [id]: { disposition: "RESTOCK" } } }, CTX), /refund, replacement or store credit/);
    expect(stockOf(v)).toBe(4);
  });

  it("outside warranty, or physically damaged (not by the courier): approval needs a written reason", () => {
    const v = product(5);
    const old = open(counterSale(v), "TOUCH_FAULT", { now: day(40) });
    inspect(old.id, "DEFECTIVE");
    const id = retItems(old.id)[0]!.id;
    const disp = { [id]: { disposition: "WRITE_OFF" } };
    fails(() => approveReturn(db, old.id, { actorId: MGR, resolution: "REFUND", dispositions: disp }, CTX), /outside warranty/);
    approveReturn(db, old.id, { actorId: MGR, resolution: "REFUND", dispositions: disp, overrideReason: "Regular customer, owner agreed" }, CTX);
    expect(ret(old.id)).toMatchObject({ status: "APPROVED", overrideReason: "Regular customer, owner agreed" });

    const dmg = open(counterSale(v), "TOUCH_FAULT");
    inspect(dmg.id, "PHYSICALLY_DAMAGED");
    fails(() => approve(dmg.id), /physically damaged/);
    // transit damage is the courier's, not the customer's
    const online = deliveredOnline(v);
    const transit = open(online, "DAMAGED_IN_TRANSIT");
    inspect(transit.id, "PHYSICALLY_DAMAGED");
    expect(() => approve(transit.id)).not.toThrow();
    expect(stockOf(v)).toBe(2); // 3 sold across the three orders; written-off units never come back
  });

  it("a REPLACEMENT sends a unit out through the engine (MANUAL_ADJUST linked to the return) and fails cleanly with no stock", () => {
    const v = product(1);
    const r = open(counterSale(v)); // stock now 0
    inspect(r.id, "DEFECTIVE");
    const id = retItems(r.id)[0]!.id;
    const disp = { [id]: { disposition: "RETURN_TO_VENDOR", vendorId } };
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REPLACEMENT", dispositions: disp }, CTX), /no replacement in stock/);
    expect(ret(r.id).status).toBe("INSPECTING");
    expect(db.select().from(vendorClaims).all()).toHaveLength(0); // rolled back with it
    // more stock arrives, then the replacement goes out
    withStockTransaction(db, (tx) => applyStockMovement(tx, { variantId: v, delta: 1, type: "INBOUND_PO", referenceType: "PO", referenceId: "po-1", operatorId: MGR }));
    const out = approveReturn(db, r.id, { actorId: MGR, resolution: "REPLACEMENT", dispositions: disp }, CTX);
    expect(out).toMatchObject({ resolution: "REPLACEMENT", refundPaisa: 0 });
    expect(stockOf(v)).toBe(0);
    expect(ledger(v, "MANUAL_ADJUST")).toHaveLength(1);
    expect(ledger(v, "MANUAL_ADJUST")[0]).toMatchObject({ quantityChanged: -1, referenceType: "RETURN", referenceId: r.id, operatorId: MGR });
    expect(ledger(v, "REPAIR_RETURN")).toHaveLength(0); // the faulty unit never re-entered stock
    expect(db.select().from(vendorClaims).all()).toHaveLength(1);
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REPLACEMENT", dispositions: disp, includeDelivery: true }, CTX), /already been decided/);
    closeReturn(db, r.id, { actorId: MGR }, CTX);
    expect(ret(r.id).status).toBe("CLOSED");
    expect(findLedgerDrift(db)).toEqual([]);
  });
});

describe("refund amounts", () => {
  it("online: items only, or items + delivery for our faults (once); less than full needs a note", () => {
    const v = product(10);
    const orderId = deliveredOnline(v, 2); // 2 × 1,500 + 250 shipping + 50 COD fee = 3,300
    expect(orderRow(orderId).totalPaisa).toBe(rs(3300));
    const r = open(orderId, "DEAD_ON_ARRIVAL", { qty: 1 });
    inspect(r.id, "DEFECTIVE");
    const d = returnDetails(db, r.id)!;
    expect(d.maxRefundPaisa).toBe(rs(1500));
    expect(d.maxRefundWithDeliveryPaisa).toBe(rs(1800));
    const id = retItems(r.id)[0]!.id;
    const disp = { [id]: { disposition: "RETURN_TO_VENDOR", vendorId } };
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: disp, refundPaisa: rs(1600) }, CTX), /At most Rs 1,500/);
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: disp, refundPaisa: rs(1000) }, CTX), /why less/);
    fails(() => approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: disp, refundPaisa: 0 }, CTX), /more than zero/);
    const out = approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: disp, includeDelivery: true }, CTX);
    expect(out.refundPaisa).toBe(rs(1800));
    expect(ret(r.id).refundIncludesDelivery).toBe(true);
    // the second unit of the same order can't take the delivery charges again
    const r2 = open(orderId, "DEAD_ON_ARRIVAL", { qty: 1 });
    inspect(r2.id, "DEFECTIVE");
    expect(returnDetails(db, r2.id)!.maxRefundWithDeliveryPaisa).toBe(rs(1500));
    const id2 = retItems(r2.id)[0]!.id;
    fails(() => approveReturn(db, r2.id, { actorId: MGR, resolution: "REFUND", dispositions: { [id2]: { disposition: "RETURN_TO_VENDOR", vendorId } }, includeDelivery: true }, CTX), /already refunded/);
  });

  it("delivery charges are only refunded for dead on arrival, wrong item or transit damage", () => {
    const v = product(10);
    const r = open(deliveredOnline(v), "CHANGE_OF_MIND");
    inspect(r.id, "RESELLABLE");
    fails(() => approve(r.id, { includeDelivery: true }), /only refunded when we caused/);
  });

  it("an order discount is shared across lines; a full return refunds exactly what was paid", () => {
    const a = product(10, "1");
    const b = product(10, "2");
    const orderId = completeCounterSale(
      db,
      { idempotencyKey: crypto.randomUUID(), lines: [{ variantId: a, qty: 1 }, { variantId: b, qty: 2 }], method: "CASH", cashReceivedPaisa: rs(4000), expectedTotalPaisa: rs(4000), discountPaisa: rs(500), discountReason: "Regular" },
      { id: MGR, role: "MANAGER" },
      CTX,
      T0,
    ).orderId;
    const lines = orderForReturn(db, orderId).lines;
    expect(lines.reduce((n, l) => n + l.netPaisa, 0)).toBe(rs(4000));
    const full = createReturn(db, { orderId, reason: "CHANGE_OF_MIND", description: "All of it", items: lines.map((l) => ({ orderItemId: l.orderItemId, quantity: l.quantity })), alreadyReceived: true, actorId: MGR }, CTX, day(1));
    expect(retItems(full.id).reduce((n, i) => n + i.refundPaisa, 0)).toBe(rs(4000));
  });

  it("returning units of one line in two goes refunds the paid total, no paisa lost to rounding", () => {
    const v = product(10);
    const orderId = completeCounterSale(
      db,
      { idempotencyKey: crypto.randomUUID(), lines: [{ variantId: v, qty: 3 }], method: "CASH", cashReceivedPaisa: rs(4500), expectedTotalPaisa: rs(4500) - 100, discountPaisa: 100, discountReason: "Rounding" },
      { id: MGR, role: "MANAGER" },
      CTX,
      T0,
    ).orderId;
    const total = orderRow(orderId).totalPaisa;
    const first = open(orderId, "CHANGE_OF_MIND", { qty: 1 });
    const second = open(orderId, "CHANGE_OF_MIND", { qty: 2 });
    const sum = [first, second].flatMap((r) => retItems(r.id)).reduce((n, i) => n + i.refundPaisa, 0);
    expect(sum).toBe(total);
  });
});

describe("reject, refund, close", () => {
  it("reject changes no stock, needs a reason, frees the units, and the customer gets the item back (close)", () => {
    const v = product(5);
    const r = open(counterSale(v));
    fails(() => rejectReturn(db, r.id, { actorId: MGR, notes: "" }, CTX), /Write why/);
    rejectReturn(db, r.id, { actorId: MGR, notes: "Cracked glass — customer damage" }, CTX);
    expect(ret(r.id)).toMatchObject({ status: "REJECTED", resolution: "REJECTED", decidedBy: MGR });
    expect(stockOf(v)).toBe(4);
    fails(() => rejectReturn(db, r.id, { actorId: MGR, notes: "again" }, CTX), /already been decided/);
    fails(() => recordRefund(db, r.id, { actorId: MGR, method: "CASH" }, CTX), /approved refund/);
    closeReturn(db, r.id, { actorId: MGR }, CTX);
    expect(ret(r.id).status).toBe("CLOSED");
    fails(() => closeReturn(db, r.id, { actorId: MGR }, CTX), /already closed/);
  });

  it("counter refund in cash: closes the return, order PARTIALLY_REFUNDED → REFUNDED on a full refund, payment row REFUNDED, shown on End of day", () => {
    const v = product(5);
    const orderId = counterSale(v, 2);
    const first = open(orderId, "TOUCH_FAULT", { qty: 1 });
    inspect(first.id, "RESELLABLE");
    approve(first.id);
    fails(() => closeReturn(db, first.id, { actorId: MGR }, CTX), /Record the refund first/);
    fails(() => recordRefund(db, first.id, { actorId: MGR, method: "BANK_TRANSFER" }, CTX), /transaction ID/);
    const paid = recordRefund(db, first.id, { actorId: OWNER.id, method: "CASH" }, CTX, T0);
    expect(paid).toMatchObject({ refundPaisa: rs(1500), orderPayment: "PARTIALLY_REFUNDED" });
    expect(ret(first.id)).toMatchObject({ status: "CLOSED", refundMethod: "CASH", refundedBy: OWNER.id });
    expect(orderRow(orderId).paymentStatus).toBe("PARTIALLY_REFUNDED");
    fails(() => recordRefund(db, first.id, { actorId: MGR, method: "CASH" }, CTX), /already recorded/);

    const second = open(orderId, "TOUCH_FAULT", { qty: 1 });
    inspect(second.id, "RESELLABLE");
    approve(second.id);
    expect(recordRefund(db, second.id, { actorId: MGR, method: "CASH" }, CTX, T0).orderPayment).toBe("REFUNDED");
    expect(orderRow(orderId).paymentStatus).toBe("REFUNDED");
    expect(db.select().from(payments).where(eq(payments.orderId, orderId)).all().every((p) => p.status === "REFUNDED")).toBe(true);
    fails(() => open(orderId), /fully refunded/);
    expect(cashRefundsPaid(db, karachiDayBounds("2026-10-04"))).toEqual({ count: 2, paisa: rs(3000) });
    expect(cashRefundsPaid(db, karachiDayBounds("2026-10-05"))).toEqual({ count: 0, paisa: 0 });
    expect(stockOf(v)).toBe(5);
  });

  it("a wallet/bank refund needs a transaction ID, which can't be reused on another return", () => {
    const v = product(5);
    const a = open(counterSale(v));
    inspect(a.id, "RESELLABLE");
    approve(a.id);
    const b = open(counterSale(v));
    inspect(b.id, "RESELLABLE");
    approve(b.id);
    fails(() => recordRefund(db, a.id, { actorId: MGR, method: "JAZZCASH", reference: "x" }, CTX), /transaction ID/);
    recordRefund(db, a.id, { actorId: MGR, method: "JAZZCASH", reference: "tx-998877" }, CTX);
    expect(ret(a.id).refundReference).toBe("TX-998877");
    fails(() => recordRefund(db, b.id, { actorId: MGR, method: "BANK_TRANSFER", reference: "TX-998877" }, CTX), /already recorded on RMA-0001/);
    expect(ret(b.id).status).toBe("APPROVED");
  });

  it("COD collected by the courier: the refund is recorded but the order's COD status is left alone", () => {
    const v = product(5);
    const orderId = deliveredOnline(v);
    expect(orderRow(orderId).paymentStatus).toBe("COD_COLLECTED");
    const r = open(orderId, "DEAD_ON_ARRIVAL");
    inspect(r.id, "DEFECTIVE");
    approve(r.id, { dispositions: { [retItems(r.id)[0]!.id]: { disposition: "RETURN_TO_VENDOR", vendorId } } });
    const out = recordRefund(db, r.id, { actorId: MGR, method: "JAZZCASH", reference: "JC-1234567" }, CTX);
    expect(out.orderPayment).toBe("COD_COLLECTED");
    expect(ret(r.id).status).toBe("CLOSED");
  });

  it("store credit needs a note to close; replacement closes plain", () => {
    const v = product(5);
    const a = open(counterSale(v));
    inspect(a.id, "RESELLABLE");
    approve(a.id, { resolution: "STORE_CREDIT" });
    expect(ret(a.id)).toMatchObject({ resolution: "STORE_CREDIT", refundPaisa: rs(1500) });
    fails(() => recordRefund(db, a.id, { actorId: MGR, method: "CASH" }, CTX), /approved refund/);
    fails(() => closeReturn(db, a.id, { actorId: MGR }, CTX), /voucher/);
    closeReturn(db, a.id, { actorId: MGR, note: "Voucher V-0042" }, CTX);
    expect(ret(a.id).status).toBe("CLOSED");
    expect(orderRow(ret(a.id).orderId).paymentStatus).toBe("PAID"); // store credit isn't money back
  });

  it("double clicks apply once", () => {
    const v = product(5);
    const r = open(counterSale(v));
    inspect(r.id, "RESELLABLE");
    approve(r.id);
    fails(() => approve(r.id), /already been decided/);
    expect(ledger(v, "REPAIR_RETURN")).toHaveLength(1);
    recordRefund(db, r.id, { actorId: MGR, method: "CASH" }, CTX);
    fails(() => recordRefund(db, r.id, { actorId: MGR, method: "CASH" }, CTX), /already recorded/);
    expect(db.select().from(adminAuditLog).where(and(eq(adminAuditLog.entity, "returns"), eq(adminAuditLog.entityId, r.id), eq(adminAuditLog.action, "return.refunded"))).all()).toHaveLength(1);
  });
});

describe("supplier claims", () => {
  function claimFor(variantQty = 1) {
    const v = product(5);
    const orderId = counterSale(v, variantQty);
    const r = open(orderId, "TOUCH_FAULT", { qty: variantQty });
    inspect(r.id, "DEFECTIVE");
    const id = retItems(r.id)[0]!.id;
    approveReturn(db, r.id, { actorId: MGR, resolution: "REFUND", dispositions: { [id]: { disposition: "RETURN_TO_VENDOR", vendorId } } }, CTX);
    return db.select().from(vendorClaims).get()!;
  }

  it("OPEN → SENT → CREDITED, with the credit capped at the claim", () => {
    const c = claimFor(2);
    expect(c.claimPaisa).toBe(rs(2000));
    fails(() => updateClaim(db, c.id, { actorId: MGR, action: "CREDIT", creditPaisa: 0 }, CTX), /more than zero/);
    expect(updateClaim(db, c.id, { actorId: MGR, action: "SEND", reference: "SZ-RMA-77" }, CTX).status).toBe("SENT");
    fails(() => updateClaim(db, c.id, { actorId: MGR, action: "SEND" }, CTX), /already been sent/);
    fails(() => updateClaim(db, c.id, { actorId: MGR, action: "CREDIT", creditPaisa: rs(2500) }, CTX), /can’t be more than the claim/);
    expect(updateClaim(db, c.id, { actorId: MGR, action: "CREDIT", creditPaisa: rs(1800) }, CTX).status).toBe("CREDITED");
    expect(claimTotals(db)).toMatchObject({ credited: 1, creditedPaisa: rs(1800), owedPaisa: 0 });
    fails(() => updateClaim(db, c.id, { actorId: MGR, action: "REJECT", notes: "late" }, CTX), /already settled/);
    expect(db.select().from(vendorClaims).get()).toMatchObject({ status: "CREDITED", reference: "SZ-RMA-77" });
  });

  it("a rejected claim needs the supplier's reason and stays out of the owed total", () => {
    const c = claimFor();
    fails(() => updateClaim(db, c.id, { actorId: MGR, action: "REJECT" }, CTX), /reason/);
    updateClaim(db, c.id, { actorId: MGR, action: "REJECT", notes: "Out of their 14-day window" }, CTX);
    expect(claimTotals(db)).toMatchObject({ rejected: 1, owedPaisa: 0 });
    fails(() => updateClaim(db, c.id, { actorId: MGR, action: "WAT" }, CTX), /already settled/);
  });

  it("one claim per returned item (database rule)", () => {
    const c = claimFor();
    expect(() => db.insert(vendorClaims).values({ vendorId, returnItemId: c.returnItemId, claimPaisa: 1 }).run()).toThrow(/UNIQUE/);
  });
});

describe("lists, lookups, audit", () => {
  it("find by order code or phone; warranty lookup shows days left and expired items", () => {
    const v = product(5);
    counterSale(v, 1, { customerPhone: "0300 7654321", customerName: "Bilal" });
    const online = deliveredOnline(v);
    const byPhone = findOrders(db, "0300 1234567");
    expect(byPhone.map((m) => m.id)).toEqual([online]);
    expect(findOrders(db, "CA-POS-")).toHaveLength(1);
    expect(findOrders(db, "zz")).toEqual([]);
    const w = warrantyLookup(db, "0300 1234567", day(10));
    expect(w[0]!.lines[0]).toMatchObject({ status: "ACTIVE", remaining: 1 });
    expect(w[0]!.lines[0]!.daysLeft).toBe(20);
    expect(warrantyLookup(db, "0300 1234567", day(60))[0]!.lines[0]!.status).toBe("EXPIRED");
  });

  it("list filters and counts; details carry items, the suggested supplier and the history", () => {
    const v = product(5);
    const po = crypto.randomUUID();
    db.insert(purchaseOrders).values({ id: po, code: "PO-0001", vendorId, status: "RECEIVED", createdBy: MGR }).run();
    db.insert(purchaseOrderItems).values({ poId: po, variantId: v, qtyOrdered: 5, qtyReceived: 5, unitCostForeign: 1000 }).run();
    const a = open(counterSale(v));
    const b = open(counterSale(v), "CHANGE_OF_MIND", { received: false });
    inspect(a.id, "DEFECTIVE");
    approve(a.id);
    expect(listReturns(db, { open: true })).toHaveLength(2);
    expect(listReturns(db, { status: "REQUESTED" }).map((r) => r.code)).toEqual([b.code]);
    expect(listReturns(db, { q: a.code })).toHaveLength(1);
    expect(listReturns(db, { q: "CA-POS" })).toHaveLength(2);
    expect(returnCounts(db)).toMatchObject({ REQUESTED: 1, APPROVED: 1, OPEN: 2, REFUND_DUE: 1 });
    const d = returnDetails(db, a.id)!;
    expect(d.items[0]).toMatchObject({ disposition: "RETURN_TO_VENDOR", vendorName: "Shenzhen Display Co", suggestedVendor: { id: vendorId } });
    expect(d.history.map((h) => h.action)).toEqual(["return.created", "return.inspected", "return.approved"]);
    expect(returnDetails(db, "nope")).toBeNull();
  });

  it("every step is audited with the actor, and ledger/stock stay consistent", () => {
    const v = product(5);
    const r = open(counterSale(v));
    inspect(r.id, "RESELLABLE");
    approve(r.id);
    recordRefund(db, r.id, { actorId: OWNER.id, method: "CASH" }, CTX);
    const rows = db.select().from(adminAuditLog).where(and(eq(adminAuditLog.entity, "returns"), eq(adminAuditLog.entityId, r.id))).all();
    expect(rows.map((x) => x.action).sort()).toEqual(["return.approved", "return.created", "return.inspected", "return.refunded"]);
    expect(rows.find((x) => x.action === "return.refunded")!.actorId).toBe(OWNER.id);
    expect(findLedgerDrift(db)).toEqual([]);
    expect(db.select().from(stockLedger).all().every((l) => l.operatorId !== "")).toBe(true);
    expect(SYSTEM_USER_ID).toBeTruthy();
  });
});
