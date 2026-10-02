import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, productVariants, products, purchaseOrderItems, purchaseOrders, stockLedger, user, vendors } from "@/db/schema";
import { findLedgerDrift } from "@/server/inventory/stock";
import { foreignToPaisa, landedUnitCosts, majorToMinor, weightedAverageCost } from "@/server/purchasing/costing";
import {
  PurchaseOrderError,
  addPoLine,
  cancelPo,
  closePoShort,
  createDraftPo,
  markOrdered,
  receivePo,
  removePoLine,
  updatePoHeader,
  updatePoLine,
} from "@/server/purchasing/purchase-orders";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 6 — purchase orders (SPECIFICATION.md §4.6). */

const ctx = { ip: "127.0.0.1", userAgent: "vitest" };
const manager = { id: "u-manager" };
let db: DB;
let vendorId: string;

const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const costOf = (productId: string) => db.select({ c: products.costPrice }).from(products).where(eq(products.id, productId)).get()!.c;
const poStatus = (id: string) => db.select({ s: purchaseOrders.status }).from(purchaseOrders).where(eq(purchaseOrders.id, id)).get()!.s;
const lines = (poId: string) => db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId)).all();

beforeEach(() => {
  db = testDb();
  db.insert(user).values({ id: manager.id, name: "Maryam (manager)", email: "m@caidea.test", role: "MANAGER", isActive: true }).run();
  vendorId = crypto.randomUUID();
  db.insert(vendors).values({ id: vendorId, code: "V-T1", name: "Shenzhen Display Co", currency: "USD", country: "CN" }).run();
});

/** A draft PO with one line, ready to order. */
function orderedPo(variantId: string, qty: number, unitMinor: number, header: Parameters<typeof updatePoHeader>[2] = {}) {
  const po = createDraftPo(db, vendorId, manager, ctx);
  updatePoHeader(db, po.id, header, manager, ctx);
  const lineId = addPoLine(db, po.id, { variantId, qtyOrdered: qty, unitCostForeign: unitMinor }, manager, ctx);
  markOrdered(db, po.id, manager, ctx);
  return { ...po, lineId };
}

describe("costing maths", () => {
  it("converts foreign minor units with the FX rate", () => {
    expect(foreignToPaisa(4250, 280)).toBe(1_190_000); // $42.50 × 280 = Rs 11,900
    expect(foreignToPaisa(1999, 1)).toBe(1999);
  });

  it("shares extra costs by line value and the shares add up exactly", () => {
    const costs = landedUnitCosts(
      [
        { id: "a", qtyOrdered: 10, unitCostForeign: 1000 }, // value 10,000
        { id: "b", qtyOrdered: 5, unitCostForeign: 6000 }, // value 30,000
      ],
      1,
      40_000, // Rs 400 of extras → a gets 10,000, b gets 30,000
    );
    expect(costs.get("a")).toBe(2000); // (10,000 + 10,000) / 10
    expect(costs.get("b")).toBe(12_000); // (30,000 + 30,000) / 5
  });

  it("splits by quantity when every line is free", () => {
    const costs = landedUnitCosts([{ id: "a", qtyOrdered: 1, unitCostForeign: 0 }, { id: "b", qtyOrdered: 3, unitCostForeign: 0 }], 1, 400);
    expect(costs.get("a")).toBe(100);
    expect(costs.get("b")).toBe(100);
  });

  it("averages cost by units held", () => {
    expect(weightedAverageCost(10_000, 0, 13_000, 5)).toBe(13_000);
    expect(weightedAverageCost(10_000, 10, 13_000, 10)).toBe(11_500);
    expect(weightedAverageCost(10_000, 3, 13_000, 1)).toBe(10_750);
  });

  it("reads money typed by staff", () => {
    expect(majorToMinor("42.5")).toBe(4250);
    expect(majorToMinor("1,200")).toBe(120_000);
    expect(majorToMinor("1.234")).toBeNull();
    expect(majorToMinor("-3")).toBeNull();
  });
});

describe("purchase order lifecycle", () => {
  it("numbers POs PO-0001, PO-0002 and takes the vendor's currency", () => {
    const a = createDraftPo(db, vendorId, manager, ctx);
    const b = createDraftPo(db, vendorId, manager, ctx);
    expect([a.code, b.code]).toEqual(["PO-0001", "PO-0002"]);
    expect(db.select().from(purchaseOrders).where(eq(purchaseOrders.id, a.id)).get()!.currency).toBe("USD");
  });

  it("receiving 20 units raises stock by 20 with a ledger row naming the manager (M6 Done-when)", () => {
    const { productId, variantId } = createVariant(db, 0);
    const po = orderedPo(variantId, 20, 4000, { fxRateToPkr: 280 }); // $40.00 each at 280

    const result = receivePo(db, po.id, [{ lineId: po.lineId, qty: 20, receivedBefore: 0 }], manager, ctx);

    expect(result).toEqual({ status: "RECEIVED", unitsReceived: 20 });
    expect(stockOf(variantId)).toBe(20);
    const [row] = db.select().from(stockLedger).where(eq(stockLedger.variantId, variantId)).all();
    expect(row).toMatchObject({ transactionType: "INBOUND_PO", quantityChanged: 20, previousStock: 0, newStock: 20, referenceType: "PO", referenceId: po.id, operatorId: manager.id, unitCostPaisa: 1_120_000 });
    expect(costOf(productId)).toBe(11_200); // Rs 11,200 = $40 × 280, no stock before
    expect(poStatus(po.id)).toBe("RECEIVED");
  });

  it("partial receipts move to PARTIALLY_RECEIVED, then RECEIVED", () => {
    const { variantId } = createVariant(db, 0);
    const po = orderedPo(variantId, 10, 1000);

    expect(receivePo(db, po.id, [{ lineId: po.lineId, qty: 4, receivedBefore: 0 }], manager, ctx).status).toBe("PARTIALLY_RECEIVED");
    expect(stockOf(variantId)).toBe(4);
    expect(lines(po.id)[0]!.qtyReceived).toBe(4);

    expect(receivePo(db, po.id, [{ lineId: po.lineId, qty: 6, receivedBefore: 4 }], manager, ctx).status).toBe("RECEIVED");
    expect(stockOf(variantId)).toBe(10);
    expect(db.select().from(stockLedger).where(eq(stockLedger.referenceId, po.id)).all()).toHaveLength(2);
  });

  it("a double-submitted receipt is refused, so goods are never counted twice", () => {
    const { variantId } = createVariant(db, 0);
    const po = orderedPo(variantId, 10, 1000);
    const receipt = [{ lineId: po.lineId, qty: 5, receivedBefore: 0 }];
    receivePo(db, po.id, receipt, manager, ctx);

    expect(() => receivePo(db, po.id, receipt, manager, ctx)).toThrow(/changed while you were entering/);
    expect(stockOf(variantId)).toBe(5);
  });

  it("can't receive more than is outstanding, and rolls back every line", () => {
    const a = createVariant(db, 0, "a").variantId;
    const b = createVariant(db, 0, "b").variantId;
    const po = createDraftPo(db, vendorId, manager, ctx);
    const la = addPoLine(db, po.id, { variantId: a, qtyOrdered: 5, unitCostForeign: 100 }, manager, ctx);
    const lb = addPoLine(db, po.id, { variantId: b, qtyOrdered: 2, unitCostForeign: 100 }, manager, ctx);
    markOrdered(db, po.id, manager, ctx);

    expect(() =>
      receivePo(db, po.id, [{ lineId: la, qty: 5, receivedBefore: 0 }, { lineId: lb, qty: 3, receivedBefore: 0 }], manager, ctx),
    ).toThrow(/Only 2 units left/);
    expect(stockOf(a)).toBe(0);
    expect(poStatus(po.id)).toBe("ORDERED");
  });

  it("spreads shipping and customs into landed cost and re-averages the product cost", () => {
    const { productId, variantId } = createVariant(db, 10); // seed cost Rs 1,000, 10 on hand
    const po = orderedPo(variantId, 10, 120_000, { currency: "PKR", shippingCostPaisa: 50_000, customsDutyPaisa: 150_000 }); // Rs 1,200 + Rs 2,000 extras

    receivePo(db, po.id, [{ lineId: po.lineId, qty: 10, receivedBefore: 0 }], manager, ctx);

    expect(lines(po.id)[0]!.landedUnitCostPaisa).toBe(140_000); // 1,200 + 2,000/10 = Rs 1,400
    expect(costOf(productId)).toBe(1200); // (10 × 1,000 + 10 × 1,400) / 20
  });

  it("locks lines after ordering and extra costs after the first receipt", () => {
    const { variantId } = createVariant(db, 0);
    const other = createVariant(db, 0, "2").variantId;
    const po = orderedPo(variantId, 10, 1000);

    expect(() => addPoLine(db, po.id, { variantId: other, qtyOrdered: 1, unitCostForeign: 1 }, manager, ctx)).toThrow(PurchaseOrderError);
    expect(() => updatePoLine(db, po.lineId, { qtyOrdered: 3, unitCostForeign: 1 }, manager, ctx)).toThrow(/only drafts/);
    expect(() => updatePoHeader(db, po.id, { fxRateToPkr: 300 }, manager, ctx)).toThrow(/draft/);
    updatePoHeader(db, po.id, { shippingCostPaisa: 5000 }, manager, ctx); // still fine before receiving

    receivePo(db, po.id, [{ lineId: po.lineId, qty: 1, receivedBefore: 0 }], manager, ctx);
    expect(() => updatePoHeader(db, po.id, { customsDutyPaisa: 9000 }, manager, ctx)).toThrow(/locked/);
    updatePoHeader(db, po.id, { notes: "Second box arriving Friday" }, manager, ctx); // notes always allowed
  });

  it("edits, removes and refuses duplicate lines while a draft", () => {
    const { variantId } = createVariant(db, 0);
    const po = createDraftPo(db, vendorId, manager, ctx);
    const line = addPoLine(db, po.id, { variantId, qtyOrdered: 2, unitCostForeign: 500 }, manager, ctx);
    expect(() => addPoLine(db, po.id, { variantId, qtyOrdered: 1, unitCostForeign: 500 }, manager, ctx)).toThrow(/already on this PO/);
    updatePoLine(db, line, { qtyOrdered: 7, unitCostForeign: 450 }, manager, ctx);
    expect(lines(po.id)[0]).toMatchObject({ qtyOrdered: 7, unitCostForeign: 450 });
    removePoLine(db, line, manager, ctx);
    expect(lines(po.id)).toHaveLength(0);
    expect(() => markOrdered(db, po.id, manager, ctx)).toThrow(/at least one line/);
  });

  it("cancels only before anything arrives, and closes short with a reason", () => {
    const { variantId } = createVariant(db, 0);
    const a = orderedPo(variantId, 5, 100);
    cancelPo(db, a.id, "Supplier out of stock", manager, ctx);
    expect(poStatus(a.id)).toBe("CANCELLED");
    expect(() => receivePo(db, a.id, [{ lineId: a.lineId, qty: 1, receivedBefore: 0 }], manager, ctx)).toThrow(/cancelled/);

    const b = orderedPo(variantId, 5, 100);
    receivePo(db, b.id, [{ lineId: b.lineId, qty: 3, receivedBefore: 0 }], manager, ctx);
    expect(() => cancelPo(db, b.id, "x", manager, ctx)).toThrow(PurchaseOrderError);
    expect(() => closePoShort(db, b.id, " ", manager, ctx)).toThrow(/why/);
    closePoShort(db, b.id, "Supplier short-shipped 2", manager, ctx);
    expect(poStatus(b.id)).toBe("RECEIVED");
    expect(stockOf(variantId)).toBe(3);
  });

  it("writes an audit row for every change and keeps the ledger in balance", () => {
    const { variantId } = createVariant(db, 0);
    const po = orderedPo(variantId, 3, 100);
    receivePo(db, po.id, [{ lineId: po.lineId, qty: 3, receivedBefore: 0 }], manager, ctx);
    const actions = db.select({ a: adminAuditLog.action }).from(adminAuditLog).where(eq(adminAuditLog.actorId, manager.id)).all().map((r) => r.a);
    expect(actions).toEqual(["po.create", "po.line.add", "po.order", "po.receive"]); // header call with no changes writes nothing
    expect(findLedgerDrift(db)).toEqual([]);
  });
});
