import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SMTPServer } from "smtp-server";
import type { AddressInfo } from "node:net";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, couponRedemptions, coupons, deliveryZones, emailLog, orderAccessTokens, orders, payments, products, productVariants, shipments, stockLedger, SYSTEM_USER_ID, user } from "@/db/schema";
import { findLedgerDrift } from "@/server/inventory/stock";
import { CUSTOMER_DAILY_LIMIT, composeOrderEmail, orderEmailLog, sendOrderEmail, sendOrderPlacedEmails, siteUrl } from "@/server/notify/order-emails";
import { issueOrderToken, orderCookieName, orderIdForToken, ORDER_TOKEN_TTL_MS } from "@/server/orders/access";
import { OrderActionError, cancelOrder, confirmPayment, dispatchOrder, listOrders, markProofReceived, orderCounts } from "@/server/orders/admin-orders";
import { expireUnpaidOrders, placeOrder, type CheckoutInput } from "@/server/orders/checkout";
import { loadCustomerOrder, paymentSteps } from "@/server/orders/order-details";
import { buildOrderPdf } from "@/server/orders/order-pdf";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { writeSetting } from "@/server/settings/store-settings";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** v1.11 — prepaid flow, private order links, PDF, customer emails, Orders admin (SPECIFICATION §23). */

let db: DB;
let lahore: string;
const CTX = { ip: "1.2.3.4", userAgent: "test" };
const STAFF = "staff-1";

// Local mail server so the email path is tested end to end
const inbox: { to: string[]; raw: string }[] = [];
let smtp: SMTPServer;
let smtpPort = 0;
beforeAll(async () => {
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, session, done) {
      let raw = "";
      stream.on("data", (c: Buffer) => (raw += c.toString()));
      stream.on("end", () => {
        inbox.push({ to: session.envelope.rcptTo.map((r) => r.address), raw });
        done();
      });
    },
  });
  await new Promise<void>((ok) => smtp.listen(0, "127.0.0.1", ok));
  smtpPort = (smtp.server.address() as AddressInfo).port;
});
afterAll(() => new Promise<void>((ok) => smtp.close(() => ok())));

const decode = (raw: string) =>
  Buffer.from(
    raw.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16))),
    "latin1",
  ).toString("utf8");
const ENV = () => ({
  ...process.env,
  GMAIL_USER: "caidea.shop@gmail.com",
  GMAIL_APP_PASSWORD: "abcdefghijklmnop",
  EMAIL_TEST_SMTP: `127.0.0.1:${smtpPort}`,
  BETTER_AUTH_URL: "https://caidea.pk",
});

function published(stock: number, suffix = "1") {
  const ids = createVariant(db, stock, suffix); // Rs 1,500 each
  db.update(products).set({ isPublished: true }).where(eq(products.id, ids.productId)).run();
  return ids.variantId;
}
const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const orderRow = (id: string) => db.select().from(orders).where(eq(orders.id, id)).get()!;
const form = (variantId: string, extra: Partial<CheckoutInput> = {}): CheckoutInput => ({
  idempotencyKey: crypto.randomUUID(),
  name: "Ayesha Khan",
  phone: "0300 1234567",
  email: "Ayesha@Example.com",
  line1: "House 12, Street 4, Gulberg III",
  cityId: lahore,
  method: "BANK_TRANSFER",
  lines: [{ variantId, qty: 1 }],
  ...extra,
});
function place(v: string, extra: Partial<CheckoutInput> = {}) {
  const r = placeOrder(db, form(v, extra));
  if (!r.ok) throw new Error(r.message);
  return r;
}

const savedEnv = Object.fromEntries(PAYMENT_ENV_KEYS.map((k) => [k, process.env[k]]));
beforeEach(() => {
  db = testDb();
  inbox.length = 0;
  lahore = crypto.randomUUID();
  db.insert(deliveryZones)
    .values({
      id: lahore,
      city: "Lahore",
      province: "Punjab",
      shippingFeePaisa: 25_000,
      codFeePaisa: 5_000,
      etaMinDays: 1,
      etaMaxDays: 2,
      mapX: 1,
      mapY: 1,
    })
    .run();
  db.insert(user)
    .values({
      id: STAFF,
      name: "Mona Manager",
      email: "m@caidea.test",
      role: "MANAGER",
      isActive: true,
    })
    .run();
  writeSetting(db, "enabled_payment_methods", ["COD", "JAZZCASH", "BANK_TRANSFER"], SYSTEM_USER_ID);
  writeSetting(db, "whatsapp", "+923001112233", SYSTEM_USER_ID);
  writeSetting(db, "store_phone", "+923004445566", SYSTEM_USER_ID);
  writeSetting(db, "sales_email", "sales@caidea.test", SYSTEM_USER_ID);
  for (const k of PAYMENT_ENV_KEYS) delete process.env[k];
  Object.assign(process.env, {
    COD_MAX_ORDER_PKR: "20000",
    JAZZCASH_ACCOUNT_TITLE: "Caidea Traders",
    JAZZCASH_ACCOUNT_NUMBER: "0300-1112223",
    BANK_NAME: "Meezan Bank",
    BANK_ACCOUNT_TITLE: "Caidea Traders",
    BANK_IBAN: "PK40MEZN0000001123456702",
  });
});
afterEach(() => {
  for (const k of PAYMENT_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("private order access (§23)", () => {
  it("the token from checkout opens only its own order, and only until it expires", () => {
    const v = published(5);
    const a = place(v);
    const b = place(v, { phone: "0321 7654321" });
    expect(orderIdForToken(db, a.code, a.accessToken)).toBe(a.orderId);
    expect(orderIdForToken(db, a.code.toLowerCase(), a.accessToken)).toBe(a.orderId);
    expect(orderIdForToken(db, b.code, a.accessToken)).toBeNull(); // someone else's order
    expect(orderIdForToken(db, a.code, "x".repeat(43))).toBeNull();
    expect(orderIdForToken(db, a.code, undefined)).toBeNull();
    expect(orderIdForToken(db, a.code, a.accessToken, new Date(Date.now() + ORDER_TOKEN_TTL_MS + 60_000))).toBeNull();
  });

  it("only a hash of the token is stored", () => {
    const v = published(5);
    const a = place(v);
    const rows = db.select().from(orderAccessTokens).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rows)).not.toContain(a.accessToken);
  });

  it("cookie names are per order and safe", () => {
    expect(orderCookieName("CA-ORD-261003-0001")).toBe("caidea_order_caord2610030001");
  });

  it("expired tokens are cleaned up when new ones are issued", () => {
    const v = published(5);
    const a = place(v);
    issueOrderToken(db, a.orderId, new Date(Date.now() + ORDER_TOKEN_TTL_MS * 2));
    expect(db.select().from(orderAccessTokens).all()).toHaveLength(1);
  });
});

describe("customer order view and PDF", () => {
  it("prepaid order: every account to pay into (chosen first), remark instruction and where to send the screenshot", () => {
    const v = published(5);
    const r = place(v, { method: "JAZZCASH" });
    const o = loadCustomerOrder(db, r.orderId)!;
    expect(o.awaitingPayment).toBe(true);
    expect(o.payTo.map((p) => p.method)).toEqual(["JazzCash", "Bank transfer"]);
    expect(o.payTo[1]!.lines).toEqual(["Bank: Meezan Bank", "Account title: Caidea Traders", "IBAN: PK40MEZN0000001123456702"]);
    const steps = paymentSteps(o).join("\n");
    expect(steps).toContain(`Write your order number ${r.code} in the transfer’s remarks`);
    // v1.12 owner wording: slip + transaction ID + order number, by WhatsApp or email, within 24 hours
    expect(steps).toMatch(new RegExp(`Within 24 hours, send us the payment slip \\(screenshot\\) and the transaction ID together with your order number ${r.code}: WhatsApp 0300 1112233 or email sales@caidea\\.test`));
    expect(steps).toContain("Questions? Call 0300 4445566");
    expect(o.payDeadline).not.toBeNull();
  });

  it("COD order shows no accounts", () => {
    const v = published(5);
    const o = loadCustomerOrder(db, place(v, { method: "COD" }).orderId)!;
    expect(o.awaitingPayment).toBe(false);
    expect(o.payTo).toEqual([]);
  });

  it("builds a real PDF, even with characters Helvetica can't draw", async () => {
    const v = published(5);
    const r = place(v, { name: "عائشہ Khan", notes: "Call before — 9 pm" });
    const bytes = await buildOrderPdf(loadCustomerOrder(db, r.orderId)!);
    const head = Buffer.from(bytes.slice(0, 5)).toString("latin1");
    expect(head).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1500);
  });
});

describe("order emails", () => {
  it("after checkout: customer email with items, accounts, remark instruction and private link; copy to sales", async () => {
    const v = published(5);
    const r = place(v);
    const out = await sendOrderPlacedEmails(db, r.orderId, r.accessToken, ENV());
    expect(out?.customer.sent).toBe(true);
    expect(out?.sales.sent).toBe(true);
    expect(inbox.map((m) => m.to[0])).toEqual(["ayesha@example.com", "sales@caidea.test"]);
    const body = decode(inbox[0]!.raw);
    expect(body).toMatch(new RegExp(`Subject: Caidea order ${r.code}`));
    expect(body).toContain("IBAN: PK40MEZN0000001123456702");
    expect(body).toContain(`Write your order number ${r.code} in the transfer’s remarks`);
    expect(body).toContain("Delivery: Free (paid in advance)");
    expect(body).toContain(`https://caidea.pk/order/${r.code}/open?t=${r.accessToken}`);
    expect(body).toContain("Galaxy Test 1");
    const sales = decode(inbox[1]!.raw);
    expect(sales).toContain(`https://caidea.pk/admin/orders/${r.orderId}`);
    expect(sales).not.toContain(r.accessToken); // the private link is for the customer only
    expect(
      db
        .select()
        .from(emailLog)
        .all()
        .map((e) => [e.kind, e.status]),
    ).toEqual([
      ["ORDER_PLACED", "SENT"],
      ["SALES_COPY", "SENT"],
    ]);
  });

  it("a stranger's address can't be flooded: at most 3 order emails a day per address", async () => {
    const v = published(10);
    const results = [];
    for (let i = 0; i < CUSTOMER_DAILY_LIMIT + 1; i++) {
      const r = place(v, { phone: `0300 123456${i}` });
      results.push(await sendOrderEmail(db, { orderId: r.orderId, kind: "ORDER_PLACED", token: r.accessToken }, ENV()));
    }
    expect(results.map((x) => x.sent)).toEqual([true, true, true, false]);
    expect(results[3]!.detail).toMatch(/already got 3/);
    expect(db.select().from(emailLog).where(eq(emailLog.status, "SKIPPED")).all()).toHaveLength(1);
  });

  it("customer text can't add lines or headers to the email", () => {
    const v = published(5);
    const r = place(v, {
      name: "Ali\r\nBcc: victim@x.test",
      notes: "line1\nFAKE: paid",
    });
    const o = loadCustomerOrder(db, r.orderId)!;
    const sales = composeOrderEmail("SALES_COPY", o, { adminLink: "x" });
    expect(sales.text).not.toMatch(/\nBcc:/);
    expect(sales.text).not.toMatch(/\nFAKE:/);
    expect(composeOrderEmail("ORDER_PLACED", o).subject).not.toMatch(/[\r\n]/);
  });

  it("not set up / no sales email: the order is unaffected and the reason is logged", async () => {
    const v = published(5);
    writeSetting(db, "sales_email", null, SYSTEM_USER_ID);
    const r = place(v);
    const out = await sendOrderPlacedEmails(db, r.orderId, r.accessToken, {
      ...process.env,
      GMAIL_USER: "",
    });
    expect(out?.customer).toMatchObject({
      sent: false,
      detail: expect.stringMatching(/isn’t set up/),
    });
    expect(out?.sales).toMatchObject({
      sent: false,
      detail: expect.stringMatching(/No sales email/),
    });
    expect(orderRow(r.orderId).fulfillmentStatus).toBe("NEW");
  });

  it("links use the configured site address, never a request header", () => {
    expect(siteUrl({ BETTER_AUTH_URL: "https://caidea.pk/" })).toBe("https://caidea.pk");
    expect(siteUrl({ BETTER_AUTH_URL: "javascript:alert(1)" })).toBe("http://localhost:3000");
    expect(siteUrl({ BETTER_AUTH_URL: "https://evil.test/path?x" })).toBe("http://localhost:3000");
  });
});

describe("Orders admin — prepaid flow (owner request v1.11)", () => {
  it("proof received → stops the 48 h expiry; confirm → PAID; dispatch → BOOKED with courier; all audited", () => {
    const v = published(5);
    const r = place(v);
    expect(markProofReceived(db, r.orderId, { via: "WHATSAPP", actorId: STAFF }, CTX)).toBe(r.code);
    expect(orderRow(r.orderId).paymentStatus).toBe("PENDING_VERIFICATION");
    expect(expireUnpaidOrders(db, new Date(Date.now() + 72 * 3600_000))).toEqual([]); // not cancelled
    expect(() => markProofReceived(db, r.orderId, { via: "WHATSAPP", actorId: STAFF }, CTX)).toThrow(OrderActionError); // twice

    expect(() => dispatchOrder(db, r.orderId, { courier: "LEOPARDS", cn: "LE123456", actorId: STAFF }, CTX)).toThrow(/Confirm the payment/);
    confirmPayment(db, r.orderId, { reference: "ftx998877", actorId: STAFF }, CTX);
    expect(orderRow(r.orderId)).toMatchObject({
      paymentStatus: "PAID",
      fulfillmentStatus: "CONFIRMED",
    });
    expect(db.select().from(payments).where(eq(payments.orderId, r.orderId)).get()).toMatchObject({
      status: "SUCCEEDED",
      manualReference: "FTX998877",
      verifiedBy: STAFF,
    });
    expect(() => confirmPayment(db, r.orderId, { actorId: STAFF }, CTX)).toThrow(/already confirmed/); // double click

    dispatchOrder(db, r.orderId, { courier: "LEOPARDS", cn: "le123456", actorId: STAFF }, CTX);
    expect(orderRow(r.orderId).fulfillmentStatus).toBe("BOOKED");
    expect(db.select().from(shipments).where(eq(shipments.orderId, r.orderId)).get()).toMatchObject({
      courier: "LEOPARDS",
      cnNumber: "LE123456",
      codAmountPaisa: 0,
    });
    expect(() => dispatchOrder(db, r.orderId, { courier: "LEOPARDS", cn: "LE999", actorId: STAFF }, CTX)).toThrow(OrderActionError);
    expect(() => cancelOrder(db, r.orderId, { reason: "changed mind", actorId: STAFF }, CTX)).toThrow(/return/);

    const actions = db
      .select({ a: adminAuditLog.action })
      .from(adminAuditLog)
      .where(eq(adminAuditLog.entityId, r.orderId))
      .all()
      .map((x) => x.a);
    expect(actions).toEqual(["order.proof_received", "order.payment_confirmed", "order.dispatched"]);
  });

  it("an order with no payment details expires after 24 hours (v1.12)", () => {
    const v = published(5);
    const r = place(v);
    expect(expireUnpaidOrders(db, new Date(Date.now() + 23 * 3600_000))).toEqual([]);
    expect(expireUnpaidOrders(db, new Date(Date.now() + 25 * 3600_000))).toEqual([r.code]);
    expect(() => confirmPayment(db, r.orderId, { actorId: STAFF }, CTX)).toThrow(/cancelled/);
  });

  it("COD orders can be dispatched straight away and carry the cash amount", () => {
    const v = published(5);
    const r = place(v, { method: "COD" });
    expect(() => markProofReceived(db, r.orderId, { via: "CALL", actorId: STAFF }, CTX)).toThrow(/cash on delivery/);
    dispatchOrder(db, r.orderId, { courier: "POSTEX", cn: "PX-0001", actorId: STAFF }, CTX);
    expect(db.select().from(shipments).get()).toMatchObject({
      courier: "POSTEX",
      codAmountPaisa: r.totalPaisa,
    });
  });

  it("cancel returns stock through the engine and the coupon; a paid order needs the refund tick", () => {
    const v = published(5);
    db.insert(coupons)
      .values({
        code: "ONCE",
        discountType: "FIXED",
        value: 10_000,
        usage: "SINGLE_USE",
        maxRedemptions: 1,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2099-01-01T00:00:00.000Z",
      })
      .run();
    const r = place(v, { coupon: "ONCE", lines: [{ variantId: v, qty: 2 }] });
    expect(stockOf(v)).toBe(3);
    confirmPayment(db, r.orderId, { actorId: STAFF }, CTX);
    expect(() => cancelOrder(db, r.orderId, { reason: "Out of stock at the warehouse", actorId: STAFF }, CTX)).toThrow(/refund/);
    expect(() => cancelOrder(db, r.orderId, { reason: "x", refundConfirmed: true, actorId: STAFF }, CTX)).toThrow(/why/);
    expect(
      cancelOrder(
        db,
        r.orderId,
        {
          reason: "Out of stock at the warehouse",
          refundConfirmed: true,
          actorId: STAFF,
        },
        CTX,
      ),
    ).toEqual({ code: r.code, refundDue: true });
    expect(orderRow(r.orderId)).toMatchObject({
      fulfillmentStatus: "CANCELLED",
      paymentStatus: "REFUNDED",
      cancelReason: "Out of stock at the warehouse",
    });
    expect(stockOf(v)).toBe(5);
    expect(
      db
        .select()
        .from(stockLedger)
        .where(and(eq(stockLedger.referenceId, r.orderId), eq(stockLedger.transactionType, "ORDER_CANCEL_RESTOCK")))
        .get(),
    ).toMatchObject({ quantityChanged: 2, operatorId: STAFF });
    expect(db.select().from(couponRedemptions).all()).toHaveLength(0);
    expect(() => cancelOrder(db, r.orderId, { reason: "again", refundConfirmed: true, actorId: STAFF }, CTX)).toThrow(/already cancelled/);
    expect(findLedgerDrift(db)).toEqual([]);
  });

  it("a transaction ID can't be claimed by two orders", () => {
    const v = published(5);
    const a = place(v);
    const b = place(v, { phone: "0321 7654321" });
    markProofReceived(db, a.orderId, { via: "EMAIL", reference: "TX11112222", actorId: STAFF }, CTX);
    expect(() => confirmPayment(db, b.orderId, { reference: "TX11112222", actorId: STAFF }, CTX)).toThrow(/another order/);
  });

  it("staff emails: payment confirmed and dispatched with courier + tracking, each with a fresh private link", async () => {
    const v = published(5);
    const r = place(v);
    confirmPayment(db, r.orderId, { actorId: STAFF }, CTX);
    expect((await sendOrderEmail(db, { orderId: r.orderId, kind: "PAYMENT_CONFIRMED", actorId: STAFF }, ENV())).sent).toBe(true);
    dispatchOrder(db, r.orderId, { courier: "LEOPARDS", cn: "LE555666", actorId: STAFF }, CTX);
    expect((await sendOrderEmail(db, { orderId: r.orderId, kind: "DISPATCHED", actorId: STAFF }, ENV())).sent).toBe(true);
    const [paid, sent] = inbox.map((m) => decode(m.raw));
    expect(paid).toMatch(/payment received/);
    expect(sent).toMatch(/dispatched/);
    expect(sent).toContain("Leopards Courier");
    expect(sent).toContain("LE555666");
    expect(sent).toMatch(/\/order\/CA-ORD-\d{6}-\d{4}\/open\?t=[A-Za-z0-9_-]{43}/);
    expect(db.select().from(emailLog).where(eq(emailLog.createdBy, STAFF)).all()).toHaveLength(2);
    expect(orderEmailLog(db, r.orderId).map((e) => e.kind)).toEqual(["DISPATCHED", "PAYMENT_CONFIRMED"]); // newest first
  });

  it("lists and counts orders that need staff", () => {
    const v = published(10);
    const prepaid = place(v);
    const cod = place(v, { method: "COD", phone: "0321 7654321" });
    markProofReceived(db, prepaid.orderId, { via: "WHATSAPP", actorId: STAFF }, CTX);
    expect(orderCounts(db)).toMatchObject({
      action: 2,
      payment: 1,
      dispatch: 1,
      all: 2,
    });
    expect(listOrders(db, { filter: "all", q: "0321 7654321" }).map((o) => o.id)).toEqual([cod.orderId]);
    expect(listOrders(db, { filter: "all", q: prepaid.code.slice(-4) }).map((o) => o.id)).toContain(prepaid.orderId);
  });
});
