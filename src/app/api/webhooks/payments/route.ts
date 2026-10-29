import { after } from "next/server";
import { db } from "@/db/client";
import { sendOrderEmail } from "@/server/notify/order-emails";
import { paymentGateway } from "@/server/payments";
import { processWebhook, recordRejectedCallback } from "@/server/payments/online";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { revalidateStorefront } from "@/server/revalidate";

/**
 * The payment gateway's server-to-server callback — SPECIFICATION §8, §11 rule 5, §31.
 * Public by nature, so: body size cap, per-address rate limit, signature verified on the RAW body
 * (constant-time, timestamp tolerance) before anything is read from it, and every event id applied once.
 * Answers say nothing about WHY a callback was refused.
 */
export const dynamic = "force-dynamic";
const MAX_BODY = 64 * 1024;

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  if (!rateLimit(`webhook:${ip}`, 300, 60_000).ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) return Response.json({ error: "Too large" }, { status: 413 });
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY) return Response.json({ error: "Too large" }, { status: 413 });
  const audit = { ip, userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null };

  let gateway;
  try {
    gateway = paymentGateway();
  } catch {
    return Response.json({ error: "Not available" }, { status: 503 }); // not set up: the gateway will retry later
  }
  const result = processWebhook(db, gateway, { rawBody, headers: request.headers, audit });
  if ("rejected" in result) {
    // Count refused callbacks in the audit log, but at most 5 per address per hour so it can't be flooded
    if (rateLimit(`webhook-rejected:${ip}`, 5, 3_600_000).ok) recordRejectedCallback(db, audit, "signature");
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const o = result.outcome;
  if (o && (o.kind === "PAID" || o.kind === "LATE_PAYMENT")) {
    revalidateStorefront();
    if (o.kind === "PAID") after(() => void sendOrderEmail(db, { orderId: o.orderId, kind: "PAYMENT_CONFIRMED" }));
  }
  return Response.json({ received: true, duplicate: result.duplicate }, { status: result.http });
}
