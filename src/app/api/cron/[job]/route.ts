import { timingSafeEqual } from "node:crypto";
import { db } from "@/db/client";
import { findLedgerDrift } from "@/server/inventory/stock";
import { eq } from "drizzle-orm";
import { orders, settings } from "@/db/schema";
import { liveCourierDeps } from "@/server/couriers";
import { expireUnpaidOrders } from "@/server/orders/checkout";
import { syncTracking } from "@/server/orders/fulfilment";
import { revalidateStorefront } from "@/server/revalidate";
import { sendOrderEmail } from "@/server/notify/order-emails";
import { liveGatewayDeps } from "@/server/payments";
import { expireOnlineOrders, reconcilePending } from "@/server/payments/online";

/**
 * Scheduled jobs (spec §2, §6.3 step 5, §6.5). Called by the shop server's timer (systemd, M18):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/expire-unpaid
 * Jobs: expire-unpaid (cancel unpaid wallet/bank orders, return stock), reconcile-stock (ledger check),
 * sync-tracking (v1.15: ask Leopards / PostEx about open parcels — every 2 hours, spec §9),
 * reconcile-payments (v1.19: ask the payment gateway about unsettled online payments, then cancel the
 * online orders still unpaid after the wait — every 10 minutes, spec §31).
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (secret.length < 32 || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function POST(request: Request, { params }: { params: Promise<{ job: string }> }) {
  if (!authorised(request)) return Response.json({ error: "Not allowed" }, { status: 401 });
  const { job } = await params;

  if (job === "expire-unpaid") {
    const cancelled = expireUnpaidOrders(db);
    if (cancelled.length) revalidateStorefront(); // returned stock shows on the shop at once
    return Response.json({ job, cancelled });
  }
  if (job === "reconcile-stock") {
    const drift = findLedgerDrift(db);
    return Response.json({ job, ok: drift.length === 0, drift }, { status: drift.length ? 500 : 200 });
  }
  if (job === "sync-tracking") {
    const summary = await syncTracking(db, liveCourierDeps());
    const value = { at: new Date().toISOString(), by: "timer", ...summary };
    db.insert(settings).values({ key: "tracking_sync_last", value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: value.at } }).run();
    if (summary.updated) revalidateStorefront();
    return Response.json({ job, ...summary }, { status: summary.errors.length && !summary.checked ? 502 : 200 });
  }
  if (job === "reconcile-payments") {
    const deps = liveGatewayDeps();
    if (!deps.isConfigured()) return Response.json({ job, skipped: "Online payment isn’t set up." });
    const summary = await reconcilePending(db, deps);
    // Cancelling comes after asking the gateway, so a payment whose callback was lost is paid, not cancelled
    const cancelled = await expireOnlineOrders(db, deps);
    const value = { at: new Date().toISOString(), by: "timer", ...summary, cancelled };
    db.insert(settings).values({ key: "payment_reconcile_last", value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: value.at } }).run();
    if (summary.paid.length || summary.latePayments.length || cancelled.length) revalidateStorefront();
    for (const code of summary.paid) {
      const o = db.select({ id: orders.id }).from(orders).where(eq(orders.code, code)).get();
      if (o) await sendOrderEmail(db, { orderId: o.id, kind: "PAYMENT_CONFIRMED" });
    }
    return Response.json({ job, ...summary, cancelled }, { status: summary.errors.length && !summary.checked ? 502 : 200 });
  }
  return Response.json({ error: "Unknown job" }, { status: 404 });
}
