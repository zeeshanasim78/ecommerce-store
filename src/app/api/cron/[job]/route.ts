import { timingSafeEqual } from "node:crypto";
import { db } from "@/db/client";
import { findLedgerDrift } from "@/server/inventory/stock";
import { settings } from "@/db/schema";
import { liveCourierDeps } from "@/server/couriers";
import { expireUnpaidOrders } from "@/server/orders/checkout";
import { syncTracking } from "@/server/orders/fulfilment";
import { revalidateStorefront } from "@/server/revalidate";

/**
 * Scheduled jobs (spec §2, §6.3 step 5, §6.5). Called by the shop server's timer (systemd, M18):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/expire-unpaid
 * Jobs: expire-unpaid (cancel unpaid wallet/bank orders, return stock), reconcile-stock (ledger check),
 * sync-tracking (v1.15: ask Leopards / PostEx about open parcels — every 2 hours, spec §9).
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
  return Response.json({ error: "Unknown job" }, { status: 404 });
}
