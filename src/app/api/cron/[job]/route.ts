import { timingSafeEqual } from "node:crypto";
import { db } from "@/db/client";
import { findLedgerDrift } from "@/server/inventory/stock";
import { expireUnpaidOrders } from "@/server/orders/checkout";
import { revalidateStorefront } from "@/server/revalidate";

/**
 * Scheduled jobs (spec §2, §6.3 step 5, §6.5). Called by the shop server's timer (systemd, M18):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/expire-unpaid
 * Jobs: expire-unpaid (cancel unpaid wallet/bank orders, return stock), reconcile-stock (ledger check).
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
  return Response.json({ error: "Unknown job" }, { status: 404 });
}
