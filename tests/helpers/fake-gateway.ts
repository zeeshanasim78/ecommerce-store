import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { signatureHeader } from "@/server/payments/signature";

/**
 * A pretend payment gateway on this machine (Caidea gateway protocol v1, SPECIFICATION §31.3), for unit
 * tests and the browser walk-through:
 *   AGGREGATOR_VENDOR=test  AGGREGATOR_TEST_BASE_URL=http://127.0.0.1:<port>
 *   AGGREGATOR_MERCHANT_ID=TESTMERCH  AGGREGATOR_SECRET_KEY=<FAKE_GATEWAY_SECRET>  AGGREGATOR_WEBHOOK_SECRET=<FAKE_GATEWAY_WEBHOOK_SECRET>
 * Pages:   GET /pay/<id>   the "payment page" with Pay / Fail / Cancel buttons (what a customer would see)
 * Control: POST /__control/complete {"id" or "reference","deliver":false}   mark paid (and send the signed callback unless deliver=false)
 *          POST /__control/fail     {"id" or "reference"}
 *          POST /__control/fail-next {"times":1}   the next N API calls answer 500
 *          GET  /__control/payments   /__control/webhooks (what was sent)
 * Standalone: npx tsx tests/helpers/fake-gateway.ts 4020 [http://localhost:3000/api/webhooks/payments]
 */

export const FAKE_GATEWAY_MERCHANT = "TESTMERCH";
export const FAKE_GATEWAY_SECRET = "test-secret-key-0123456789abcdef";
export const FAKE_GATEWAY_WEBHOOK_SECRET = "test-webhook-secret-0123456789abcdef";

export type FakePayment = {
  id: string;
  reference: string;
  orderCode: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  callbackUrl: string;
  returnUrl: string;
  cancelUrl: string;
  refunds: { id: string; amount: number }[];
};
export type SentWebhook = { eventId: string; rawBody: string; headers: Record<string, string>; delivered: number | null };

export type FakeGateway = {
  url: string;
  server: Server;
  payments: Map<string, FakePayment>;
  sent: SentWebhook[];
  requests: { method: string; path: string; body: Record<string, unknown> | null }[];
  /** Builds a signed callback (not sent anywhere) — for tests that call the app's code directly. */
  buildWebhook(p: { id: string; reference: string; amount: number; currency?: string }, opts?: { type?: string; status?: string; eventId?: string; amount?: number; secret?: string; timestamp?: number }): SentWebhook;
  complete(idOrReference: string, opts?: { deliver?: boolean }): Promise<SentWebhook | null>;
  fail(idOrReference: string): Promise<SentWebhook | null>;
  close(): Promise<void>;
};

async function readBody(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (!chunks.length) return null;
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

export async function startFakeGateway(port = 0, opts: { defaultCallbackUrl?: string } = {}): Promise<FakeGateway> {
  const payments = new Map<string, FakePayment>();
  const sent: SentWebhook[] = [];
  const requests: FakeGateway["requests"] = [];
  let failNext = 0;
  let seq = 1000;
  let evt = 1;
  let url = "";

  const find = (k: string) => payments.get(k) ?? [...payments.values()].reverse().find((p) => p.reference === k);

  function buildWebhook(p: { id: string; reference: string; amount: number; currency?: string }, o: { type?: string; status?: string; eventId?: string; amount?: number; secret?: string; timestamp?: number } = {}): SentWebhook {
    const status = o.status ?? "succeeded";
    const eventId = o.eventId ?? `evt_${evt++}`;
    const rawBody = JSON.stringify({ id: eventId, type: o.type ?? `payment.${status}`, data: { paymentId: p.id, reference: p.reference, amount: o.amount ?? p.amount, currency: p.currency ?? "PKR", status } });
    return { eventId, rawBody, headers: { "content-type": "application/json", "x-gateway-signature": signatureHeader(o.secret ?? FAKE_GATEWAY_WEBHOOK_SECRET, rawBody, o.timestamp) }, delivered: null };
  }

  async function deliver(p: FakePayment, wh: SentWebhook): Promise<SentWebhook> {
    sent.push(wh);
    try {
      const res = await fetch(p.callbackUrl, { method: "POST", headers: wh.headers, body: wh.rawBody });
      wh.delivered = res.status;
    } catch {
      wh.delivered = 0;
    }
    return wh;
  }

  async function complete(k: string, o: { deliver?: boolean } = {}) {
    const p = find(k);
    if (!p) return null;
    p.status = "succeeded";
    if (o.deliver === false) return null;
    return deliver(p, buildWebhook(p, { status: "succeeded" }));
  }
  async function fail(k: string) {
    const p = find(k);
    if (!p) return null;
    p.status = "failed";
    return deliver(p, buildWebhook(p, { status: "failed" }));
  }

  const server = createServer(async (req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    const path = u.pathname;
    const method = req.method ?? "GET";
    const body = method === "POST" ? await readBody(req) : null;
    const json = (status: number, data: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };
    const redirect = (to: string) => {
      res.writeHead(303, { location: to });
      res.end();
    };

    if (path.startsWith("/__control/")) {
      if (path === "/__control/complete") return json(200, { sent: await complete(String(body?.id ?? body?.reference ?? ""), { deliver: body?.deliver !== false }).then((w) => w?.delivered ?? null) });
      if (path === "/__control/fail") return json(200, { sent: await fail(String(body?.id ?? body?.reference ?? "")).then((w) => w?.delivered ?? null) });
      if (path === "/__control/fail-next") {
        failNext = Number(body?.times ?? 1);
        return json(200, { ok: true });
      }
      if (path === "/__control/payments") return json(200, [...payments.values()]);
      if (path === "/__control/webhooks") return json(200, sent);
      return json(404, { message: "unknown control" });
    }

    // The payment page a customer sees
    if (method === "GET" && path.startsWith("/pay/")) {
      const p = payments.get(decodeURIComponent(path.slice(5)));
      if (!p) return json(404, { message: "no such payment" });
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test payment page</title>
<body style="font-family:system-ui;max-width:28rem;margin:3rem auto;padding:0 1rem">
<h1>Test gateway</h1><p>Pretend payment page — no real money moves.</p>
<p>Order <b id="order">${p.orderCode}</b><br>Amount <b id="amount">Rs ${(p.amount / 100).toLocaleString("en-PK")}</b><br>Status <b id="status">${p.status}</b></p>
<form method="post" action="/pay/${p.id}/pay"><button id="pay" style="padding:.7rem 1.2rem">Pay now</button></form><br>
<form method="post" action="/pay/${p.id}/fail"><button id="fail" style="padding:.7rem 1.2rem">Fail the payment</button></form><br>
<form method="post" action="/pay/${p.id}/cancel"><button id="cancel" style="padding:.7rem 1.2rem">Cancel and go back</button></form></body>`);
    }
    if (method === "POST" && path.startsWith("/pay/")) {
      const [, , id, action] = path.split("/");
      const p = payments.get(decodeURIComponent(id ?? ""));
      if (!p) return json(404, { message: "no such payment" });
      if (action === "pay") {
        await complete(p.id);
        return redirect(p.returnUrl);
      }
      if (action === "fail") {
        await fail(p.id);
        return redirect(p.returnUrl);
      }
      return redirect(p.cancelUrl);
    }

    // API (authenticated)
    requests.push({ method, path, body });
    if (failNext > 0) {
      failNext--;
      return json(500, { message: "gateway is having a bad day" });
    }
    if (req.headers.authorization !== `Bearer ${FAKE_GATEWAY_SECRET}` || req.headers["x-merchant-id"] !== FAKE_GATEWAY_MERCHANT) return json(401, { message: "bad keys" });
    if (method === "GET" && path === "/v1/ping") return json(200, { ok: true });
    if (method === "POST" && path === "/v1/payments") {
      const b = body ?? {};
      if (typeof b.reference !== "string" || !Number.isInteger(b.amount) || (b.amount as number) <= 0 || b.currency !== "PKR") return json(422, { message: "reference, integer amount and currency PKR are required" });
      const id = `gw_${seq++}`;
      payments.set(id, {
        id,
        reference: b.reference,
        orderCode: String(b.orderCode ?? ""),
        amount: b.amount as number,
        currency: "PKR",
        status: "pending",
        callbackUrl: String(opts.defaultCallbackUrl ?? b.callbackUrl ?? ""),
        returnUrl: String(b.returnUrl ?? ""),
        cancelUrl: String(b.cancelUrl ?? ""),
        refunds: [],
      });
      return json(201, { id, status: "pending", checkoutUrl: `${url}/pay/${id}` });
    }
    const m = /^\/v1\/payments\/([^/]+)(\/refunds)?$/.exec(path);
    const p = m ? payments.get(decodeURIComponent(m[1]!)) : undefined;
    if (m && !p) return json(404, { message: "no such payment" });
    if (m && p && method === "GET" && !m[2]) return json(200, { id: p.id, reference: p.reference, status: p.status, amount: p.amount, currency: p.currency });
    if (m && p && method === "POST" && m[2]) {
      if (p.status !== "succeeded") return json(409, { message: "only a paid payment can be refunded" });
      const amount = Number(body?.amount);
      if (!Number.isInteger(amount) || amount <= 0 || amount > p.amount) return json(422, { message: "bad refund amount" });
      const r = { id: `rf_${seq++}`, amount };
      p.refunds.push(r);
      p.status = "refunded";
      return json(201, r);
    }
    return json(404, { message: "not found" });
  });

  await new Promise<void>((r) => server.listen(port, "127.0.0.1", r));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, server, payments, sent, requests, buildWebhook, complete, fail, close: () => new Promise((r) => server.close(() => r())) };
}

// Standalone: npx tsx tests/helpers/fake-gateway.ts 4020 [callback url]
if (process.argv[1]?.endsWith("fake-gateway.ts")) {
  const port = Number(process.argv[2] ?? 4020);
  startFakeGateway(port, { defaultCallbackUrl: process.argv[3] }).then((g) => console.log(`Test gateway on ${g.url}  (merchant ${FAKE_GATEWAY_MERCHANT}, secret ${FAKE_GATEWAY_SECRET}, webhook secret ${FAKE_GATEWAY_WEBHOOK_SECRET})`));
}
