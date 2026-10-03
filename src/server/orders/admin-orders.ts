import { and, desc, eq, inArray, like, ne, or, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { orders, payments, shipments } from "@/db/schema";
import { COURIERS, type Courier } from "@/db/schema/logistics";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { withStockTransaction } from "@/server/inventory/stock";
import { normalisePkMobile } from "@/lib/phone";
import { MANUAL_METHODS, type CheckoutMethod } from "@/server/settings/store-settings";
import { cancelOrderInTx } from "./checkout";

/**
 * Orders admin, Milestone 10 Phase A (owner request v1.11, SPECIFICATION §23).
 * OWNER and MANAGER only. Every action:
 *   - re-reads the order inside one BEGIN IMMEDIATE transaction and checks its state, so a double
 *     click or two staff at once can't apply it twice (the second gets OrderActionError);
 *   - writes admin_audit_log with before/after;
 *   - changes stock only through the stock engine (cancel → ORDER_CANCEL_RESTOCK).
 * Emails to the customer are sent by the Server Action after the transaction commits.
 */

export class OrderActionError extends Error {}
type Order = typeof orders.$inferSelect;
const isManual = (o: Order) => MANUAL_METHODS.includes(o.paymentMethod as CheckoutMethod);
const TID = /^[A-Za-z0-9-]{6,30}$/;
const snap = (o: Order) => ({
  paymentStatus: o.paymentStatus,
  fulfillmentStatus: o.fulfillmentStatus,
});

function load(tx: Tx, orderId: string): Order {
  const o = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!o || o.channel !== "ONLINE") throw new OrderActionError("Order not found.");
  return o;
}

/**
 * The customer sent a payment screenshot by WhatsApp / call / email (or typed a TID).
 * UNPAID → PENDING_VERIFICATION, which also stops the 48-hour expiry (it only cancels UNPAID orders).
 */
export function markProofReceived(db: DB, orderId: string, input: { reference?: string; via: string; actorId: string }, ctx: AuditContext) {
  const ref = input.reference?.trim().toUpperCase() || null;
  if (ref && !TID.test(ref)) throw new OrderActionError("Reference / transaction ID: 6–30 letters or numbers.");
  const via = ["WHATSAPP", "CALL", "EMAIL", "OTHER"].includes(input.via) ? input.via : "OTHER";
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (!isManual(o)) throw new OrderActionError("This order is cash on delivery — there’s no payment proof to record.");
    if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is cancelled.");
    if (o.paymentStatus !== "UNPAID") throw new OrderActionError("Proof is already recorded for this order.");
    if (ref) {
      const used = tx
        .select({ id: payments.id })
        .from(payments)
        .where(and(eq(payments.provider, "MANUAL"), eq(payments.manualReference, ref), ne(payments.orderId, o.id)))
        .get();
      if (used) throw new OrderActionError("That transaction ID is already recorded on another order.");
      tx.update(payments).set({ manualReference: ref, status: "PENDING" }).where(eq(payments.orderId, o.id)).run();
    } else {
      tx.update(payments).set({ status: "PENDING" }).where(eq(payments.orderId, o.id)).run();
    }
    tx.update(orders).set({ paymentStatus: "PENDING_VERIFICATION" }).where(eq(orders.id, o.id)).run();
    writeAudit(tx, ctx, {
      actorId: input.actorId,
      action: "order.proof_received",
      entity: "orders",
      entityId: o.id,
      before: snap(o),
      after: { paymentStatus: "PENDING_VERIFICATION", via, reference: ref },
    });
    return o.code;
  });
}

/** Staff checked the bank / wallet statement: the money is there. → PAID, order CONFIRMED. */
export function confirmPayment(db: DB, orderId: string, input: { reference?: string; actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  const ref = input.reference?.trim().toUpperCase() || null;
  if (ref && !TID.test(ref)) throw new OrderActionError("Reference / transaction ID: 6–30 letters or numbers.");
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (!isManual(o)) throw new OrderActionError("Cash-on-delivery orders are paid to the courier.");
    if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is cancelled — it can’t be marked paid.");
    if (o.paymentStatus === "PAID") throw new OrderActionError("This payment is already confirmed.");
    if (o.paymentStatus !== "UNPAID" && o.paymentStatus !== "PENDING_VERIFICATION") throw new OrderActionError("This order isn’t waiting for a payment.");
    const pay = tx.select().from(payments).where(eq(payments.orderId, o.id)).get();
    const finalRef = ref ?? pay?.manualReference ?? null;
    if (finalRef) {
      const used = tx
        .select({ id: payments.id })
        .from(payments)
        .where(and(eq(payments.provider, "MANUAL"), eq(payments.manualReference, finalRef), ne(payments.orderId, o.id)))
        .get();
      if (used) throw new OrderActionError("That transaction ID is already recorded on another order.");
    }
    tx.update(payments)
      .set({
        status: "SUCCEEDED",
        manualReference: finalRef,
        verifiedBy: input.actorId,
        verifiedAt: now.toISOString(),
      })
      .where(eq(payments.orderId, o.id))
      .run();
    tx.update(orders)
      .set({
        paymentStatus: "PAID",
        paidAt: now.toISOString(),
        fulfillmentStatus: o.fulfillmentStatus === "NEW" ? "CONFIRMED" : o.fulfillmentStatus,
      })
      .where(eq(orders.id, o.id))
      .run();
    writeAudit(tx, ctx, {
      actorId: input.actorId,
      action: "order.payment_confirmed",
      entity: "orders",
      entityId: o.id,
      before: snap(o),
      after: {
        paymentStatus: "PAID",
        fulfillmentStatus: "CONFIRMED",
        reference: finalRef,
        amountPaisa: o.totalPaisa,
      },
    });
    return o.code;
  });
}

/** Handed to the courier: shipment row with courier + CN, order BOOKED. Needs payment first (except COD). */
export function dispatchOrder(db: DB, orderId: string, input: { courier: string; cn: string; actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  const courier = input.courier as Courier;
  if (!(COURIERS as readonly string[]).includes(courier)) throw new OrderActionError("Choose the courier.");
  const cn = input.cn.trim().toUpperCase();
  if (courier !== "SELF" && !/^[A-Z0-9-]{4,30}$/.test(cn)) throw new OrderActionError("Tracking (CN) number: 4–30 letters or numbers from the courier receipt.");
  if (courier === "SELF" && cn && !/^[A-Z0-9-]{1,30}$/.test(cn)) throw new OrderActionError("Reference: letters and numbers only.");
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is cancelled.");
    if (!["CONFIRMED", "PACKED"].includes(o.fulfillmentStatus)) {
      throw new OrderActionError(o.fulfillmentStatus === "NEW" ? "Confirm the payment before dispatching." : "This order is already dispatched.");
    }
    const cod = o.paymentMethod === "COD";
    if (!cod && o.paymentStatus !== "PAID") throw new OrderActionError("Confirm the payment before dispatching.");
    tx.insert(shipments)
      .values({
        orderId: o.id,
        courier,
        cnNumber: cn || null,
        codAmountPaisa: cod ? o.totalPaisa : 0,
        status: "BOOKED",
        bookedAt: now.toISOString(),
        createdBy: input.actorId,
      })
      .run();
    tx.update(orders).set({ fulfillmentStatus: "BOOKED" }).where(eq(orders.id, o.id)).run();
    writeAudit(tx, ctx, {
      actorId: input.actorId,
      action: "order.dispatched",
      entity: "orders",
      entityId: o.id,
      before: snap(o),
      after: { fulfillmentStatus: "BOOKED", courier, cn: cn || null },
    });
    return o.code;
  });
}

/** Cancel before dispatch: stock back through the engine, coupon back; a paid order is marked for refund. */
export function cancelOrder(db: DB, orderId: string, input: { reason: string; refundConfirmed?: boolean; actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  const reason = input.reason
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 200);
  if (reason.length < 3) throw new OrderActionError("Write why the order is cancelled (the customer sees this).");
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is already cancelled.");
    if (!["NEW", "CONFIRMED", "PACKED"].includes(o.fulfillmentStatus)) throw new OrderActionError("This order has already been handed to the courier — handle it as a return instead.");
    const refundDue = o.paymentStatus === "PAID";
    if (refundDue && !input.refundConfirmed) throw new OrderActionError("This order is paid. Tick “I will refund the customer” to cancel it.");
    cancelOrderInTx(tx, o, {
      reason,
      operatorId: input.actorId,
      now,
      refundDue,
    });
    writeAudit(tx, ctx, {
      actorId: input.actorId,
      action: "order.cancelled",
      entity: "orders",
      entityId: o.id,
      before: snap(o),
      after: { fulfillmentStatus: "CANCELLED", reason, refundDue },
    });
    return { code: o.code, refundDue };
  });
}

// ---- Lists --------------------------------------------------------------------------------

export const ORDER_FILTERS = {
  action: "Needs action",
  payment: "Waiting for payment",
  dispatch: "Ready to dispatch",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
  all: "All",
} as const;
export type OrderFilter = keyof typeof ORDER_FILTERS;

function filterWhere(f: OrderFilter) {
  const manual = inArray(orders.paymentMethod, [...MANUAL_METHODS]);
  switch (f) {
    case "payment":
      return and(manual, inArray(orders.paymentStatus, ["UNPAID", "PENDING_VERIFICATION"]), ne(orders.fulfillmentStatus, "CANCELLED"));
    case "dispatch":
      return and(inArray(orders.fulfillmentStatus, ["CONFIRMED", "PACKED"]), or(eq(orders.paymentMethod, "COD"), eq(orders.paymentStatus, "PAID")));
    case "action":
      return or(
        and(manual, eq(orders.paymentStatus, "PENDING_VERIFICATION"), ne(orders.fulfillmentStatus, "CANCELLED")),
        and(inArray(orders.fulfillmentStatus, ["CONFIRMED", "PACKED"]), or(eq(orders.paymentMethod, "COD"), eq(orders.paymentStatus, "PAID"))),
      );
    case "dispatched":
      return inArray(orders.fulfillmentStatus, ["BOOKED", "IN_TRANSIT", "DELIVERED", "RETURNED_TO_ORIGIN"]);
    case "cancelled":
      return eq(orders.fulfillmentStatus, "CANCELLED");
    default:
      return undefined;
  }
}

export function listOrders(db: DB, opts: { filter: OrderFilter; q?: string; limit?: number }) {
  const q = opts.q?.trim().slice(0, 40) ?? "";
  const phone = q ? normalisePkMobile(q) : null;
  const search = q ? or(like(orders.code, `%${q.toUpperCase().replace(/[%_]/g, "")}%`), phone ? eq(orders.guestPhone, phone) : undefined, like(orders.guestName, `%${q.replace(/[%_]/g, "")}%`)) : undefined;
  return db
    .select({
      id: orders.id,
      code: orders.code,
      name: orders.guestName,
      phone: orders.guestPhone,
      total: orders.totalPaisa,
      method: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(and(eq(orders.channel, "ONLINE"), filterWhere(opts.filter), search))
    .orderBy(desc(orders.placedAt), desc(orders.code))
    .limit(opts.limit ?? 200)
    .all();
}

export function orderCounts(db: DB): Record<OrderFilter, number> {
  const out = {} as Record<OrderFilter, number>;
  for (const f of Object.keys(ORDER_FILTERS) as OrderFilter[]) {
    out[f] =
      db
        .select({ n: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.channel, "ONLINE"), filterWhere(f)))
        .get()?.n ?? 0;
  }
  return out;
}
