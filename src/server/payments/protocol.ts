import { gatewaySecrets, type GatewayConfig } from "./config";
import { verifySignature } from "./signature";
import { GatewayError, SignatureError, type CreatePaymentInput, type FetchLike, type GatewayEvent, type GatewayPaymentState, type GatewayStatus, type PaymentGateway } from "./types";

/**
 * The Caidea gateway protocol v1 (SPECIFICATION §31.3): the vendor-neutral shape every adapter is
 * written against, spoken by the test gateway (tests/helpers/fake-gateway.ts). A real vendor gets its
 * own file next to this one that translates the vendor's API into the same PaymentGateway interface.
 *
 *   POST /v1/payments               create → { id, checkoutUrl }
 *   GET  /v1/payments/{id}          status
 *   POST /v1/payments/{id}/refunds  refund → { id }
 *   GET  /v1/ping
 *   callback: POST <callbackUrl>  { id, type, data:{ paymentId, reference, amount, currency, status } }
 *             header X-Gateway-Signature: t=…,v1=…  (HMAC-SHA256, see signature.ts)
 */
export const GATEWAY_TIMEOUT_MS = 20_000;
const MAX_BYTES = 1024 * 1024;
type Env = Record<string, string | undefined>;

const STATUS: Record<string, GatewayStatus> = { succeeded: "SUCCEEDED", paid: "SUCCEEDED", failed: "FAILED", cancelled: "FAILED", expired: "FAILED", pending: "PENDING", created: "PENDING", refunded: "REFUNDED" };
const asStatus = (v: unknown): GatewayStatus | null => (typeof v === "string" ? (STATUS[v.toLowerCase()] ?? null) : null);

const str = (v: unknown, max = 200) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : null);
const isRec = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** One line of vendor text for staff: no markup or control characters, short. */
const clean = (s: unknown, max = 160) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export function protocolGateway(config: GatewayConfig, env: Env = process.env, fetchImpl: FetchLike = fetch): PaymentGateway {
  const { merchantId, secretKey, webhookSecret } = gatewaySecrets(env);
  const base = config.baseUrl;
  const vendor = config.vendor ?? "test";
  if (!base) throw new GatewayError("Online payment isn’t set up (check AGGREGATOR_* in the environment file).");
  const origin = new URL(base).origin;

  async function call(method: "GET" | "POST", path: string, body?: unknown): Promise<Record<string, unknown>> {
    let res: Response;
    try {
      res = await fetchImpl(`${origin}${path}`, {
        method,
        headers: { authorization: `Bearer ${secretKey}`, "x-merchant-id": merchantId, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
        redirect: "error",
        cache: "no-store",
      });
    } catch (e) {
      const name = (e as Error).name;
      throw new GatewayError(name === "TimeoutError" || name === "AbortError" ? `The payment gateway didn’t answer within ${GATEWAY_TIMEOUT_MS / 1000} seconds.` : `Couldn’t reach the payment gateway (${clean((e as Error).message, 100)}).`);
    }
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new GatewayError("The payment gateway sent an unexpectedly large reply.");
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    if (res.status === 401 || res.status === 403) throw new GatewayError(`The payment gateway refused the keys (${res.status}). Check AGGREGATOR_MERCHANT_ID and AGGREGATOR_SECRET_KEY.`);
    if (!res.ok) throw new GatewayError(`The payment gateway answered ${res.status}${isRec(json) && json.message ? `: ${clean(json.message)}` : ""}.`);
    if (!isRec(json)) throw new GatewayError("The payment gateway sent a reply the shop couldn’t read.");
    return json;
  }

  const stateFrom = (j: Record<string, unknown>): GatewayPaymentState => {
    const status = asStatus(j.status);
    const reference = str(j.reference, 80);
    const amount = j.amount;
    if (!status || !reference || typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) throw new GatewayError("The payment gateway sent a reply the shop couldn’t read.");
    return { reference, providerRef: str(j.id, 120), status, amountPaisa: amount, currency: str(j.currency, 3) ?? "" };
  };

  return {
    vendor,

    async createPayment(i: CreatePaymentInput) {
      const j = await call("POST", "/v1/payments", {
        merchantId,
        reference: i.reference,
        orderCode: i.orderCode,
        amount: i.amountPaisa,
        currency: i.currency,
        customer: i.customer,
        returnUrl: i.returnUrl,
        cancelUrl: i.cancelUrl,
        callbackUrl: i.callbackUrl,
      });
      const id = str(j.id, 120);
      const url = str(j.checkoutUrl, 1000);
      if (!id || !url) throw new GatewayError("The payment gateway didn’t return a payment page.");
      // The customer is only ever sent to the gateway's own address (no open redirect)
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        throw new GatewayError("The payment gateway returned an address the shop couldn’t read.");
      }
      if (parsed.origin !== origin) throw new GatewayError("The payment gateway returned an address on another site, so the shop refused to send the customer there.");
      return { providerRef: id, redirectUrl: parsed.toString() };
    },

    verifyCallback({ rawBody, headers, now }): GatewayEvent {
      verifySignature(headers.get("x-gateway-signature"), rawBody, webhookSecret, now);
      let json: unknown;
      try {
        json = JSON.parse(rawBody);
      } catch {
        throw new SignatureError("not json");
      }
      if (!isRec(json) || !isRec(json.data)) throw new SignatureError("shape");
      const d = json.data;
      const eventId = str(json.id, 120);
      const reference = str(d.reference, 80);
      const status = asStatus(d.status);
      const amount = d.amount;
      if (!eventId || !reference || !status || typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) throw new SignatureError("fields");
      return { eventId, reference, providerRef: str(d.paymentId, 120), status, amountPaisa: amount, currency: str(d.currency, 3) ?? "" };
    },

    async queryStatus({ reference, providerRef }) {
      if (!providerRef) throw new GatewayError("This payment was never started at the gateway.");
      const j = await call("GET", `/v1/payments/${encodeURIComponent(providerRef)}`);
      const s = stateFrom(j);
      if (s.reference !== reference) throw new GatewayError("The gateway answered about a different payment, so the shop ignored it.");
      return s;
    },

    async refund({ providerRef, amountPaisa }) {
      const j = await call("POST", `/v1/payments/${encodeURIComponent(providerRef)}/refunds`, { amount: amountPaisa });
      const id = str(j.id, 120);
      if (!id) throw new GatewayError("The payment gateway didn’t confirm the refund.");
      return { refundRef: id };
    },

    async ping() {
      await call("GET", "/v1/ping");
    },
  };
}
