import { asc, eq, inArray, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { productVariants, products, purchaseOrderItems, purchaseOrders, vendors } from "@/db/schema";
import type { PurchaseOrderStatus } from "@/db/schema/purchasing";
import { fromPaisa, paisa, toPaisa } from "@/lib/money";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { applyStockMovement, withStockTransaction } from "@/server/inventory/stock";
import { landedUnitCosts, weightedAverageCost } from "./costing";

/**
 * Purchase orders — SPECIFICATION.md §4.6 and §6 (receiving writes INBOUND_PO through the stock engine).
 *
 * Status machine:  DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED
 *                  DRAFT | ORDERED → CANCELLED            (nothing received yet)
 *                  PARTIALLY_RECEIVED → RECEIVED           ("close short", reason required — v1.5)
 *
 * Editing rules (v1.5): lines, currency and FX rate change only in DRAFT; extra (landed) costs
 * change until the first receipt; expected date and notes until the PO is finished.
 */

export type Actor = { id: string };

/** A rule was broken; the message is written for staff. */
export class PurchaseOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseOrderError";
  }
}

const OPEN_FOR_NOTES: PurchaseOrderStatus[] = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"];

function loadPo(tx: Tx, poId: string) {
  const po = tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).get();
  if (!po) throw new PurchaseOrderError("Purchase order not found.");
  return po;
}

function linesOf(tx: Tx, poId: string) {
  return tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId)).orderBy(asc(purchaseOrderItems.id)).all();
}

function requireStatus(po: { status: PurchaseOrderStatus; code: string }, allowed: PurchaseOrderStatus[], doing: string) {
  if (!allowed.includes(po.status)) {
    throw new PurchaseOrderError(`${po.code} is ${po.status.toLowerCase().replaceAll("_", " ")}, so you can’t ${doing}.`);
  }
}

/** PO-0001, PO-0002 … — next number after the highest existing one. */
function nextPoCode(tx: Tx): string {
  const row = tx
    .select({ n: sql<number | null>`max(cast(substr(${purchaseOrders.code}, 4) as integer))` })
    .from(purchaseOrders)
    .where(sql`${purchaseOrders.code} glob 'PO-[0-9]*'`)
    .get();
  return `PO-${String((row?.n ?? 0) + 1).padStart(4, "0")}`;
}

export function createDraftPo(db: DB, vendorId: string, actor: Actor, ctx: AuditContext): { id: string; code: string } {
  return withStockTransaction(db, (tx) => {
    const vendor = tx.select().from(vendors).where(eq(vendors.id, vendorId)).get();
    if (!vendor) throw new PurchaseOrderError("Choose a vendor.");
    if (vendor.archivedAt) throw new PurchaseOrderError(`${vendor.name} is archived. Restore the vendor first.`);
    const id = crypto.randomUUID();
    const code = nextPoCode(tx);
    tx.insert(purchaseOrders)
      .values({ id, code, vendorId, currency: vendor.currency, fxRateToPkr: 1, createdBy: actor.id })
      .run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.create", entity: "purchase_orders", entityId: id, after: { code, vendorId } });
    return { id, code };
  });
}

export type PoHeaderInput = {
  currency?: "PKR" | "USD" | "CNY" | "AED";
  fxRateToPkr?: number;
  shippingCostPaisa?: number;
  customsDutyPaisa?: number;
  otherLandedCostPaisa?: number;
  expectedAt?: string | null;
  notes?: string | null;
};

export function updatePoHeader(db: DB, poId: string, input: PoHeaderInput, actor: Actor, ctx: AuditContext): void {
  withStockTransaction(db, (tx) => {
    const po = loadPo(tx, poId);
    requireStatus(po, OPEN_FOR_NOTES, "edit it");

    const changes: Partial<typeof purchaseOrders.$inferInsert> = {};
    const anyReceived = linesOf(tx, poId).some((l) => l.qtyReceived > 0);

    if (input.currency !== undefined || input.fxRateToPkr !== undefined) {
      const currency = input.currency ?? po.currency;
      const fx = currency === "PKR" ? 1 : (input.fxRateToPkr ?? po.fxRateToPkr);
      if (currency !== po.currency || fx !== po.fxRateToPkr) {
        if (po.status !== "DRAFT") throw new PurchaseOrderError("Currency and exchange rate can only change while the PO is a draft.");
        if (!(fx > 0) || fx > 10_000) throw new PurchaseOrderError("Enter an exchange rate above 0 (PKR for 1 unit of the currency).");
        changes.currency = currency;
        changes.fxRateToPkr = fx;
      }
    }

    const costs = (["shippingCostPaisa", "customsDutyPaisa", "otherLandedCostPaisa"] as const).filter(
      (k) => input[k] !== undefined && input[k] !== po[k],
    );
    if (costs.length > 0) {
      if (anyReceived) throw new PurchaseOrderError("Shipping, customs and other costs are locked once goods have been received, because stock costs were worked out from them.");
      for (const k of costs) {
        const v = input[k]!;
        if (!Number.isSafeInteger(v) || v < 0) throw new PurchaseOrderError("Costs must be 0 or more.");
        changes[k] = v;
      }
    }

    if (input.expectedAt !== undefined) changes.expectedAt = input.expectedAt;
    if (input.notes !== undefined) changes.notes = input.notes;
    if (Object.keys(changes).length === 0) return;

    tx.update(purchaseOrders).set(changes).where(eq(purchaseOrders.id, poId)).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.update", entity: "purchase_orders", entityId: poId, before: po, after: changes });
  });
}

export type PoLineInput = { variantId: string; qtyOrdered: number; unitCostForeign: number };

function checkLine(input: Pick<PoLineInput, "qtyOrdered" | "unitCostForeign">) {
  if (!Number.isSafeInteger(input.qtyOrdered) || input.qtyOrdered < 1 || input.qtyOrdered > 100_000) {
    throw new PurchaseOrderError("Quantity must be a whole number from 1 to 100,000.");
  }
  if (!Number.isSafeInteger(input.unitCostForeign) || input.unitCostForeign < 0) throw new PurchaseOrderError("Unit cost must be 0 or more.");
}

export function addPoLine(db: DB, poId: string, input: PoLineInput, actor: Actor, ctx: AuditContext): string {
  checkLine(input);
  return withStockTransaction(db, (tx) => {
    const po = loadPo(tx, poId);
    requireStatus(po, ["DRAFT"], "add lines (only drafts can be changed)");
    const variant = tx
      .select({ id: productVariants.id, archivedAt: productVariants.archivedAt, productArchivedAt: products.archivedAt })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(eq(productVariants.id, input.variantId))
      .get();
    if (!variant) throw new PurchaseOrderError("Choose a screen and colour.");
    if (variant.archivedAt || variant.productArchivedAt) throw new PurchaseOrderError("That screen is archived. Restore it before ordering.");
    if (linesOf(tx, poId).some((l) => l.variantId === input.variantId)) {
      throw new PurchaseOrderError("That screen and colour is already on this PO. Change its quantity instead.");
    }
    const id = crypto.randomUUID();
    tx.insert(purchaseOrderItems).values({ id, poId, ...input }).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.line.add", entity: "purchase_order_items", entityId: id, after: { poId, ...input } });
    return id;
  });
}

export function updatePoLine(db: DB, lineId: string, input: Omit<PoLineInput, "variantId">, actor: Actor, ctx: AuditContext): void {
  checkLine(input);
  withStockTransaction(db, (tx) => {
    const line = tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, lineId)).get();
    if (!line) throw new PurchaseOrderError("That line no longer exists.");
    requireStatus(loadPo(tx, line.poId), ["DRAFT"], "change lines (only drafts can be changed)");
    tx.update(purchaseOrderItems).set(input).where(eq(purchaseOrderItems.id, lineId)).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.line.update", entity: "purchase_order_items", entityId: lineId, before: line, after: input });
  });
}

export function removePoLine(db: DB, lineId: string, actor: Actor, ctx: AuditContext): void {
  withStockTransaction(db, (tx) => {
    const line = tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, lineId)).get();
    if (!line) return;
    requireStatus(loadPo(tx, line.poId), ["DRAFT"], "remove lines (only drafts can be changed)");
    tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.id, lineId)).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.line.remove", entity: "purchase_order_items", entityId: lineId, before: line });
  });
}

export function markOrdered(db: DB, poId: string, actor: Actor, ctx: AuditContext): void {
  withStockTransaction(db, (tx) => {
    const po = loadPo(tx, poId);
    requireStatus(po, ["DRAFT"], "mark it as ordered");
    if (linesOf(tx, poId).length === 0) throw new PurchaseOrderError("Add at least one line before marking the PO as ordered.");
    const orderedAt = new Date().toISOString();
    tx.update(purchaseOrders).set({ status: "ORDERED", orderedAt }).where(eq(purchaseOrders.id, poId)).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.order", entity: "purchase_orders", entityId: poId, before: { status: po.status }, after: { status: "ORDERED", orderedAt } });
  });
}

export function cancelPo(db: DB, poId: string, reason: string, actor: Actor, ctx: AuditContext): void {
  if (!reason.trim()) throw new PurchaseOrderError("Give a reason for cancelling.");
  withStockTransaction(db, (tx) => {
    const po = loadPo(tx, poId);
    requireStatus(po, ["DRAFT", "ORDERED"], "cancel it");
    if (linesOf(tx, poId).some((l) => l.qtyReceived > 0)) throw new PurchaseOrderError("Goods have already been received on this PO, so it can’t be cancelled.");
    const notes = [po.notes, `Cancelled: ${reason.trim()}`].filter(Boolean).join("\n");
    tx.update(purchaseOrders).set({ status: "CANCELLED", notes }).where(eq(purchaseOrders.id, poId)).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.cancel", entity: "purchase_orders", entityId: poId, before: { status: po.status }, after: { status: "CANCELLED", reason } });
  });
}

export function closePoShort(db: DB, poId: string, reason: string, actor: Actor, ctx: AuditContext): void {
  if (!reason.trim()) throw new PurchaseOrderError("Say why the rest won’t arrive (e.g. “supplier short-shipped 3”).");
  withStockTransaction(db, (tx) => {
    const po = loadPo(tx, poId);
    requireStatus(po, ["PARTIALLY_RECEIVED"], "close it short");
    const notes = [po.notes, `Closed short: ${reason.trim()}`].filter(Boolean).join("\n");
    tx.update(purchaseOrders).set({ status: "RECEIVED", receivedAt: new Date().toISOString(), notes }).where(eq(purchaseOrders.id, poId)).run();
    writeAudit(tx, ctx, { actorId: actor.id, action: "po.close_short", entity: "purchase_orders", entityId: poId, before: { status: po.status }, after: { status: "RECEIVED", reason } });
  });
}

export type Receipt = {
  lineId: string;
  /** Units arriving now. */
  qty: number;
  /** qty_received the form showed — if it changed since, someone else received in the meantime. */
  receivedBefore: number;
};

export type ReceiveResult = { status: PurchaseOrderStatus; unitsReceived: number };

/**
 * Receives goods (all or part). In ONE transaction:
 *  - checks each line still matches what the form showed (stops double-submits receiving twice),
 *  - adds stock through applyStockMovement (INBOUND_PO, landed unit cost on the ledger row),
 *  - stores each line's landed unit cost and re-averages the product's cost price (WAC),
 *  - moves the PO to PARTIALLY_RECEIVED or RECEIVED.
 */
export function receivePo(db: DB, poId: string, receipts: readonly Receipt[], actor: Actor, ctx: AuditContext): ReceiveResult {
  const wanted = receipts.filter((r) => r.qty !== 0);
  if (wanted.length === 0) throw new PurchaseOrderError("Enter how many units arrived on at least one line.");
  for (const r of wanted) {
    if (!Number.isSafeInteger(r.qty) || r.qty < 0) throw new PurchaseOrderError("Received quantities must be whole numbers, 0 or more.");
  }

  return withStockTransaction(db, (tx) => {
    const po = loadPo(tx, poId);
    requireStatus(po, ["ORDERED", "PARTIALLY_RECEIVED"], "receive goods on it");
    const lines = linesOf(tx, poId);
    const byId = new Map(lines.map((l) => [l.id, l]));

    const landed = landedUnitCosts(lines, po.fxRateToPkr, po.shippingCostPaisa + po.customsDutyPaisa + po.otherLandedCostPaisa);

    let units = 0;
    for (const r of wanted) {
      const line = byId.get(r.lineId);
      if (!line) throw new PurchaseOrderError("A line on this PO no longer exists. Reload the page.");
      if (line.qtyReceived !== r.receivedBefore) {
        throw new PurchaseOrderError(`${po.code} changed while you were entering this receipt (another receipt was saved). Nothing was received — reload and check the numbers.`);
      }
      const remaining = line.qtyOrdered - line.qtyReceived;
      if (r.qty > remaining) throw new PurchaseOrderError(`Only ${remaining} unit${remaining === 1 ? "" : "s"} left to receive on one of the lines — you entered ${r.qty}.`);

      const unitCost = landed.get(line.id)!;

      // Weighted average cost across all colours of the product (cost_price is per product).
      const product = tx
        .select({ id: products.id, costPrice: products.costPrice })
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .where(eq(productVariants.id, line.variantId))
        .get()!;
      const onHand =
        tx
          .select({ n: sql<number>`coalesce(sum(${productVariants.currentStock}), 0)` })
          .from(productVariants)
          .where(eq(productVariants.productId, product.id))
          .get()?.n ?? 0;
      const newCost = weightedAverageCost(toPaisa(product.costPrice), onHand, unitCost, r.qty);

      applyStockMovement(tx, {
        variantId: line.variantId,
        delta: r.qty,
        type: "INBOUND_PO",
        referenceType: "PO",
        referenceId: po.id,
        operatorId: actor.id,
        unitCostPaisa: unitCost,
        notes: `${po.code} receipt`,
      });
      tx.update(purchaseOrderItems)
        .set({ qtyReceived: line.qtyReceived + r.qty, landedUnitCostPaisa: unitCost })
        .where(eq(purchaseOrderItems.id, line.id))
        .run();
      tx.update(products)
        .set({ costPrice: fromPaisa(paisa(newCost)), updatedAt: new Date().toISOString() })
        .where(eq(products.id, product.id))
        .run();
      line.qtyReceived += r.qty;
      units += r.qty;
    }

    const complete = lines.every((l) => l.qtyReceived >= l.qtyOrdered);
    const status: PurchaseOrderStatus = complete ? "RECEIVED" : "PARTIALLY_RECEIVED";
    tx.update(purchaseOrders)
      .set({ status, receivedAt: complete ? new Date().toISOString() : po.receivedAt })
      .where(eq(purchaseOrders.id, poId))
      .run();
    writeAudit(tx, ctx, {
      actorId: actor.id,
      action: "po.receive",
      entity: "purchase_orders",
      entityId: poId,
      before: { status: po.status },
      after: { status, receipts: wanted.map(({ lineId, qty }) => ({ lineId, qty })) },
    });
    return { status, unitsReceived: units };
  });
}

/** Landed unit cost each line would get right now (shown on the PO page before receiving). */
export function previewLandedCosts(db: DB, poId: string): Map<string, number> {
  const po = db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).get();
  if (!po) return new Map();
  const lines = db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId)).all();
  return landedUnitCosts(lines, po.fxRateToPkr, po.shippingCostPaisa + po.customsDutyPaisa + po.otherLandedCostPaisa);
}

/** Lines of several POs at once (list page totals). */
export function lineTotals(db: DB, poIds: string[]) {
  if (poIds.length === 0) return new Map<string, { ordered: number; received: number; valueForeign: number }>();
  const rows = db
    .select({
      poId: purchaseOrderItems.poId,
      ordered: sql<number>`sum(${purchaseOrderItems.qtyOrdered})`,
      received: sql<number>`sum(${purchaseOrderItems.qtyReceived})`,
      valueForeign: sql<number>`sum(${purchaseOrderItems.qtyOrdered} * ${purchaseOrderItems.unitCostForeign})`,
    })
    .from(purchaseOrderItems)
    .where(inArray(purchaseOrderItems.poId, poIds))
    .groupBy(purchaseOrderItems.poId)
    .all();
  return new Map(rows.map((r) => [r.poId, r]));
}

