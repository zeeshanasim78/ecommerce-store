import { createHash } from "node:crypto";
import { and, eq, gte, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { SYSTEM_USER_ID, orders, payments, webhookEvents } from "@/db/schema";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { withStockTransaction } from "@/server/inventory/stock";
import { cancelOrderInTx } from "@/server/orders/checkout";
import { siteUrl } from "@/server/site-url";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import type { GatewayDeps } from "./index";
import { GatewayError, SignatureError, type GatewayEvent, type GatewayPaymentState, type GatewayStatus } from "./types";

/**
 * Online payments — SPECIFICATION §8 and §31 (Milestone 14).
 *
 * The one rule: an order becomes PAID only here, from (a) a callback whose signature has been
 * verified on the raw body or (b) a direct server-to-server status query to the gateway. The
 * customer's browser coming back from the gateway is never proof. Every path funnels into
 * applyGatewayState(), which is idempotent: the same result applied twice changes nothing, and a
 * result whose amount/currency differs from the stored payment is never applied.
 *
 * Network calls (the gateway) happen before or after a database transaction, never inside one
 * (spec §6.2) — a constitution test checks this file.
 */

const PROVIDER = "AGGREGATOR" as const;
const SYSTEM_CTX: AuditContext = { ip: "system", userAgent: "payment-gateway" };
const sqliteTime = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export class OnlinePayError extends Error {}

export type OnlineOutcome =
  | { kind: "PAID"; orderId: string; code: string }
  | { kind: "ALREADY_PAID"; orderId: string; code: string }
  | { kind: "LATE_PAYMENT"; orderId: string; code: string }
  | { kind: "MISMATCH"; orderId: string; code: string; why: string }
  | { kind: "FAILED_RECORDED"; orderId: string; code: string }
  | { kind: "REFUND_RECORDED"; orderId: string; code: string }
  | { kind: "PENDING"; orderId: string; code: string }
  | { kind: "NO_CHANGE"; orderId: string; code: string }
  | { kind: "UNKNOWN_PAYMENT" };

type Source = "WEBHOOK" | "QUERY";
type State = Pick<GatewayPaymentState, "reference" | "providerRef" | "status" | "amountPaisa" | "currency">;

/**
 * Applies what the gateway says about one payment, inside an open transaction. Idempotent.
 * See SPECIFICATION §31.4 for the rules this implements.
 */
export function applyGatewayState(tx: Tx, st: State, opts: { source: Source; rawHash: string | null; now: Date; audit?: AuditContext }): OnlineOutcome {
  const ctx = opts.audit ?? SYSTEM_CTX;
  const pay = tx.select().from(payments).where(and(eq(payments.id, st.reference), eq(payments.provider, PROVIDER))).get();
  if (!pay) return { kind: "UNKNOWN_PAYMENT" };
  const order = tx.select().from(orders).where(eq(orders.id, pay.orderId)).get();
  if (!order) return { kind: "UNKNOWN_PAYMENT" };
  const id = { orderId: order.id, code: order.code };
  const nowIso = opts.now.toISOString();
  if (opts.source === "QUERY") tx.update(payments).set({ checkedAt: nowIso }).where(eq(payments.id, pay.id)).run();

  const audit = (action: string, after: Record<string, unknown>) =>
    writeAudit(tx, ctx, { actorId: SYSTEM_USER_ID, action, entity: "orders", entityId: order.id, before: { paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus }, after: { source: opts.source, gatewayRef: st.providerRef, ...after } });

  const money = (): string | null => {
    if (st.amountPaisa !== pay.amountPaisa) return `Gateway says Rs ${(st.amountPaisa / 100).toLocaleString("en-PK")} but the order is Rs ${(pay.amountPaisa / 100).toLocaleString("en-PK")}.`;
    if (st.currency !== pay.currency) return `Gateway says currency ${st.currency || "(none)"} but the order is in ${pay.currency}.`;
    return null;
  };

  if (st.status === "SUCCEEDED") {
    const bad = money();
    if (bad) {
      audit("payment.amount_mismatch", { reason: bad, gatewayAmountPaisa: st.amountPaisa, gatewayCurrency: st.currency, orderAmountPaisa: pay.amountPaisa });
      return { kind: "MISMATCH", ...id, why: bad };
    }
    if (pay.verifiedAt && (pay.status === "SUCCEEDED" || pay.status === "REFUNDED")) return { kind: "ALREADY_PAID", ...id };
    if (st.providerRef && st.providerRef !== pay.providerRef) {
      const other = tx.select({ id: payments.id }).from(payments).where(and(eq(payments.provider, PROVIDER), eq(payments.providerRef, st.providerRef), ne(payments.id, pay.id))).get();
      if (other) {
        const why = "The gateway’s payment number is already recorded on another order.";
        audit("payment.amount_mismatch", { reason: why });
        return { kind: "MISMATCH", ...id, why };
      }
    }
    tx.update(payments)
      .set({ status: "SUCCEEDED", providerRef: st.providerRef ?? pay.providerRef, verifiedAt: nowIso, rawResponseHash: opts.rawHash ?? pay.rawResponseHash, failureReason: null })
      .where(eq(payments.id, pay.id))
      .run();
    if (order.fulfillmentStatus === "CANCELLED") {
      // The customer paid after the shop gave up waiting: keep the money on record, flag it for a refund.
      tx.update(orders).set({ paymentStatus: "PAID", paidAt: nowIso }).where(eq(orders.id, order.id)).run();
      audit("payment.late_after_cancel", { amountPaisa: pay.amountPaisa, note: "Order was already cancelled — refund due" });
      return { kind: "LATE_PAYMENT", ...id };
    }
    if (order.paymentStatus === "PAID") return { kind: "ALREADY_PAID", ...id };
    tx.update(orders)
      .set({ paymentStatus: "PAID", paidAt: nowIso, fulfillmentStatus: order.fulfillmentStatus === "NEW" ? "CONFIRMED" : order.fulfillmentStatus })
      .where(eq(orders.id, order.id))
      .run();
    audit("payment.gateway_paid", { amountPaisa: pay.amountPaisa });
    return { kind: "PAID", ...id };
  }

  if (st.status === "FAILED") {
    if (pay.verifiedAt || pay.status === "SUCCEEDED" || pay.status === "REFUNDED") return { kind: "NO_CHANGE", ...id };
    if (order.fulfillmentStatus === "CANCELLED" || pay.status === "FAILED") return { kind: "NO_CHANGE", ...id };
    tx.update(payments).set({ status: "FAILED", failureReason: "The payment was not completed at the payment page." }).where(eq(payments.id, pay.id)).run();
    audit("payment.gateway_failed", {});
    return { kind: "FAILED_RECORDED", ...id };
  }

  if (st.status === "PENDING") {
    if (pay.status === "INITIATED") {
      tx.update(payments).set({ status: "PENDING" }).where(eq(payments.id, pay.id)).run();
      return { kind: "PENDING", ...id };
    }
    return { kind: "NO_CHANGE", ...id };
  }

  // REFUNDED (the shop refunded from the gateway's own dashboard)
  const bad = money();
  if (bad) {
    audit("payment.amount_mismatch", { reason: bad });
    return { kind: "MISMATCH", ...id, why: bad };
  }
  if (!pay.verifiedAt || pay.refundedPaisa >= pay.amountPaisa) return { kind: "NO_CHANGE", ...id };
  tx.update(payments).set({ status: "REFUNDED", refundedPaisa: pay.amountPaisa }).where(eq(payments.id, pay.id)).run();
  tx.update(orders).set({ paymentStatus: "REFUNDED" }).where(eq(orders.id, order.id)).run();
  audit("payment.refunded_at_gateway", { amountPaisa: pay.amountPaisa });
  return { kind: "REFUND_RECORDED", ...id };
}

// ---- Callback (webhook) ----------------------------------------------------------------------

export type WebhookResult =
  | { http: 400; rejected: true }
  | { http: 200 | 422; duplicate: boolean; outcome: OnlineOutcome | null };

/**
 * A callback from the gateway, on its RAW body. Order of work (SPECIFICATION §31.4):
 * verify signature → record the event id (a repeat is acknowledged and changes nothing) → apply.
 * The event row and the order change commit together, so a crash can't leave an event recorded
 * but not applied (the gateway's retry then applies it).
 */
export function processWebhook(db: DB, gateway: { verifyCallback: (i: { rawBody: string; headers: { get(name: string): string | null }; now: Date }) => GatewayEvent }, req: { rawBody: string; headers: { get(name: string): string | null }; audit: AuditContext }, now: Date = new Date()): WebhookResult {
  let event: GatewayEvent;
  try {
    event = gateway.verifyCallback({ rawBody: req.rawBody, headers: req.headers, now });
  } catch (e) {
    if (e instanceof SignatureError) return { http: 400, rejected: true };
    throw e;
  }
  const hash = sha256(req.rawBody);
  return withStockTransaction(db, (tx): WebhookResult => {
    const row = tx
      .insert(webhookEvents)
      .values({ provider: PROVIDER, eventId: event.eventId, payloadSha256: hash, receivedAt: now.toISOString(), paymentId: event.reference })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id })
      .get();
    if (!row) return { http: 200, duplicate: true, outcome: null }; // seen before: acknowledged, nothing re-applied
    const outcome = applyGatewayState(tx, event, { source: "WEBHOOK", rawHash: hash, now, audit: req.audit });
    const status = outcome.kind === "MISMATCH" ? "FAILED" : outcome.kind === "UNKNOWN_PAYMENT" || outcome.kind === "NO_CHANGE" ? "IGNORED" : "PROCESSED";
    tx.update(webhookEvents)
      .set({ status, processedAt: now.toISOString(), detail: outcome.kind === "MISMATCH" ? `MISMATCH: ${outcome.why}`.slice(0, 300) : outcome.kind })
      .where(eq(webhookEvents.id, row.id))
      .run();
    return { http: outcome.kind === "MISMATCH" ? 422 : 200, duplicate: false, outcome };
  });
}

/** A callback with a bad signature: counted in the audit log (rate-limited by the caller), nothing else. */
export function recordRejectedCallback(db: DB, ctx: AuditContext, reason: string) {
  db.transaction((tx) => writeAudit(tx, ctx, { actorId: SYSTEM_USER_ID, action: "payment.callback_rejected", entity: "payments", after: { reason: reason.slice(0, 100) } }), { behavior: "immediate" });
}

// ---- Starting a payment ----------------------------------------------------------------------

/** Order + payment rows for an online order, or null. */
function loadOnline(db: DB | Tx, orderId: string) {
  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order || order.channel !== "ONLINE" || order.paymentMethod !== "AGGREGATOR") return null;
  const pay = db.select().from(payments).where(and(eq(payments.orderId, orderId), eq(payments.provider, PROVIDER))).get();
  return pay ? { order, pay } : null;
}

export function onlinePaymentExpired(order: { placedAt: string }, ttlMinutes: number, now: Date): boolean {
  const placed = Date.parse(`${order.placedAt.replace(" ", "T")}${order.placedAt.includes("Z") ? "" : "Z"}`);
  return Number.isFinite(placed) && now.getTime() - placed > ttlMinutes * 60_000;
}

/**
 * Creates (or re-creates, after a failed or abandoned try) the payment at the gateway and returns
 * the page to send the customer to. The order must still be waiting for payment and inside the wait.
 */
export async function startOnlinePayment(db: DB, deps: GatewayDeps, orderId: string, env: Record<string, string | undefined> = process.env, now: Date = new Date()): Promise<{ redirectUrl: string }> {
  const row = loadOnline(db, orderId);
  if (!row) throw new OnlinePayError("This order isn’t an online payment.");
  const { order, pay } = row;
  if (order.fulfillmentStatus === "CANCELLED") throw new OnlinePayError("This order was cancelled because payment didn’t arrive in time. Please place a new order.");
  if (order.paymentStatus !== "UNPAID" || pay.status === "SUCCEEDED") throw new OnlinePayError("This order is already paid.");
  const ttl = getCheckoutSettings(db, env).unpaidTtlMinutes;
  if (onlinePaymentExpired(order, ttl, now)) throw new OnlinePayError("The time to pay this order has run out. Please place a new order.");
  if (!deps.isConfigured()) throw new OnlinePayError("Online payment isn’t available right now. Please try again later or call us.");

  const base = siteUrl(env);
  let created: { providerRef: string; redirectUrl: string };
  try {
    created = await deps.gateway().createPayment({
      reference: pay.id,
      orderCode: order.code,
      amountPaisa: pay.amountPaisa,
      currency: "PKR",
      customer: { name: order.guestName ?? "Customer", phone: order.guestPhone ?? "", email: order.guestEmail },
      returnUrl: `${base}/checkout/return?order=${encodeURIComponent(order.code)}`,
      cancelUrl: `${base}/checkout/return?order=${encodeURIComponent(order.code)}&cancelled=1`,
      callbackUrl: `${base}/api/webhooks/payments`,
    });
  } catch (e) {
    if (e instanceof GatewayError) {
      console.error("[gateway] could not start payment:", e.message);
      throw new OnlinePayError("We couldn’t open the payment page just now. Your order is saved — use “Pay online now” on your order page to try again.");
    }
    throw e;
  }
  withStockTransaction(db, (tx) => {
    const again = loadOnline(tx, orderId);
    if (!again || again.order.fulfillmentStatus === "CANCELLED" || again.order.paymentStatus !== "UNPAID" || again.pay.status === "SUCCEEDED") throw new OnlinePayError("This order is no longer waiting for payment.");
    tx.update(payments).set({ providerRef: created.providerRef, status: "PENDING", failureReason: null, checkedAt: null }).where(eq(payments.id, pay.id)).run();
  });
  return { redirectUrl: created.redirectUrl };
}

// ---- Asking the gateway ------------------------------------------------------------------------

export type ReconcileResult = { kind: "CHECKED"; outcome: OnlineOutcome } | { kind: "NOT_STARTED" } | { kind: "ERROR"; message: string } | { kind: "SKIPPED" };

/** Asks the gateway about one payment and applies the answer. A gateway error changes nothing. */
export async function reconcilePayment(db: DB, deps: GatewayDeps, paymentId: string, now: Date = new Date(), opts: { minAgeSeconds?: number } = {}): Promise<ReconcileResult> {
  const pay = db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.provider, PROVIDER))).get();
  if (!pay || !pay.providerRef) return { kind: "NOT_STARTED" };
  if (opts.minAgeSeconds && pay.checkedAt && now.getTime() - Date.parse(pay.checkedAt) < opts.minAgeSeconds * 1000) return { kind: "SKIPPED" };
  if (!deps.isConfigured()) return { kind: "ERROR", message: "Online payment isn’t set up." };
  let state: GatewayPaymentState;
  try {
    state = await deps.gateway().queryStatus({ reference: pay.id, providerRef: pay.providerRef });
  } catch (e) {
    if (e instanceof GatewayError) return { kind: "ERROR", message: e.message };
    throw e;
  }
  const outcome = withStockTransaction(db, (tx) => applyGatewayState(tx, state, { source: "QUERY", rawHash: sha256(JSON.stringify(state)), now }));
  return { kind: "CHECKED", outcome };
}

export type ReconcileSummary = { checked: number; paid: string[]; latePayments: string[]; mismatches: string[]; failed: string[]; errors: string[]; cancelled: string[] };

/**
 * The reconciliation job (every ~10 minutes): ask the gateway about every payment that isn't settled,
 * so a callback that never arrived (server down, tunnel hiccup) can't leave a paid customer waiting.
 * Unfinished payments are checked for 7 days; ones that failed or whose order was cancelled only for 24 hours.
 */
export async function reconcilePending(db: DB, deps: GatewayDeps, now: Date = new Date(), opts: { minAgeSeconds?: number; limit?: number } = {}): Promise<ReconcileSummary> {
  const out: ReconcileSummary = { checked: 0, paid: [], latePayments: [], mismatches: [], failed: [], errors: [], cancelled: [] };
  if (!deps.isConfigured()) return out;
  const weekAgo = sqliteTime(new Date(now.getTime() - 7 * 86_400_000));
  const dayAgo = sqliteTime(new Date(now.getTime() - 86_400_000));
  const staleBefore = new Date(now.getTime() - (opts.minAgeSeconds ?? 120) * 1000).toISOString();
  const due = db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.provider, PROVIDER),
        isNotNull(payments.providerRef),
        isNull(payments.verifiedAt),
        or(and(inArray(payments.status, ["INITIATED", "PENDING"]), gte(payments.createdAt, weekAgo)), gte(payments.createdAt, dayAgo)),
        or(isNull(payments.checkedAt), lt(payments.checkedAt, staleBefore)),
      ),
    )
    .limit(opts.limit ?? 50)
    .all();
  for (const { id } of due) {
    const r = await reconcilePayment(db, deps, id, now);
    if (r.kind === "ERROR") {
      out.errors.push(r.message);
      continue;
    }
    if (r.kind !== "CHECKED") continue;
    out.checked++;
    const o = r.outcome;
    if (o.kind === "PAID") out.paid.push(o.code);
    else if (o.kind === "LATE_PAYMENT") out.latePayments.push(o.code);
    else if (o.kind === "MISMATCH") out.mismatches.push(o.code);
    else if (o.kind === "FAILED_RECORDED") out.failed.push(o.code);
  }
  return out;
}

/**
 * Online orders still unpaid after the wait (default 30 minutes, setting unpaid_order_ttl_minutes) are
 * cancelled and their stock goes back on sale — but only after the gateway has been asked once more,
 * so an order whose callback was lost is paid, not cancelled. If the gateway can't be reached, nothing is cancelled.
 */
export async function expireOnlineOrders(db: DB, deps: GatewayDeps, now: Date = new Date()): Promise<string[]> {
  const ttl = getCheckoutSettings(db).unpaidTtlMinutes;
  const cutoff = sqliteTime(new Date(now.getTime() - ttl * 60_000));
  const due = db
    .select({ id: orders.id, payId: payments.id, ref: payments.providerRef })
    .from(orders)
    .innerJoin(payments, and(eq(payments.orderId, orders.id), eq(payments.provider, PROVIDER)))
    .where(and(eq(orders.channel, "ONLINE"), eq(orders.paymentMethod, "AGGREGATOR"), eq(orders.paymentStatus, "UNPAID"), ne(orders.fulfillmentStatus, "CANCELLED"), lt(orders.placedAt, cutoff)))
    .all();
  const cancelled: string[] = [];
  for (const d of due) {
    if (d.ref) {
      const r = await reconcilePayment(db, deps, d.payId, now);
      if (r.kind === "ERROR") continue; // can't be sure it wasn't paid: leave it for the next run
    }
    withStockTransaction(db, (tx) => {
      const order = tx.select().from(orders).where(eq(orders.id, d.id)).get();
      if (!order || order.paymentStatus !== "UNPAID" || order.fulfillmentStatus === "CANCELLED") return; // paid or cancelled meanwhile
      cancelOrderInTx(tx, order, { reason: "Online payment not completed in time", operatorId: SYSTEM_USER_ID, now });
      writeAudit(tx, SYSTEM_CTX, { actorId: SYSTEM_USER_ID, action: "order.expired_unpaid", entity: "orders", entityId: order.id, before: { paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus }, after: { fulfillmentStatus: "CANCELLED", reason: "Online payment not completed in time" } });
      cancelled.push(order.code);
    });
  }
  return cancelled;
}

// ---- Refund through the gateway ----------------------------------------------------------------

/** Why this order can (or can't) be refunded through the gateway; null = it can. */
export function gatewayRefundBlocker(order: typeof orders.$inferSelect, pay: typeof payments.$inferSelect | null | undefined): string | null {
  if (!pay || pay.provider !== PROVIDER || order.paymentMethod !== "AGGREGATOR") return "This order wasn’t paid through the payment gateway.";
  if (!pay.verifiedAt || !pay.providerRef) return "The gateway never confirmed a payment for this order.";
  if (pay.refundedPaisa > 0 || pay.refundRef) return "This payment has already been refunded.";
  if (order.fulfillmentStatus !== "CANCELLED") return "Cancel the order first (a delivered order is refunded through Returns).";
  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED") return "This order isn’t marked as paid.";
  return null;
}

/** Pays the full amount back to the customer's card / wallet through the gateway. OWNER / MANAGER (checked by the caller). */
export async function refundOnlinePayment(db: DB, deps: GatewayDeps, orderId: string, input: { actorId: string }, ctx: AuditContext, now: Date = new Date()): Promise<{ code: string; amountPaisa: number }> {
  const claim = withStockTransaction(db, (tx) => {
    const row = loadOnline(tx, orderId);
    if (!row) throw new OnlinePayError("Order not found.");
    const blocker = gatewayRefundBlocker(row.order, row.pay);
    if (blocker) throw new OnlinePayError(blocker);
    // Compare-and-set so a double click can't send two refunds
    const res = tx.update(payments).set({ refundRef: `STARTING:${now.toISOString()}` }).where(and(eq(payments.id, row.pay.id), isNull(payments.refundRef))).run();
    if (res.changes !== 1) throw new OnlinePayError("A refund for this payment is already being made.");
    return row;
  });
  const gw = deps.isConfigured() ? deps.gateway() : null;
  if (!gw || !gw.refund) {
    db.update(payments).set({ refundRef: null }).where(eq(payments.id, claim.pay.id)).run();
    throw new OnlinePayError("This payment gateway doesn’t support refunds from the shop. Refund the customer in the gateway’s own dashboard.");
  }
  let refundRef: string;
  try {
    refundRef = (await gw.refund({ reference: claim.pay.id, providerRef: claim.pay.providerRef!, amountPaisa: claim.pay.amountPaisa })).refundRef;
  } catch (e) {
    db.update(payments).set({ refundRef: null }).where(eq(payments.id, claim.pay.id)).run();
    if (e instanceof GatewayError) throw new OnlinePayError(`The refund didn’t go through: ${e.message}`);
    throw e;
  }
  withStockTransaction(db, (tx) => {
    tx.update(payments).set({ status: "REFUNDED", refundedPaisa: claim.pay.amountPaisa, refundRef }).where(eq(payments.id, claim.pay.id)).run();
    tx.update(orders).set({ paymentStatus: "REFUNDED" }).where(eq(orders.id, claim.order.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "payment.refunded_online", entity: "orders", entityId: claim.order.id, before: { paymentStatus: claim.order.paymentStatus }, after: { paymentStatus: "REFUNDED", amountPaisa: claim.pay.amountPaisa, refundRef } });
  });
  return { code: claim.order.code, amountPaisa: claim.pay.amountPaisa };
}

// ---- What to show -------------------------------------------------------------------------------

export type OnlinePaymentView = {
  paymentId: string;
  status: string;
  providerRef: string | null;
  failureReason: string | null;
  checkedAt: string | null;
  verifiedAt: string | null;
  refundedPaisa: number;
  /** Order was cancelled and then paid: the shop owes the customer this money back. */
  refundDue: boolean;
  /** The "Refund through the gateway" button may be shown (cancelled, paid, not yet refunded). */
  canRefund: boolean;
  amountPaisa: number;
  problems: { at: string; detail: string }[];
};

export function onlinePaymentView(db: DB, orderId: string): OnlinePaymentView | null {
  const row = loadOnline(db, orderId);
  if (!row) return null;
  const problems = db
    .select({ at: webhookEvents.receivedAt, detail: webhookEvents.detail })
    .from(webhookEvents)
    .where(and(eq(webhookEvents.paymentId, row.pay.id), eq(webhookEvents.status, "FAILED")))
    .all()
    .map((p) => ({ at: p.at, detail: p.detail ?? "" }));
  const canRefund = gatewayRefundBlocker(row.order, row.pay) === null;
  const refundDue = canRefund && row.order.paymentStatus === "PAID";
  return { paymentId: row.pay.id, status: row.pay.status, providerRef: row.pay.providerRef, failureReason: row.pay.failureReason, checkedAt: row.pay.checkedAt, verifiedAt: row.pay.verifiedAt, refundedPaisa: row.pay.refundedPaisa, refundDue, canRefund, amountPaisa: row.pay.amountPaisa, problems };
}

export type { GatewayStatus };

/** The last callbacks the shop received, for Admin → Shop settings (no payload is kept, only its hash). */
export function recentCallbacks(db: DB, limit = 12) {
  return db
    .select({ at: webhookEvents.receivedAt, eventId: webhookEvents.eventId, status: webhookEvents.status, detail: webhookEvents.detail, code: orders.code })
    .from(webhookEvents)
    .leftJoin(payments, eq(payments.id, webhookEvents.paymentId))
    .leftJoin(orders, eq(orders.id, payments.orderId))
    .orderBy(sql`${webhookEvents}.rowid DESC`)
    .limit(limit)
    .all();
}

/** Online payments waiting for the customer, and any that need staff (late payments, refused callbacks). */
export function onlineAttentionCounts(db: DB) {
  const one = (w: ReturnType<typeof and>) => db.select({ n: sql<number>`count(*)` }).from(orders).where(w).get()?.n ?? 0;
  return {
    waiting: one(and(eq(orders.paymentMethod, "AGGREGATOR"), eq(orders.paymentStatus, "UNPAID"), ne(orders.fulfillmentStatus, "CANCELLED"))),
    refundDue: one(and(eq(orders.paymentMethod, "AGGREGATOR"), eq(orders.fulfillmentStatus, "CANCELLED"), eq(orders.paymentStatus, "PAID"))),
  };
}
