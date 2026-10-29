import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, deliveryZones, orders, payments, products, productVariants, stockLedger, SYSTEM_USER_ID, user, webhookEvents } from "@/db/schema";
import { OrderActionError, cancelOrder, confirmPayment, listOrders, markProofReceived } from "@/server/orders/admin-orders";
import { placeOrder, type CheckoutInput } from "@/server/orders/checkout";
import { loadCustomerOrder, paymentSteps } from "@/server/orders/order-details";
import { GATEWAY_ENV_KEYS, readGatewayConfig } from "@/server/payments/config";
import { liveGatewayDeps } from "@/server/payments";
import { OnlinePayError, expireOnlineOrders, onlinePaymentView, processWebhook, reconcilePayment, reconcilePending, refundOnlinePayment, startOnlinePayment } from "@/server/payments/online";
import { SIGNATURE_TOLERANCE_SECONDS, signatureHeader, verifySignature } from "@/server/payments/signature";
import { SignatureError } from "@/server/payments/types";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { writeSetting } from "@/server/settings/store-settings";
import { testDb } from "../helpers/db";
import { FAKE_GATEWAY_MERCHANT, FAKE_GATEWAY_SECRET, FAKE_GATEWAY_WEBHOOK_SECRET, startFakeGateway, type FakeGateway } from "../helpers/fake-gateway";
import { createVariant } from "../helpers/stock-fixtures";

/** v1.19 — Milestone 14: online payment through a gateway (SPECIFICATION §8, §31). */

let db: DB;
let gw: FakeGateway;
let lahore: string;
const CTX = { ip: "1.2.3.4", userAgent: "test" };
const STAFF = "staff-1";
const SITE = "https://caidea.pk";

const gatewayEnv = (over: Record<string, string> = {}) => ({
  ...process.env,
  BETTER_AUTH_URL: SITE,
  AGGREGATOR_VENDOR: "test",
  AGGREGATOR_MERCHANT_ID: FAKE_GATEWAY_MERCHANT,
  AGGREGATOR_SECRET_KEY: FAKE_GATEWAY_SECRET,
  AGGREGATOR_WEBHOOK_SECRET: FAKE_GATEWAY_WEBHOOK_SECRET,
  AGGREGATOR_TEST_BASE_URL: gw?.url ?? "",
  ...over,
});
const deps = () => liveGatewayDeps(gatewayEnv());

beforeAll(async () => {
  gw = await startFakeGateway();
});
afterAll(() => gw.close());

const savedEnv = Object.fromEntries([...PAYMENT_ENV_KEYS, ...GATEWAY_ENV_KEYS, "BETTER_AUTH_URL"].map((k) => [k, process.env[k]]));
beforeEach(() => {
  db = testDb();
  gw.payments.clear();
  gw.sent.length = 0;
  gw.requests.length = 0;
  lahore = crypto.randomUUID();
  db.insert(deliveryZones).values({ id: lahore, city: "Lahore", province: "Punjab", shippingFeePaisa: 25_000, codFeePaisa: 5_000, etaMinDays: 1, etaMaxDays: 2, mapX: 1, mapY: 1 }).run();
  db.insert(user).values({ id: STAFF, name: "Mona Manager", email: "m@caidea.test", role: "MANAGER", isActive: true }).run();
  writeSetting(db, "enabled_payment_methods", ["COD", "BANK_TRANSFER", "AGGREGATOR"], SYSTEM_USER_ID);
  for (const k of [...PAYMENT_ENV_KEYS, ...GATEWAY_ENV_KEYS]) delete process.env[k];
  Object.assign(process.env, {
    COD_MAX_ORDER_PKR: "20000",
    BANK_NAME: "Meezan Bank",
    BANK_ACCOUNT_TITLE: "Caidea Traders",
    BANK_IBAN: "PK40MEZN0000001123456702",
    BETTER_AUTH_URL: SITE,
    AGGREGATOR_VENDOR: "test",
    AGGREGATOR_MERCHANT_ID: FAKE_GATEWAY_MERCHANT,
    AGGREGATOR_SECRET_KEY: FAKE_GATEWAY_SECRET,
    AGGREGATOR_WEBHOOK_SECRET: FAKE_GATEWAY_WEBHOOK_SECRET,
    AGGREGATOR_TEST_BASE_URL: gw.url,
  });
});
afterEach(() => {
  for (const k of Object.keys(savedEnv)) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function published(stock: number, suffix = "1") {
  const ids = createVariant(db, stock, suffix); // Rs 1,500 each
  db.update(products).set({ isPublished: true }).where(eq(products.id, ids.productId)).run();
  return ids.variantId;
}
const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const orderRow = (id: string) => db.select().from(orders).where(eq(orders.id, id)).get()!;
const payRow = (orderId: string) => db.select().from(payments).where(eq(payments.orderId, orderId)).get()!;
const auditCount = (action: string) => db.select().from(adminAuditLog).where(eq(adminAuditLog.action, action)).all().length;
const form = (variantId: string, extra: Partial<CheckoutInput> = {}): CheckoutInput => ({
  idempotencyKey: crypto.randomUUID(),
  name: "Ayesha Khan",
  phone: "0300 1234567",
  email: "ayesha@example.com",
  line1: "House 12, Street 4, Gulberg III",
  cityId: lahore,
  method: "AGGREGATOR",
  lines: [{ variantId, qty: 1 }],
  ...extra,
});
function place(v: string, extra: Partial<CheckoutInput> = {}) {
  const r = placeOrder(db, form(v, extra));
  if (!r.ok) throw new Error(r.message);
  return r;
}
/** An online order whose payment has been opened at the gateway. */
async function placeAndStart(v: string, extra: Partial<CheckoutInput> = {}, now = new Date()) {
  const r = place(v, extra);
  const started = await startOnlinePayment(db, deps(), r.orderId, gatewayEnv(), now);
  const pay = payRow(r.orderId);
  return { ...r, ...started, payId: pay.id, gwId: pay.providerRef! };
}
const hook = (p: { gwId: string; payId: string; amount: number }, o: Parameters<FakeGateway["buildWebhook"]>[1] = {}) => gw.buildWebhook({ id: p.gwId, reference: p.payId, amount: p.amount }, o);
const receive = (wh: { rawBody: string; headers: Record<string, string> }, now = new Date()) => processWebhook(db, liveGatewayDeps(gatewayEnv()).gateway(), { rawBody: wh.rawBody, headers: new Headers(wh.headers), audit: CTX }, now);
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString().replace("T", " ").slice(0, 19);

describe("gateway settings (environment file)", () => {
  it("is off until a vendor is named, and never carries the secrets in its status", () => {
    expect(readGatewayConfig({}).configured).toBe(false);
    const ok = readGatewayConfig(gatewayEnv());
    expect(ok.configured).toBe(true);
    expect(ok.mode).toBe("test");
    expect(ok.warnings.join(" ")).toMatch(/TEST gateway/);
    expect(JSON.stringify(ok)).not.toContain(FAKE_GATEWAY_SECRET);
    expect(JSON.stringify(ok)).not.toContain(FAKE_GATEWAY_WEBHOOK_SECRET);
  });
  it("reports what is missing or wrong in plain words", () => {
    expect(readGatewayConfig(gatewayEnv({ AGGREGATOR_WEBHOOK_SECRET: "" })).problems.join(" ")).toMatch(/AGGREGATOR_WEBHOOK_SECRET is empty/);
    expect(readGatewayConfig(gatewayEnv({ AGGREGATOR_SECRET_KEY: "short" })).configured).toBe(false);
    expect(readGatewayConfig(gatewayEnv({ AGGREGATOR_MERCHANT_ID: "" })).configured).toBe(false);
    const unknown = readGatewayConfig(gatewayEnv({ AGGREGATOR_VENDOR: "safepay" }));
    expect(unknown.configured).toBe(false);
    expect(unknown.problems.join(" ")).toMatch(/no adapter/);
    expect(readGatewayConfig({ AGGREGATOR_MERCHANT_ID: "X123456" }).problems.join(" ")).toMatch(/AGGREGATOR_VENDOR is empty/);
  });
  it("the test gateway must be on this machine — any other address is ignored", () => {
    const c = readGatewayConfig(gatewayEnv({ AGGREGATOR_TEST_BASE_URL: "http://evil.example.com:4020" }));
    expect(c.configured).toBe(false);
    expect(c.problems.join(" ")).toMatch(/only for the test gateway/);
    expect(readGatewayConfig(gatewayEnv({ AGGREGATOR_TEST_BASE_URL: "https://127.0.0.1:4020" })).configured).toBe(false);
  });
});

describe("callback signatures", () => {
  const body = '{"id":"evt_1","data":{"amount":150000}}';
  const now = new Date();
  const ts = Math.floor(now.getTime() / 1000);
  it("accepts a genuine, fresh callback", () => {
    expect(() => verifySignature(signatureHeader(FAKE_GATEWAY_WEBHOOK_SECRET, body, ts), body, FAKE_GATEWAY_WEBHOOK_SECRET, now)).not.toThrow();
  });
  it.each([
    ["a changed body", (h: string) => ({ h, b: body.replace("150000", "100") })],
    ["the wrong secret", () => ({ h: signatureHeader("another-secret-0123456789abcdef", body, ts), b: body })],
    ["an old timestamp", () => ({ h: signatureHeader(FAKE_GATEWAY_WEBHOOK_SECRET, body, ts - SIGNATURE_TOLERANCE_SECONDS - 5), b: body })],
    ["a timestamp from the future", () => ({ h: signatureHeader(FAKE_GATEWAY_WEBHOOK_SECRET, body, ts + SIGNATURE_TOLERANCE_SECONDS + 5), b: body })],
    ["no signature", () => ({ h: "", b: body })],
    ["a malformed signature", () => ({ h: "t=abc,v1=zzz", b: body })],
    ["a truncated signature", (h: string) => ({ h: h.slice(0, -10), b: body })],
  ])("refuses %s", (_name, make) => {
    const good = signatureHeader(FAKE_GATEWAY_WEBHOOK_SECRET, body, ts);
    const { h, b } = make(good);
    expect(() => verifySignature(h || null, b, FAKE_GATEWAY_WEBHOOK_SECRET, now)).toThrow(SignatureError);
  });
});

describe("checkout with “Pay online now”", () => {
  it("creates an unpaid order, holds the stock, free delivery, and a gateway payment row", () => {
    const v = published(5);
    const r = place(v);
    const o = orderRow(r.orderId);
    expect(o.paymentMethod).toBe("AGGREGATOR");
    expect(o.paymentStatus).toBe("UNPAID");
    expect(o.fulfillmentStatus).toBe("NEW");
    expect(o.shippingFeePaisa).toBe(0); // prepaid free delivery
    expect(o.totalPaisa).toBe(150_000);
    expect(stockOf(v)).toBe(4);
    const p = payRow(r.orderId);
    expect(p).toMatchObject({ provider: "AGGREGATOR", status: "INITIATED", amountPaisa: 150_000, currency: "PKR" });
    expect(p.providerRef).toBeNull();
  });
  it("is refused when the gateway isn’t set up or the method is switched off", () => {
    const v = published(5);
    delete process.env.AGGREGATOR_VENDOR;
    const r = placeOrder(db, form(v));
    expect(r.ok).toBe(false);
    process.env.AGGREGATOR_VENDOR = "test";
    writeSetting(db, "enabled_payment_methods", ["COD", "BANK_TRANSFER"], SYSTEM_USER_ID);
    expect(placeOrder(db, form(v, { idempotencyKey: crypto.randomUUID() })).ok).toBe(false);
    expect(stockOf(v)).toBe(5);
  });
  it("a transaction ID makes no sense for an online order", () => {
    const r = placeOrder(db, form(published(5), { tid: "TX123456" }));
    expect(r.ok).toBe(false);
  });
});

describe("starting the payment at the gateway", () => {
  it("sends the amount in paisa, our payment id as the reference, and our own return / callback addresses", async () => {
    const v = published(5);
    const s = await placeAndStart(v);
    expect(s.redirectUrl).toBe(`${gw.url}/pay/${s.gwId}`);
    const sent = gw.requests.find((q) => q.path === "/v1/payments")!.body!;
    expect(sent).toMatchObject({ merchantId: FAKE_GATEWAY_MERCHANT, reference: s.payId, amount: 150_000, currency: "PKR", orderCode: s.code });
    expect(sent.callbackUrl).toBe(`${SITE}/api/webhooks/payments`);
    expect(String(sent.returnUrl)).toBe(`${SITE}/checkout/return?order=${encodeURIComponent(s.code)}`);
    expect(JSON.stringify(sent)).not.toContain(FAKE_GATEWAY_SECRET);
    expect(payRow(s.orderId)).toMatchObject({ status: "PENDING", providerRef: s.gwId });
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID"); // nothing is paid by opening the page
  });
  it("can be started again after an abandoned try (new gateway session, same payment row)", async () => {
    const v = published(5);
    const first = await placeAndStart(v);
    const again = await startOnlinePayment(db, deps(), first.orderId, gatewayEnv());
    expect(again.redirectUrl).not.toBe(first.redirectUrl);
    expect(db.select().from(payments).where(eq(payments.orderId, first.orderId)).all()).toHaveLength(1);
    expect(payRow(first.orderId).providerRef).not.toBe(first.gwId);
  });
  it("a gateway that is down leaves the order saved and unpaid, with a message that is safe to show", async () => {
    const v = published(5);
    const r = place(v);
    await fetch(`${gw.url}/__control/fail-next`, { method: "POST", body: JSON.stringify({ times: 1 }) });
    await expect(startOnlinePayment(db, deps(), r.orderId, gatewayEnv())).rejects.toThrow(/Your order is saved/);
    expect(orderRow(r.orderId).paymentStatus).toBe("UNPAID");
    expect(stockOf(v)).toBe(4);
    await expect(startOnlinePayment(db, deps(), r.orderId, gatewayEnv())).resolves.toBeTruthy(); // retry works
  });
  it("refuses to send the customer to a page on another site", async () => {
    const v = published(5);
    const r = place(v);
    const evil = liveGatewayDeps(gatewayEnv(), async (url, init) => {
      const res = await fetch(url, init);
      const j = (await res.json()) as Record<string, unknown>;
      return new Response(JSON.stringify({ ...j, checkoutUrl: "https://evil.example.com/pay" }), { status: 201, headers: { "content-type": "application/json" } });
    });
    await expect(startOnlinePayment(db, evil, r.orderId, gatewayEnv())).rejects.toThrow(OnlinePayError);
  });
  it("refuses wrong keys without echoing them", async () => {
    const v = published(5);
    const r = place(v);
    const bad = liveGatewayDeps(gatewayEnv({ AGGREGATOR_SECRET_KEY: "wrong-secret-key-0123456789" }));
    await expect(startOnlinePayment(db, bad, r.orderId, gatewayEnv())).rejects.toThrow(OnlinePayError);
  });
  it("won’t start for a paid, cancelled or expired order", async () => {
    const v = published(5, "a");
    const s = await placeAndStart(v);
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    await expect(startOnlinePayment(db, deps(), s.orderId, gatewayEnv())).rejects.toThrow(/already paid/);
    const old = place(published(5, "b"));
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, old.orderId)).run();
    await expect(startOnlinePayment(db, deps(), old.orderId, gatewayEnv())).rejects.toThrow(/run out/);
  });
});

describe("M14 acceptance: PAID only from a verified callback", () => {
  it("opening the payment page, or the browser coming back, never marks the order paid", async () => {
    const s = await placeAndStart(published(5));
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
    // the customer pays on the gateway page — the gateway is told, but the SHOP has heard nothing yet
    gw.payments.get(s.gwId)!.status = "succeeded";
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
    expect(orderRow(s.orderId).paidAt).toBeNull();
  });

  it("a signed callback marks it paid, confirms the order, and is audited", async () => {
    const v = published(5);
    const s = await placeAndStart(v);
    const r = receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    expect(r).toMatchObject({ http: 200, duplicate: false, outcome: { kind: "PAID", code: s.code } });
    const o = orderRow(s.orderId);
    expect(o).toMatchObject({ paymentStatus: "PAID", fulfillmentStatus: "CONFIRMED" });
    expect(o.paidAt).toBeTruthy();
    expect(payRow(s.orderId)).toMatchObject({ status: "SUCCEEDED", providerRef: s.gwId });
    expect(payRow(s.orderId).verifiedAt).toBeTruthy();
    expect(payRow(s.orderId).rawResponseHash).toMatch(/^[0-9a-f]{64}$/);
    expect(auditCount("payment.gateway_paid")).toBe(1);
    const ev = db.select().from(webhookEvents).all();
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ provider: "AGGREGATOR", status: "PROCESSED", paymentId: s.payId });
    expect(stockOf(v)).toBe(4); // stock was taken at order time, not again
  });

  it("replaying the same callback changes nothing", async () => {
    const s = await placeAndStart(published(5));
    const wh = hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 });
    receive(wh);
    const before = { order: orderRow(s.orderId), pay: payRow(s.orderId), audit: db.select().from(adminAuditLog).all().length };
    const again = receive(wh);
    expect(again).toMatchObject({ http: 200, duplicate: true, outcome: null });
    // a replay with a fresh signature timestamp but the same event id is also a duplicate
    const resigned = { rawBody: wh.rawBody, headers: { "x-gateway-signature": signatureHeader(FAKE_GATEWAY_WEBHOOK_SECRET, wh.rawBody) } };
    expect(receive(resigned)).toMatchObject({ duplicate: true });
    expect(orderRow(s.orderId)).toEqual(before.order);
    expect(payRow(s.orderId)).toEqual(before.pay);
    expect(db.select().from(adminAuditLog).all().length).toBe(before.audit);
    expect(db.select().from(webhookEvents).all()).toHaveLength(1);
  });

  it("a tampered amount is rejected: a re-signed lie is not applied; an edited body fails the signature", async () => {
    const s = await placeAndStart(published(5));
    // (a) someone edits the amount inside a genuine callback → signature no longer matches
    const genuine = hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 });
    const edited = { rawBody: genuine.rawBody.replace("150000", "100"), headers: genuine.headers };
    expect(receive(edited)).toEqual({ http: 400, rejected: true });
    // (b) a correctly signed callback that carries a different amount
    const lie = receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }, { amount: 100 }));
    expect(lie).toMatchObject({ http: 422, outcome: { kind: "MISMATCH" } });
    // (c) wrong currency
    const wh = gw.buildWebhook({ id: s.gwId, reference: s.payId, amount: 150_000, currency: "USD" });
    expect(receive(wh)).toMatchObject({ http: 422, outcome: { kind: "MISMATCH" } });
    // nothing changed, the problem is recorded
    expect(orderRow(s.orderId)).toMatchObject({ paymentStatus: "UNPAID", fulfillmentStatus: "NEW" });
    expect(payRow(s.orderId).status).toBe("PENDING");
    expect(auditCount("payment.amount_mismatch")).toBe(2);
    expect(db.select().from(webhookEvents).where(eq(webhookEvents.status, "FAILED")).all()).toHaveLength(2);
    expect(onlinePaymentView(db, s.orderId)!.problems).toHaveLength(2);
    // the real callback still works afterwards
    expect(receive(genuine)).toMatchObject({ outcome: { kind: "PAID" } });
  });

  it("refuses callbacks signed with the wrong secret, too old, or not JSON — and applies nothing", async () => {
    const s = await placeAndStart(published(5));
    const p = { gwId: s.gwId, payId: s.payId, amount: 150_000 };
    expect(receive(hook(p, { secret: "another-secret-0123456789abcdef" }))).toEqual({ http: 400, rejected: true });
    expect(receive(hook(p, { timestamp: Math.floor(Date.now() / 1000) - 3600 }))).toEqual({ http: 400, rejected: true });
    const junk = "not json";
    expect(receive({ rawBody: junk, headers: { "x-gateway-signature": signatureHeader(FAKE_GATEWAY_WEBHOOK_SECRET, junk) } })).toEqual({ http: 400, rejected: true });
    expect(receive({ rawBody: "{}", headers: {} })).toEqual({ http: 400, rejected: true });
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
    expect(db.select().from(webhookEvents).all()).toHaveLength(0);
  });

  it("a callback about a payment we don’t know is acknowledged and ignored", () => {
    const r = receive(gw.buildWebhook({ id: "gw_x", reference: crypto.randomUUID(), amount: 1000 }));
    expect(r).toMatchObject({ http: 200, outcome: { kind: "UNKNOWN_PAYMENT" } });
    expect(db.select().from(webhookEvents).get()!.status).toBe("IGNORED");
  });

  it("a failed callback keeps the order open so the customer can try again, and a later success pays it", async () => {
    const s = await placeAndStart(published(5));
    const f = receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }, { status: "failed" }));
    expect(f).toMatchObject({ outcome: { kind: "FAILED_RECORDED" } });
    expect(payRow(s.orderId).status).toBe("FAILED");
    expect(orderRow(s.orderId)).toMatchObject({ paymentStatus: "UNPAID", fulfillmentStatus: "NEW" });
    expect(loadCustomerOrder(db, s.orderId)!.onlineFailure).toMatch(/not completed/);
    const retry = await startOnlinePayment(db, deps(), s.orderId, gatewayEnv());
    expect(retry.redirectUrl).toBeTruthy();
    expect(payRow(s.orderId).status).toBe("PENDING");
    const second = payRow(s.orderId);
    expect(receive(hook({ gwId: second.providerRef!, payId: second.id, amount: 150_000 }))).toMatchObject({ outcome: { kind: "PAID" } });
    // a stale “failed” message arriving after payment can't undo it
    expect(receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }, { status: "failed" }))).toMatchObject({ outcome: { kind: "NO_CHANGE" } });
    expect(orderRow(s.orderId).paymentStatus).toBe("PAID");
  });

  it("a gateway reference already used by another order is refused", async () => {
    const a = await placeAndStart(published(5, "a"));
    const b = await placeAndStart(published(5, "b"));
    const r = receive(hook({ gwId: a.gwId, payId: b.payId, amount: 150_000 })); // b's payment, a's gateway number
    expect(r).toMatchObject({ http: 422, outcome: { kind: "MISMATCH" } });
    expect(orderRow(b.orderId).paymentStatus).toBe("UNPAID");
  });
});

describe("asking the gateway directly (reconciliation)", () => {
  it("finds a payment whose callback never arrived, once", async () => {
    const s = await placeAndStart(published(5));
    await gw.complete(s.gwId, { deliver: false }); // paid at the gateway, callback lost
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
    const r = await reconcilePayment(db, deps(), s.payId);
    expect(r).toMatchObject({ kind: "CHECKED", outcome: { kind: "PAID" } });
    expect(orderRow(s.orderId)).toMatchObject({ paymentStatus: "PAID", fulfillmentStatus: "CONFIRMED" });
    expect(await reconcilePayment(db, deps(), s.payId)).toMatchObject({ outcome: { kind: "ALREADY_PAID" } });
    expect(auditCount("payment.gateway_paid")).toBe(1);
    // a callback that arrives later changes nothing
    expect(receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }))).toMatchObject({ outcome: { kind: "ALREADY_PAID" } });
    expect(auditCount("payment.gateway_paid")).toBe(1);
  });
  it("reconcilePending pays only the ones the gateway says are paid", async () => {
    const a = await placeAndStart(published(5, "a"));
    const b = await placeAndStart(published(5, "b"));
    await gw.complete(a.gwId, { deliver: false });
    const sum = await reconcilePending(db, deps(), new Date(Date.now() + 5 * 60_000));
    expect(sum).toMatchObject({ checked: 2, paid: [a.code], errors: [] });
    expect(orderRow(b.orderId).paymentStatus).toBe("UNPAID");
    expect(payRow(b.orderId).checkedAt).toBeTruthy();
  });
  it("an unreachable gateway changes nothing", async () => {
    const s = await placeAndStart(published(5));
    await fetch(`${gw.url}/__control/fail-next`, { method: "POST", body: JSON.stringify({ times: 1 }) });
    const r = await reconcilePayment(db, deps(), s.payId);
    expect(r.kind).toBe("ERROR");
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
  });
  it("a reply about a different payment is ignored", async () => {
    const s = await placeAndStart(published(5));
    gw.payments.get(s.gwId)!.reference = "someone-else";
    expect((await reconcilePayment(db, deps(), s.payId)).kind).toBe("ERROR");
  });
  it("a gateway amount that differs from the order is not applied", async () => {
    const s = await placeAndStart(published(5));
    gw.payments.get(s.gwId)!.status = "succeeded";
    gw.payments.get(s.gwId)!.amount = 1000;
    expect(await reconcilePayment(db, deps(), s.payId)).toMatchObject({ outcome: { kind: "MISMATCH" } });
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
  });
});

describe("unpaid online orders expire — but only after asking the gateway", () => {
  it("cancels an order nobody paid, putting the stock back", async () => {
    const v = published(5);
    const s = await placeAndStart(v);
    expect(await expireOnlineOrders(db, deps())).toEqual([]); // not old enough
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, s.orderId)).run();
    expect(await expireOnlineOrders(db, deps())).toEqual([s.code]);
    expect(orderRow(s.orderId)).toMatchObject({ fulfillmentStatus: "CANCELLED", cancelReason: "Online payment not completed in time" });
    expect(stockOf(v)).toBe(5);
    expect(db.select().from(stockLedger).where(eq(stockLedger.transactionType, "ORDER_CANCEL_RESTOCK")).all()).toHaveLength(1);
    expect(auditCount("order.expired_unpaid")).toBe(1);
    expect(await expireOnlineOrders(db, deps())).toEqual([]); // once only
  });
  it("an order paid at the gateway whose callback was lost is paid, not cancelled", async () => {
    const v = published(5);
    const s = await placeAndStart(v);
    await gw.complete(s.gwId, { deliver: false });
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, s.orderId)).run();
    expect(await expireOnlineOrders(db, deps())).toEqual([]);
    expect(orderRow(s.orderId).paymentStatus).toBe("PAID");
    expect(stockOf(v)).toBe(4);
  });
  it("nothing is cancelled while the gateway can’t be reached", async () => {
    const s = await placeAndStart(published(5));
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, s.orderId)).run();
    await fetch(`${gw.url}/__control/fail-next`, { method: "POST", body: JSON.stringify({ times: 1 }) });
    expect(await expireOnlineOrders(db, deps())).toEqual([]);
    expect(orderRow(s.orderId).fulfillmentStatus).toBe("NEW");
  });
  it("an order whose payment page was never opened expires too", async () => {
    const v = published(5);
    const r = place(v);
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, r.orderId)).run();
    expect(await expireOnlineOrders(db, deps())).toEqual([r.code]);
    expect(stockOf(v)).toBe(5);
  });
  it("manual bank orders are untouched by the online job", async () => {
    const v = published(5);
    const r = place(v, { method: "BANK_TRANSFER" });
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, r.orderId)).run();
    expect(await expireOnlineOrders(db, deps())).toEqual([]);
  });
});

describe("paying after the order was cancelled, and refunds", () => {
  async function cancelledThenPaid() {
    const v = published(5);
    const s = await placeAndStart(v);
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, s.orderId)).run();
    await expireOnlineOrders(db, deps());
    await gw.complete(s.gwId, { deliver: false }); // the customer really did pay at the gateway
    const r = receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    return { v, s, r };
  }
  it("keeps the money on record, leaves the order cancelled, and flags a refund", async () => {
    const { v, s, r } = await cancelledThenPaid();
    expect(r).toMatchObject({ outcome: { kind: "LATE_PAYMENT" } });
    expect(orderRow(s.orderId)).toMatchObject({ fulfillmentStatus: "CANCELLED", paymentStatus: "PAID" });
    expect(payRow(s.orderId).status).toBe("SUCCEEDED");
    expect(stockOf(v)).toBe(5); // stock stays on the shelf
    expect(auditCount("payment.late_after_cancel")).toBe(1);
    expect(onlinePaymentView(db, s.orderId)).toMatchObject({ refundDue: true, canRefund: true });
    expect(listOrders(db, { filter: "refund" }).map((o) => o.code)).toEqual([s.code]);
    expect(listOrders(db, { filter: "action" }).map((o) => o.code)).toContain(s.code);
  });
  it("refunds the full amount through the gateway once, never twice", async () => {
    const { s } = await cancelledThenPaid();
    const done = await refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX);
    expect(done).toEqual({ code: s.code, amountPaisa: 150_000 });
    expect(gw.payments.get(s.gwId)!.refunds).toEqual([expect.objectContaining({ amount: 150_000 })]);
    expect(orderRow(s.orderId).paymentStatus).toBe("REFUNDED");
    expect(payRow(s.orderId)).toMatchObject({ status: "REFUNDED", refundedPaisa: 150_000 });
    expect(payRow(s.orderId).refundRef).toMatch(/^rf_/);
    expect(auditCount("payment.refunded_online")).toBe(1);
    await expect(refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX)).rejects.toThrow(/already been refunded/);
    expect(gw.payments.get(s.gwId)!.refunds).toHaveLength(1);
  });
  it("two refund clicks at once send one refund", async () => {
    const { s } = await cancelledThenPaid();
    const results = await Promise.allSettled([refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX), refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(gw.payments.get(s.gwId)!.refunds).toHaveLength(1);
  });
  it("a refund the gateway refuses can be tried again", async () => {
    const { s } = await cancelledThenPaid();
    await fetch(`${gw.url}/__control/fail-next`, { method: "POST", body: JSON.stringify({ times: 1 }) });
    await expect(refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX)).rejects.toThrow(/didn’t go through/);
    expect(payRow(s.orderId).refundRef).toBeNull();
    await expect(refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX)).resolves.toBeTruthy();
  });
  it("staff cancelling a paid online order promises a refund that the gateway button then pays", async () => {
    const v = published(5);
    const s = await placeAndStart(v);
    await gw.complete(s.gwId, { deliver: false });
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    expect(() => cancelOrder(db, s.orderId, { reason: "Customer asked", actorId: STAFF }, CTX)).toThrow(/Tick/); // must confirm the refund
    cancelOrder(db, s.orderId, { reason: "Customer asked", refundConfirmed: true, actorId: STAFF }, CTX);
    expect(stockOf(v)).toBe(5);
    expect(orderRow(s.orderId).paymentStatus).toBe("REFUNDED"); // the promise
    expect(onlinePaymentView(db, s.orderId)).toMatchObject({ canRefund: true, refundedPaisa: 0 });
    await refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX);
    expect(payRow(s.orderId).refundedPaisa).toBe(150_000);
  });
  it("a delivered or unpaid order can’t be refunded through the gateway", async () => {
    const s = await placeAndStart(published(5));
    await expect(refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX)).rejects.toThrow(/never confirmed/);
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    await expect(refundOnlinePayment(db, deps(), s.orderId, { actorId: STAFF }, CTX)).rejects.toThrow(/Cancel the order first/);
  });
  it("a refund made in the gateway’s own dashboard is picked up", async () => {
    const s = await placeAndStart(published(5));
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    expect(receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }, { status: "refunded" }))).toMatchObject({ outcome: { kind: "REFUND_RECORDED" } });
    expect(orderRow(s.orderId).paymentStatus).toBe("REFUNDED");
    expect(payRow(s.orderId)).toMatchObject({ status: "REFUNDED", refundedPaisa: 150_000 });
  });
});

describe("staff screens and the customer’s view", () => {
  it("staff can’t mark an online order paid by hand or record a screenshot", async () => {
    const s = await placeAndStart(published(5));
    expect(() => confirmPayment(db, s.orderId, { actorId: STAFF }, CTX)).toThrow(OrderActionError);
    expect(() => confirmPayment(db, s.orderId, { actorId: STAFF }, CTX)).toThrow(/never mark it paid by hand/);
    expect(() => markProofReceived(db, s.orderId, { via: "WHATSAPP", actorId: STAFF }, CTX)).toThrow(/paid online/);
    expect(orderRow(s.orderId).paymentStatus).toBe("UNPAID");
  });
  it("lists unpaid online orders under “Waiting for payment”, and flags a refused callback as a problem", async () => {
    const s = await placeAndStart(published(5));
    expect(listOrders(db, { filter: "payment" }).map((o) => o.code)).toContain(s.code);
    expect(listOrders(db, { filter: "problem" })).toHaveLength(0);
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }, { amount: 5 }));
    expect(listOrders(db, { filter: "problem" }).map((o) => o.code)).toEqual([s.code]);
    expect(listOrders(db, { filter: "action" }).map((o) => o.code)).toContain(s.code);
  });
  it("a paid online order moves into the pack queue like any prepaid order", async () => {
    const s = await placeAndStart(published(5));
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    expect(listOrders(db, { filter: "pack" }).map((o) => o.code)).toEqual([s.code]);
    expect(listOrders(db, { filter: "payment" })).toHaveLength(0);
  });
  it("the customer sees “Pay online now” while it can be paid, not after it expires or is paid", async () => {
    const s = await placeAndStart(published(5));
    const o = loadCustomerOrder(db, s.orderId)!;
    expect(o).toMatchObject({ method: "AGGREGATOR", payOnline: true, awaitingPayment: false });
    expect(o.payDeadline).toBeTruthy();
    expect(paymentSteps(o).join(" ")).toMatch(/Pay Rs 1,500\.00 on the secure payment page|payment page/);
    expect(paymentSteps(o).join(" ")).not.toMatch(/screenshot to us|slip/);
    receive(hook({ gwId: s.gwId, payId: s.payId, amount: 150_000 }));
    expect(loadCustomerOrder(db, s.orderId)).toMatchObject({ payOnline: false, paymentLabel: "Paid" });
    const late = place(published(5, "z"));
    db.update(orders).set({ placedAt: ago(45) }).where(eq(orders.id, late.orderId)).run();
    expect(loadCustomerOrder(db, late.orderId)!.payOnline).toBe(false);
  });
});
