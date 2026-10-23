import { and, asc, desc, eq, inArray, like, ne, or, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import {
  adminAuditLog,
  orderItems,
  orders,
  payments,
  purchaseOrderItems,
  purchaseOrders,
  returnItems,
  returns,
  shipments,
  user,
  vendorClaims,
  vendors,
} from "@/db/schema";
import {
  DISPOSITIONS,
  ITEM_CONDITIONS,
  REFUND_METHODS,
  RETURN_REASONS,
  RETURN_STATUSES,
} from "@/db/schema/returns";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { InsufficientStockError, applyStockMovement, withStockTransaction } from "@/server/inventory/stock";
import { parseTimestamp } from "@/lib/time";

/**
 * Milestone 11 — Returns (RMA) and warranty (SPECIFICATION §4.12, §28). OWNER/MANAGER (module `returns`).
 *
 *   REQUESTED → RECEIVED → INSPECTING → APPROVED → CLOSED
 *                                    └→ REJECTED → CLOSED
 *
 * Every change re-reads the return inside one BEGIN IMMEDIATE transaction (a double click, or two
 * staff at once, applies it once), writes admin_audit_log, and moves stock ONLY through the stock
 * engine — and only at the moment the decision is made (spec §4.12):
 *   RESTOCK          → REPAIR_RETURN (+qty), unit cost = what the order item cost
 *   RETURN_TO_VENDOR → no stock movement (the unit never goes back on the shelf); a vendor claim is opened
 *   WRITE_OFF        → no stock movement; the loss is the order item's unit cost (reports, M12)
 *   REPLACEMENT      → the replacement leaves stock as a MANUAL_ADJUST row linked to the return
 * Free of Next.js imports so it can be unit-tested; the Server Actions wrap it.
 */

export class ReturnError extends Error {}

type Order = typeof orders.$inferSelect;
type OrderItem = typeof orderItems.$inferSelect;
type Return = typeof returns.$inferSelect;
export type ReturnReason = (typeof RETURN_REASONS)[number];
export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];
export type Disposition = (typeof DISPOSITIONS)[number];
export type RefundMethod = (typeof REFUND_METHODS)[number];
export type Resolution = "REFUND" | "REPLACEMENT" | "STORE_CREDIT";

/** Q76: "I changed my mind" returns are accepted for 7 days after delivery (online) or purchase (counter). */
export const CHANGE_OF_MIND_DAYS = 7;
/** Q77: faults the shop caused — the delivery charges can be refunded with them. */
export const DELIVERY_REFUND_REASONS: readonly ReturnReason[] = ["DEAD_ON_ARRIVAL", "WRONG_ITEM", "DAMAGED_IN_TRANSIT"];

export const REASON_LABEL: Record<ReturnReason, string> = {
  DEAD_ON_ARRIVAL: "Dead on arrival",
  TOUCH_FAULT: "Touch not working",
  LINES_ON_DISPLAY: "Lines / spots on the display",
  WRONG_ITEM: "Wrong item sent",
  DAMAGED_IN_TRANSIT: "Damaged in transit",
  CHANGE_OF_MIND: "Changed their mind",
};
export const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  RECEIVED: "Item received",
  INSPECTING: "Inspected",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};
export const CONDITION_LABEL: Record<ItemCondition, string> = {
  RESELLABLE: "Good — can be sold again",
  DEFECTIVE: "Faulty (supplier’s fault)",
  PHYSICALLY_DAMAGED: "Physically damaged",
};
export const DISPOSITION_LABEL: Record<Disposition, string> = {
  RESTOCK: "Put back on sale",
  RETURN_TO_VENDOR: "Send back to the supplier (claim)",
  WRITE_OFF: "Write off",
};
export const REFUND_METHOD_LABEL: Record<RefundMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  NAYAPAY: "NayaPay",
  OTHER: "Other",
};

const REFUND_ORDER_PAYMENT = ["PAID", "COD_REMITTED", "PARTIALLY_REFUNDED"] as const;
const DAY = 86_400_000;
const clean = (s: string | null | undefined, max = 500) =>
  (s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

// ---- Reading an order for a return ----------------------------------------------------------------

function loadOrder(db: DB | Tx, orderId: string): Order {
  const o = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!o) throw new ReturnError("Order not found.");
  return o;
}

/** Why this order can’t have a return, or null when it can. */
export function returnBlockedReason(o: Order): string | null {
  if (o.fulfillmentStatus === "CANCELLED") return "This order was cancelled.";
  if (o.channel === "ONLINE" && o.fulfillmentStatus !== "DELIVERED") return "Returns can only be opened once the order is delivered. A parcel that came back to the shop is handled on the order page (Receive returned parcel).";
  if (["UNPAID", "PENDING_VERIFICATION", "FAILED"].includes(o.paymentStatus)) return "This order was never paid.";
  if (o.paymentStatus === "REFUNDED") return "This order has already been fully refunded.";
  return null;
}

/** When the customer got the goods: the courier’s delivery date for online orders, the sale time at the counter. */
export function purchasedAt(db: DB | Tx, o: Order): string {
  if (o.channel === "ONLINE") {
    const s = db
      .select({ at: shipments.deliveredAt })
      .from(shipments)
      .where(and(eq(shipments.orderId, o.id), sql`${shipments.deliveredAt} IS NOT NULL`))
      .orderBy(desc(shipments.deliveredAt))
      .get();
    if (s?.at) return s.at;
  }
  return o.placedAt;
}

/** What each order line was really paid, after its share of the order discount (the last line takes the rounding). */
function netPerLine(items: OrderItem[], discountPaisa: number): Map<string, number> {
  const subtotal = items.reduce((n, i) => n + i.lineTotalPaisa, 0);
  const out = new Map<string, number>();
  let given = 0;
  items.forEach((i, idx) => {
    const share = idx === items.length - 1 ? discountPaisa - given : subtotal > 0 ? Math.round((discountPaisa * i.lineTotalPaisa) / subtotal) : 0;
    given += share;
    out.set(i.id, Math.max(0, i.lineTotalPaisa - share));
  });
  return out;
}

export type ReturnableLine = {
  orderItemId: string;
  description: string;
  sku: string;
  quantity: number;
  unitPricePaisa: number;
  /** Units already in a return that wasn't rejected. */
  alreadyReturned: number;
  remaining: number;
  warrantyUntil: string | null;
  warrantyActive: boolean;
  /** Paid for the whole line, after the order discount. */
  netPaisa: number;
};

export type OrderForReturn = {
  order: Order;
  purchasedAt: string;
  blocked: string | null;
  lines: ReturnableLine[];
  /** Delivery + COD charges that can still be refunded (0 once a return took them). */
  deliveryRefundablePaisa: number;
  refundedPaisa: number;
};

function usedQuantities(db: DB | Tx, orderId: string) {
  const rows = db
    .select({ orderItemId: returnItems.orderItemId, qty: sql<number>`coalesce(sum(${returnItems.quantity}), 0)`, paisa: sql<number>`coalesce(sum(${returnItems.refundPaisa}), 0)` })
    .from(returnItems)
    .innerJoin(returns, eq(returns.id, returnItems.returnId))
    .where(and(eq(returns.orderId, orderId), ne(returns.status, "REJECTED")))
    .groupBy(returnItems.orderItemId)
    .all();
  return new Map(rows.map((r) => [r.orderItemId, { qty: Number(r.qty), paisa: Number(r.paisa) }]));
}

export function orderForReturn(db: DB | Tx, orderId: string, now: Date = new Date()): OrderForReturn {
  const order = loadOrder(db, orderId);
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)).all();
  const used = usedQuantities(db, order.id);
  const net = netPerLine(items, order.discountPaisa);
  const deliveryTaken = db
    .select({ id: returns.id })
    .from(returns)
    .where(and(eq(returns.orderId, order.id), ne(returns.status, "REJECTED"), eq(returns.refundIncludesDelivery, true)))
    .get();
  const refunded = db
    .select({ n: sql<number>`coalesce(sum(${returns.refundPaisa}), 0)` })
    .from(returns)
    .where(and(eq(returns.orderId, order.id), eq(returns.resolution, "REFUND"), sql`${returns.refundedAt} IS NOT NULL`))
    .get();
  return {
    order,
    purchasedAt: purchasedAt(db, order),
    blocked: returnBlockedReason(order),
    lines: items.map((i) => {
      const u = used.get(i.id)?.qty ?? 0;
      return {
        orderItemId: i.id,
        description: `${i.productSnapshot.brand} ${i.productSnapshot.model} — ${i.productSnapshot.displayType}, ${i.productSnapshot.qualityGrade}, ${i.productSnapshot.color}${i.productSnapshot.variantLabel ? ` (${i.productSnapshot.variantLabel})` : ""}`,
        sku: i.productSnapshot.sku,
        quantity: i.quantity,
        unitPricePaisa: i.unitPricePaisa,
        alreadyReturned: u,
        remaining: i.quantity - u,
        warrantyUntil: i.warrantyUntil,
        warrantyActive: i.warrantyUntil ? parseTimestamp(i.warrantyUntil) >= now.getTime() : false,
        netPaisa: net.get(i.id) ?? i.lineTotalPaisa,
      };
    }),
    deliveryRefundablePaisa: deliveryTaken ? 0 : order.shippingFeePaisa + order.codFeePaisa,
    refundedPaisa: Number(refunded?.n ?? 0),
  };
}

/** What returning `qty` units of this line refunds (the last units of a line take the rounding, so a full return refunds exactly what was paid). */
function itemRefund(item: OrderItem, netLine: number, alreadyQty: number, alreadyPaisa: number, qty: number): number {
  if (alreadyQty + qty === item.quantity) return Math.max(0, netLine - alreadyPaisa);
  return Math.floor((netLine * qty) / item.quantity);
}

// ---- Warranty check -----------------------------------------------------------------------------------

export type WarrantyVerdict = { within: boolean; text: string };

/** Q76/Q11: faults need an active warranty on every returned item; “changed my mind” needs ≤ 7 days. */
export function warrantyVerdict(reason: ReturnReason, lines: { warrantyUntil: string | null }[], boughtAt: string, now: Date): WarrantyVerdict {
  if (reason === "CHANGE_OF_MIND") {
    const days = Math.floor((now.getTime() - parseTimestamp(boughtAt)) / DAY);
    return days <= CHANGE_OF_MIND_DAYS
      ? { within: true, text: `Inside the ${CHANGE_OF_MIND_DAYS}-day change-of-mind window (${Math.max(0, days)} day${days === 1 ? "" : "s"} since purchase).` }
      : { within: false, text: `Outside the ${CHANGE_OF_MIND_DAYS}-day change-of-mind window (${days} days since purchase).` };
  }
  const expired = lines.filter((l) => !l.warrantyUntil || parseTimestamp(l.warrantyUntil) < now.getTime());
  if (expired.length === 0) return { within: true, text: "Every item is still under warranty." };
  return { within: false, text: expired.some((l) => !l.warrantyUntil) ? "An item has no warranty." : "The warranty has ended on an item." };
}

// ---- Opening a return -----------------------------------------------------------------------------------

function nextCode(tx: Tx): string {
  const r = tx.select({ n: sql<number | null>`max(cast(substr(${returns.code}, 5) as integer))` }).from(returns).get();
  return `RMA-${String((r?.n ?? 0) + 1).padStart(4, "0")}`;
}

export type CreateReturnInput = {
  orderId: string;
  reason: string;
  description: string;
  items: { orderItemId: string; quantity: number }[];
  /** The goods are already here (counter returns): skip straight to “received”. */
  alreadyReceived?: boolean;
  actorId: string;
};

export function createReturn(db: DB, input: CreateReturnInput, ctx: AuditContext, now: Date = new Date()) {
  if (!(RETURN_REASONS as readonly string[]).includes(input.reason)) throw new ReturnError("Choose why the item is coming back.");
  const reason = input.reason as ReturnReason;
  const description = clean(input.description);
  if (description.length < 3) throw new ReturnError("Write what is wrong, in a few words.");
  const wanted = new Map<string, number>();
  for (const it of input.items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 0) throw new ReturnError("Quantities must be whole numbers.");
    if (it.quantity > 0) wanted.set(it.orderItemId, (wanted.get(it.orderItemId) ?? 0) + it.quantity);
  }
  if (wanted.size === 0) throw new ReturnError("Choose at least one item to return.");

  return withStockTransaction(db, (tx) => {
    const info = orderForReturn(tx, input.orderId, now);
    if (info.blocked) throw new ReturnError(info.blocked);
    const chosen = [...wanted].map(([id, qty]) => {
      const line = info.lines.find((l) => l.orderItemId === id);
      if (!line) throw new ReturnError("One of the items isn’t on this order.");
      if (qty > line.remaining) throw new ReturnError(line.remaining === 0 ? `${line.description.split(" — ")[0]} has already been returned.` : `Only ${line.remaining} of ${line.description.split(" — ")[0]} can still be returned.`);
      return { line, qty };
    });
    const verdict = warrantyVerdict(reason, chosen.map((c) => c.line), info.purchasedAt, now);
    const items = tx.select().from(orderItems).where(eq(orderItems.orderId, info.order.id)).orderBy(asc(orderItems.id)).all();
    const net = netPerLine(items, info.order.discountPaisa);
    const used = usedQuantities(tx, info.order.id);

    const id = crypto.randomUUID();
    const code = nextCode(tx);
    const received = Boolean(input.alreadyReceived);
    tx.insert(returns)
      .values({
        id,
        code,
        orderId: info.order.id,
        customerId: info.order.customerId,
        reason,
        status: received ? "RECEIVED" : "REQUESTED",
        withinWarranty: verdict.within,
        description,
        createdBy: input.actorId,
        receivedAt: received ? now.toISOString() : null,
      })
      .run();
    for (const { line, qty } of chosen) {
      const item = items.find((i) => i.id === line.orderItemId)!;
      const u = used.get(item.id) ?? { qty: 0, paisa: 0 };
      tx.insert(returnItems)
        .values({ returnId: id, orderItemId: item.id, quantity: qty, refundPaisa: itemRefund(item, net.get(item.id) ?? item.lineTotalPaisa, u.qty, u.paisa, qty) })
        .run();
    }
    writeAudit(tx, ctx, {
      actorId: input.actorId,
      action: "return.created",
      entity: "returns",
      entityId: id,
      after: { code, order: info.order.code, reason, withinWarranty: verdict.within, warranty: verdict.text, received, items: chosen.map((c) => ({ sku: c.line.sku, qty: c.qty })) },
    });
    return { id, code, orderCode: info.order.code, withinWarranty: verdict.within, warrantyText: verdict.text };
  });
}

// ---- Loading a return -----------------------------------------------------------------------------------

function loadReturn(tx: Tx | DB, id: string): Return {
  const r = tx.select().from(returns).where(eq(returns.id, id)).get();
  if (!r) throw new ReturnError("Return not found.");
  return r;
}
const snap = (r: Return) => ({ status: r.status, resolution: r.resolution });

function items(tx: Tx | DB, returnId: string) {
  return tx
    .select({ ri: returnItems, oi: orderItems })
    .from(returnItems)
    .innerJoin(orderItems, eq(orderItems.id, returnItems.orderItemId))
    .where(eq(returnItems.returnId, returnId))
    .orderBy(asc(returnItems.id))
    .all();
}

// ---- Receive, inspect ---------------------------------------------------------------------------------

/** REQUESTED → RECEIVED: the item is physically at the shop. */
export function receiveReturn(db: DB, id: string, input: { actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  return withStockTransaction(db, (tx) => {
    const r = loadReturn(tx, id);
    if (r.status !== "REQUESTED") throw new ReturnError(r.status === "REJECTED" || r.status === "CLOSED" ? "This return is finished." : "The item has already been received.");
    tx.update(returns).set({ status: "RECEIVED", receivedAt: now.toISOString() }).where(eq(returns.id, r.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "return.received", entity: "returns", entityId: r.id, before: snap(r), after: { status: "RECEIVED" } });
    return r.code;
  });
}

/** RECEIVED / INSPECTING → INSPECTING: the condition of every item and what the inspection found. Can be redone until a decision is made. */
export function inspectReturn(db: DB, id: string, input: { actorId: string; notes: string; conditions: Record<string, string> }, ctx: AuditContext) {
  const notes = clean(input.notes);
  if (notes.length < 3) throw new ReturnError("Write what the inspection found.");
  return withStockTransaction(db, (tx) => {
    const r = loadReturn(tx, id);
    if (r.status === "REQUESTED") throw new ReturnError("Mark the item as received before inspecting it.");
    if (r.status !== "RECEIVED" && r.status !== "INSPECTING") throw new ReturnError("This return has already been decided.");
    const rows = items(tx, r.id);
    for (const { ri, oi } of rows) {
      const c = input.conditions[ri.id];
      if (!(ITEM_CONDITIONS as readonly string[]).includes(c ?? "")) throw new ReturnError(`Choose the condition of ${oi.productSnapshot.brand} ${oi.productSnapshot.model}.`);
    }
    for (const { ri } of rows) tx.update(returnItems).set({ condition: input.conditions[ri.id] as ItemCondition }).where(eq(returnItems.id, ri.id)).run();
    tx.update(returns).set({ status: "INSPECTING", inspectedBy: input.actorId, inspectionNotes: notes }).where(eq(returns.id, r.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "return.inspected", entity: "returns", entityId: r.id, before: snap(r), after: { status: "INSPECTING", notes, conditions: rows.map(({ ri }) => input.conditions[ri.id]) } });
    return r.code;
  });
}

// ---- Decide ---------------------------------------------------------------------------------------------

/** The supplier this unit came from: the vendor of the newest purchase order that received it. */
export function lastSupplier(db: DB | Tx, variantId: string): { id: string; name: string } | null {
  return (
    db
      .select({ id: vendors.id, name: vendors.name })
      .from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.poId))
      .innerJoin(vendors, eq(vendors.id, purchaseOrders.vendorId))
      .where(and(eq(purchaseOrderItems.variantId, variantId), sql`${purchaseOrderItems.qtyReceived} > 0`))
      .orderBy(desc(purchaseOrders.createdAt), desc(sql`${purchaseOrders}.rowid`))
      .get() ?? null
  );
}

export type ApproveInput = {
  actorId: string;
  resolution: string;
  /** return_items.id → what happens to the unit (and which supplier to claim from). */
  dispositions: Record<string, { disposition: string; vendorId?: string | null }>;
  includeDelivery?: boolean;
  /** Amount to refund / credit, in paisa. Defaults to the most that is allowed. */
  refundPaisa?: number;
  decisionNotes?: string;
  /** Needed to approve outside warranty, or a damaged item that isn’t transit damage. */
  overrideReason?: string;
};

/** What a decision may refund for this return, before staff lower it. */
export function maxRefund(db: DB | Tx, returnId: string, includeDelivery: boolean): number {
  const r = loadReturn(db, returnId);
  const base = items(db, r.id).reduce((n, { ri }) => n + ri.refundPaisa, 0);
  if (!includeDelivery) return base;
  const o = loadOrder(db, r.orderId);
  const taken = db
    .select({ id: returns.id })
    .from(returns)
    .where(and(eq(returns.orderId, o.id), ne(returns.id, r.id), ne(returns.status, "REJECTED"), eq(returns.refundIncludesDelivery, true)))
    .get();
  return base + (taken ? 0 : o.shippingFeePaisa + o.codFeePaisa);
}

/** INSPECTING → APPROVED. Does the stock work for every item at once; any failure rolls all of it back. */
export function approveReturn(db: DB, id: string, input: ApproveInput, ctx: AuditContext, now: Date = new Date()) {
  const resolution = input.resolution as Resolution;
  if (!["REFUND", "REPLACEMENT", "STORE_CREDIT"].includes(resolution)) throw new ReturnError("Choose what the customer gets: refund, replacement or store credit.");
  const decisionNotes = clean(input.decisionNotes);
  const overrideReason = clean(input.overrideReason);

  return withStockTransaction(db, (tx) => {
    const r = loadReturn(tx, id);
    if (r.status === "APPROVED" || r.status === "REJECTED" || r.status === "CLOSED") throw new ReturnError("This return has already been decided.");
    if (r.status !== "INSPECTING") throw new ReturnError("Inspect the item first — record its condition.");
    const o = loadOrder(tx, r.orderId);
    const rows = items(tx, r.id);

    // Warranty, and damage that isn’t the courier’s doing, need a written reason from staff (Q11, Q78)
    const needsOverride: string[] = [];
    if (!r.withinWarranty) needsOverride.push(r.reason === "CHANGE_OF_MIND" ? "it is outside the change-of-mind window" : "it is outside warranty");
    if (rows.some(({ ri }) => ri.condition === "PHYSICALLY_DAMAGED") && r.reason !== "DAMAGED_IN_TRANSIT") needsOverride.push("an item is physically damaged (not covered by warranty)");
    if (r.reason === "CHANGE_OF_MIND" && rows.some(({ ri }) => ri.condition !== "RESELLABLE")) needsOverride.push("a changed-mind item isn’t in resellable condition");
    if (needsOverride.length && overrideReason.length < 3) throw new ReturnError(`To approve this, write the reason — ${needsOverride.join(" and ")}.`);

    // Each item: a disposition that fits its condition
    for (const { ri, oi } of rows) {
      const d = input.dispositions[ri.id];
      const name = `${oi.productSnapshot.brand} ${oi.productSnapshot.model}`;
      if (!d || !(DISPOSITIONS as readonly string[]).includes(d.disposition)) throw new ReturnError(`Choose what happens to ${name}: back on sale, back to the supplier, or write off.`);
      if (d.disposition === "RESTOCK" && ri.condition !== "RESELLABLE") throw new ReturnError(`${name} isn’t in good condition, so it can’t go back on sale.`);
      if (d.disposition === "RETURN_TO_VENDOR" && ri.condition !== "DEFECTIVE") throw new ReturnError(`${name}: only a faulty item can be claimed from the supplier (damage isn’t their fault).`);
    }

    // Money
    const wantsDelivery = Boolean(input.includeDelivery);
    if (wantsDelivery && !DELIVERY_REFUND_REASONS.includes(r.reason as ReturnReason)) throw new ReturnError("Delivery charges are only refunded when we caused the problem (dead on arrival, wrong item, damaged in transit).");
    let refund = 0;
    if (resolution !== "REPLACEMENT") {
      const max = maxRefund(tx, r.id, wantsDelivery);
      if (wantsDelivery && max === rows.reduce((n, { ri }) => n + ri.refundPaisa, 0) && o.shippingFeePaisa + o.codFeePaisa > 0) throw new ReturnError("The delivery charges were already refunded on another return of this order.");
      refund = input.refundPaisa ?? max;
      if (!Number.isInteger(refund) || refund <= 0) throw new ReturnError("The amount must be more than zero.");
      if (refund > max) throw new ReturnError(`At most Rs ${(max / 100).toLocaleString("en-PK")} can be ${resolution === "REFUND" ? "refunded" : "credited"} for this return.`);
      if (refund < max && decisionNotes.length < 3) throw new ReturnError("Write why less than the full amount is given back.");
    } else if (wantsDelivery) {
      throw new ReturnError("A replacement has no refund, so there are no delivery charges to give back.");
    }

    // Stock and supplier claims
    try {
      for (const { ri, oi } of rows) {
        const d = input.dispositions[ri.id]!;
        const disposition = d.disposition as Disposition;
        let vendorId: string | null = null;
        if (disposition === "RESTOCK") {
          applyStockMovement(tx, { variantId: oi.variantId, delta: ri.quantity, type: "REPAIR_RETURN", referenceType: "RETURN", referenceId: r.id, operatorId: input.actorId, unitCostPaisa: oi.unitCostPaisa, notes: `${r.code} — back on sale` });
        } else if (disposition === "RETURN_TO_VENDOR") {
          vendorId = d.vendorId || lastSupplier(tx, oi.variantId)?.id || null;
          if (!vendorId) throw new ReturnError(`Choose which supplier to claim ${oi.productSnapshot.brand} ${oi.productSnapshot.model} from — no purchase order has received it.`);
          if (!tx.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, vendorId)).get()) throw new ReturnError("That supplier no longer exists.");
          tx.insert(vendorClaims).values({ vendorId, returnItemId: ri.id, claimPaisa: oi.unitCostPaisa * ri.quantity, notes: `${r.code}: ${r.description ?? ""}`.slice(0, 300) }).run();
        }
        tx.update(returnItems).set({ disposition, vendorId }).where(eq(returnItems.id, ri.id)).run();
        if (resolution === "REPLACEMENT") {
          applyStockMovement(tx, { variantId: oi.variantId, delta: -ri.quantity, type: "MANUAL_ADJUST", referenceType: "RETURN", referenceId: r.id, operatorId: input.actorId, unitCostPaisa: oi.unitCostPaisa, notes: `${r.code} — replacement sent to the customer` });
        }
      }
    } catch (e) {
      if (e instanceof InsufficientStockError) throw new ReturnError("There is no replacement in stock. Put the returned unit back on sale first (if it is good), choose a refund, or receive more stock.");
      throw e;
    }

    tx.update(returns)
      .set({ status: "APPROVED", resolution, refundPaisa: refund, refundIncludesDelivery: wantsDelivery, decidedBy: input.actorId, decidedAt: now.toISOString(), decisionNotes: decisionNotes || null, overrideReason: overrideReason || null })
      .where(eq(returns.id, r.id))
      .run();
    writeAudit(tx, ctx, {
      actorId: input.actorId,
      action: "return.approved",
      entity: "returns",
      entityId: r.id,
      before: snap(r),
      after: { status: "APPROVED", resolution, refundPaisa: refund, includeDelivery: wantsDelivery, override: overrideReason || undefined, notes: decisionNotes || undefined, dispositions: rows.map(({ ri }) => input.dispositions[ri.id]!.disposition) },
    });
    return { code: r.code, resolution, refundPaisa: refund };
  });
}

/** REQUESTED / RECEIVED / INSPECTING → REJECTED. Nothing changes in stock; the customer gets the item back. */
export function rejectReturn(db: DB, id: string, input: { actorId: string; notes: string }, ctx: AuditContext, now: Date = new Date()) {
  const notes = clean(input.notes);
  if (notes.length < 3) throw new ReturnError("Write why the return is rejected — the customer may ask.");
  return withStockTransaction(db, (tx) => {
    const r = loadReturn(tx, id);
    if (r.status === "APPROVED" || r.status === "REJECTED" || r.status === "CLOSED") throw new ReturnError("This return has already been decided.");
    tx.update(returns).set({ status: "REJECTED", resolution: "REJECTED", decidedBy: input.actorId, decidedAt: now.toISOString(), decisionNotes: notes }).where(eq(returns.id, r.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "return.rejected", entity: "returns", entityId: r.id, before: snap(r), after: { status: "REJECTED", notes } });
    return r.code;
  });
}

// ---- Pay out, close ----------------------------------------------------------------------------------------

/**
 * APPROVED refund → CLOSED: the money has been paid back (cash, or a transfer with its reference).
 * The order’s payment status follows: PARTIALLY_REFUNDED, or REFUNDED once everything is given back.
 */
export function recordRefund(db: DB, id: string, input: { actorId: string; method: string; reference?: string }, ctx: AuditContext, now: Date = new Date()) {
  if (!(REFUND_METHODS as readonly string[]).includes(input.method)) throw new ReturnError("Choose how the money was paid back.");
  const method = input.method as RefundMethod;
  const reference = clean(input.reference, 40).toUpperCase();
  if (method !== "CASH" && !/^[A-Z0-9-]{4,40}$/.test(reference)) throw new ReturnError("Enter the transaction ID or reference of the payment (4–40 letters or numbers).");
  return withStockTransaction(db, (tx) => {
    const r = loadReturn(tx, id);
    if (r.status === "CLOSED" || r.refundedAt) throw new ReturnError("This refund is already recorded.");
    if (r.status !== "APPROVED" || r.resolution !== "REFUND") throw new ReturnError("Only an approved refund can be paid out.");
    if (reference) {
      const used = tx.select({ code: returns.code }).from(returns).where(and(eq(returns.refundReference, reference), ne(returns.id, r.id))).get();
      if (used) throw new ReturnError(`That reference is already recorded on ${used.code}.`);
    }
    const o = loadOrder(tx, r.orderId);
    tx.update(returns).set({ status: "CLOSED", closedAt: now.toISOString(), refundMethod: method, refundReference: reference || null, refundedAt: now.toISOString(), refundedBy: input.actorId }).where(eq(returns.id, r.id)).run();

    const paid = tx
      .select({ n: sql<number>`coalesce(sum(${returns.refundPaisa}), 0)` })
      .from(returns)
      .where(and(eq(returns.orderId, o.id), eq(returns.resolution, "REFUND"), sql`${returns.refundedAt} IS NOT NULL`))
      .get();
    const total = Number(paid?.n ?? 0);
    let orderPayment = o.paymentStatus;
    if ((REFUND_ORDER_PAYMENT as readonly string[]).includes(o.paymentStatus)) {
      orderPayment = total >= o.totalPaisa ? "REFUNDED" : "PARTIALLY_REFUNDED";
      tx.update(orders).set({ paymentStatus: orderPayment }).where(eq(orders.id, o.id)).run();
      if (orderPayment === "REFUNDED") tx.update(payments).set({ status: "REFUNDED" }).where(and(eq(payments.orderId, o.id), eq(payments.status, "SUCCEEDED"))).run();
    }
    writeAudit(tx, ctx, { actorId: input.actorId, action: "return.refunded", entity: "returns", entityId: r.id, before: snap(r), after: { status: "CLOSED", refundPaisa: r.refundPaisa, method, reference: reference || undefined, orderPayment } });
    return { code: r.code, orderCode: o.code, refundPaisa: r.refundPaisa, orderPayment };
  });
}

/** APPROVED (replacement / store credit) or REJECTED → CLOSED. */
export function closeReturn(db: DB, id: string, input: { actorId: string; note?: string }, ctx: AuditContext, now: Date = new Date()) {
  const note = clean(input.note, 300);
  return withStockTransaction(db, (tx) => {
    const r = loadReturn(tx, id);
    if (r.status === "CLOSED") throw new ReturnError("This return is already closed.");
    if (r.status === "APPROVED" && r.resolution === "REFUND") throw new ReturnError("Record the refund first — that closes the return.");
    if (r.status !== "APPROVED" && r.status !== "REJECTED") throw new ReturnError("Decide the return before closing it.");
    if (r.status === "APPROVED" && r.resolution === "STORE_CREDIT" && note.length < 3) throw new ReturnError("Write the store-credit note or voucher number you gave the customer.");
    tx.update(returns).set({ status: "CLOSED", closedAt: now.toISOString() }).where(eq(returns.id, r.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "return.closed", entity: "returns", entityId: r.id, before: snap(r), after: { status: "CLOSED", note: note || undefined } });
    return r.code;
  });
}

// ---- Lists and details ---------------------------------------------------------------------------------------

export type ReturnRow = {
  id: string;
  code: string;
  status: ReturnStatus;
  resolution: Return["resolution"];
  reason: ReturnReason;
  withinWarranty: boolean;
  createdAt: string;
  orderId: string;
  orderCode: string;
  channel: Order["channel"];
  customer: string;
  refundPaisa: number;
  refunded: boolean;
  units: number;
};

export function listReturns(db: DB, opts: { status?: string; open?: boolean; q?: string; limit?: number } = {}): ReturnRow[] {
  const q = opts.q?.trim();
  const status = (RETURN_STATUSES as readonly string[]).includes(opts.status ?? "") ? (opts.status as ReturnStatus) : undefined;
  return db
    .select({
      r: returns,
      orderCode: orders.code,
      channel: orders.channel,
      guestName: orders.guestName,
      guestPhone: orders.guestPhone,
      units: sql<number>`(select coalesce(sum(${returnItems.quantity}), 0) from ${returnItems} where ${returnItems.returnId} = ${returns.id})`,
    })
    .from(returns)
    .innerJoin(orders, eq(orders.id, returns.orderId))
    .where(
      and(
        status ? eq(returns.status, status) : undefined,
        opts.open ? inArray(returns.status, ["REQUESTED", "RECEIVED", "INSPECTING", "APPROVED"]) : undefined,
        q ? or(like(returns.code, `%${q.toUpperCase()}%`), like(orders.code, `%${q.toUpperCase()}%`), like(orders.guestPhone, `%${q.replace(/\D/g, "").replace(/^0/, "") || "~"}%`), like(orders.guestName, `%${q}%`)) : undefined,
      ),
    )
    .orderBy(desc(returns.createdAt), desc(returns.code))
    .limit(opts.limit ?? 200)
    .all()
    .map((x) => ({
      id: x.r.id,
      code: x.r.code,
      status: x.r.status,
      resolution: x.r.resolution,
      reason: x.r.reason,
      withinWarranty: x.r.withinWarranty,
      createdAt: x.r.createdAt,
      orderId: x.r.orderId,
      orderCode: x.orderCode,
      channel: x.channel,
      customer: x.guestName ?? x.guestPhone ?? "Walk-in",
      refundPaisa: x.r.refundPaisa,
      refunded: Boolean(x.r.refundedAt),
      units: Number(x.units),
    }));
}

export function returnCounts(db: DB): Record<ReturnStatus | "OPEN" | "REFUND_DUE", number> {
  const rows = db.select({ s: returns.status, n: sql<number>`count(*)` }).from(returns).groupBy(returns.status).all();
  const out = Object.fromEntries(RETURN_STATUSES.map((s) => [s, 0])) as Record<ReturnStatus, number>;
  for (const r of rows) out[r.s] = Number(r.n);
  const due = db.select({ n: sql<number>`count(*)` }).from(returns).where(and(eq(returns.status, "APPROVED"), eq(returns.resolution, "REFUND"))).get();
  return { ...out, OPEN: out.REQUESTED + out.RECEIVED + out.INSPECTING + out.APPROVED, REFUND_DUE: Number(due?.n ?? 0) };
}

export type ReturnDetails = {
  ret: Return;
  order: Order;
  orderCustomer: string;
  createdByName: string | null;
  decidedByName: string | null;
  refundedByName: string | null;
  inspectedByName: string | null;
  items: {
    id: string;
    quantity: number;
    condition: ItemCondition | null;
    disposition: Disposition | null;
    refundPaisa: number;
    vendorId: string | null;
    vendorName: string | null;
    suggestedVendor: { id: string; name: string } | null;
    description: string;
    sku: string;
    unitPricePaisa: number;
    unitCostPaisa: number;
    warrantyUntil: string | null;
    variantId: string;
    claim: { id: string; status: string; claimPaisa: number } | null;
  }[];
  maxRefundPaisa: number;
  maxRefundWithDeliveryPaisa: number;
  deliveryChargesPaisa: number;
  warrantyText: string;
  history: { at: string; action: string; by: string | null; after: unknown }[];
};

export function returnDetails(db: DB, id: string, now: Date = new Date()): ReturnDetails | null {
  const ret = db.select().from(returns).where(eq(returns.id, id)).get();
  if (!ret) return null;
  const order = loadOrder(db, ret.orderId);
  const name = (uid: string | null) => (uid ? (db.select({ n: user.name }).from(user).where(eq(user.id, uid)).get()?.n ?? null) : null);
  const rows = items(db, ret.id);
  const claims = db.select().from(vendorClaims).where(inArray(vendorClaims.returnItemId, rows.map((x) => x.ri.id).concat("-"))).all();
  const vendorNames = new Map(db.select({ id: vendors.id, name: vendors.name }).from(vendors).all().map((v) => [v.id, v.name]));
  const history = db
    .select({ at: adminAuditLog.createdAt, action: adminAuditLog.action, by: user.name, after: adminAuditLog.after })
    .from(adminAuditLog)
    .leftJoin(user, eq(user.id, adminAuditLog.actorId))
    .where(and(eq(adminAuditLog.entity, "returns"), eq(adminAuditLog.entityId, ret.id)))
    .orderBy(asc(adminAuditLog.createdAt), asc(sql`${adminAuditLog}.rowid`))
    .all();
  const itemSum = rows.reduce((n, { ri }) => n + ri.refundPaisa, 0);
  const verdict = warrantyVerdict(ret.reason as ReturnReason, rows.map(({ oi }) => oi), purchasedAt(db, order), new Date(parseTimestamp(ret.createdAt) || now.getTime()));
  return {
    ret,
    order,
    orderCustomer: order.guestName ?? order.guestPhone ?? "Walk-in customer",
    createdByName: name(ret.createdBy),
    decidedByName: name(ret.decidedBy),
    refundedByName: name(ret.refundedBy),
    inspectedByName: name(ret.inspectedBy),
    items: rows.map(({ ri, oi }) => {
      const claim = claims.find((c) => c.returnItemId === ri.id);
      return {
        id: ri.id,
        quantity: ri.quantity,
        condition: ri.condition,
        disposition: ri.disposition,
        refundPaisa: ri.refundPaisa,
        vendorId: ri.vendorId,
        vendorName: ri.vendorId ? (vendorNames.get(ri.vendorId) ?? null) : null,
        suggestedVendor: lastSupplier(db, oi.variantId),
        description: `${oi.productSnapshot.brand} ${oi.productSnapshot.model} — ${oi.productSnapshot.displayType}, ${oi.productSnapshot.qualityGrade}, ${oi.productSnapshot.color}`,
        sku: oi.productSnapshot.sku,
        unitPricePaisa: oi.unitPricePaisa,
        unitCostPaisa: oi.unitCostPaisa,
        warrantyUntil: oi.warrantyUntil,
        variantId: oi.variantId,
        claim: claim ? { id: claim.id, status: claim.status, claimPaisa: claim.claimPaisa } : null,
      };
    }),
    maxRefundPaisa: itemSum,
    maxRefundWithDeliveryPaisa: maxRefund(db, ret.id, true),
    deliveryChargesPaisa: order.shippingFeePaisa + order.codFeePaisa,
    warrantyText: verdict.text,
    history,
  };
}

export function returnsForOrder(db: DB, orderId: string) {
  return db
    .select({ id: returns.id, code: returns.code, status: returns.status, resolution: returns.resolution, reason: returns.reason, refundPaisa: returns.refundPaisa })
    .from(returns)
    .where(eq(returns.orderId, orderId))
    .orderBy(desc(returns.createdAt), desc(returns.code))
    .all();
}

// ---- Finding an order, warranty lookup ---------------------------------------------------------------------------------

export type OrderMatch = { id: string; code: string; channel: Order["channel"]; placedAt: string; customer: string; phone: string | null; totalPaisa: number; blocked: string | null; units: number };

/** Order code (CA-ORD-…, CA-POS-…) or the customer’s mobile number. */
export function findOrders(db: DB, query: string, limit = 10): OrderMatch[] {
  const q = query.trim();
  if (q.length < 3) return [];
  const digits = q.replace(/\D/g, "").replace(/^(92|0)/, "");
  const rows = db
    .select({ o: orders, units: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})` })
    .from(orders)
    .where(or(like(orders.code, `%${q.toUpperCase()}%`), digits.length >= 6 ? like(orders.guestPhone, `%${digits}`) : undefined))
    .orderBy(desc(orders.placedAt))
    .limit(limit)
    .all();
  return rows.map(({ o, units }) => ({ id: o.id, code: o.code, channel: o.channel, placedAt: o.placedAt, customer: o.guestName ?? "—", phone: o.guestPhone, totalPaisa: o.totalPaisa, blocked: returnBlockedReason(o), units: Number(units) }));
}

export type WarrantyRow = { order: OrderMatch; boughtAt: string; lines: (ReturnableLine & { status: "ACTIVE" | "EXPIRED" | "NONE" | "NOT_STARTED"; daysLeft: number | null })[] };

/** Warranty status of every item on the orders matching a code or phone number. */
export function warrantyLookup(db: DB, query: string, now: Date = new Date()): WarrantyRow[] {
  return findOrders(db, query).map((m) => {
    const info = orderForReturn(db, m.id, now);
    return {
      order: m,
      boughtAt: info.purchasedAt,
      lines: info.lines.map((l) => {
        const notStarted = m.channel === "ONLINE" && info.order.fulfillmentStatus !== "DELIVERED" && !l.warrantyUntil;
        const left = l.warrantyUntil ? Math.ceil((parseTimestamp(l.warrantyUntil) - now.getTime()) / DAY) : null;
        return { ...l, status: notStarted ? "NOT_STARTED" : !l.warrantyUntil ? "NONE" : l.warrantyActive ? "ACTIVE" : "EXPIRED", daysLeft: left };
      }),
    };
  });
}

/** Cash refunds paid between two timestamps (the day’s drawer), for the End of day page. */
export function cashRefundsPaid(db: DB, bounds: { start: string; end: string }) {
  // refunded_at is an ISO time; the day bounds come in SQLite's "YYYY-MM-DD HH:MM:SS" form
  const iso = (t: string) => `${t.replace(" ", "T")}.000Z`;
  const [start, end] = [iso(bounds.start), iso(bounds.end)];
  const r = db
    .select({ n: sql<number>`count(*)`, p: sql<number>`coalesce(sum(${returns.refundPaisa}), 0)` })
    .from(returns)
    .where(and(eq(returns.refundMethod, "CASH"), sql`${returns.refundedAt} >= ${start} AND ${returns.refundedAt} < ${end}`))
    .get();
  return { count: Number(r?.n ?? 0), paisa: Number(r?.p ?? 0) };
}
