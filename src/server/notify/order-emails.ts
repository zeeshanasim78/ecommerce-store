import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { emailLog } from "@/db/schema";
import type { EMAIL_KINDS } from "@/db/schema/orders";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { issueOrderToken } from "@/server/orders/access";
import { deliveryLabel, loadCustomerOrder, paymentSteps, type CustomerOrder } from "@/server/orders/order-details";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import { sendEmail, type EmailResult } from "./email";

/**
 * Customer emails about an order (owner request v1.11, SPECIFICATION §23). Every message goes
 * through sendEmail() (Gmail, daily free-tier guard) and is written to email_log.
 *
 *  - ORDER_PLACED      after checkout commits (never blocks the order); private link to details + PDF
 *  - SALES_COPY        the same order to the shop's sales email
 *  - PAYMENT_CONFIRMED staff confirmed a bank / wallet payment (Orders admin)
 *  - DISPATCHED        staff handed it to the courier (courier + tracking number)
 *  - CANCELLED         staff cancelled it
 *
 * Abuse guard: checkout needs no account, so someone could type a stranger's address. At most
 * CUSTOMER_DAILY_LIMIT order-placed emails go to one address per Karachi day; staff-sent updates
 * aren't limited per address (they still count toward the Gmail daily limit).
 * Emails are plain text, so nothing a customer types can become HTML; control characters are removed.
 */

export type EmailKind = (typeof EMAIL_KINDS)[number];
export const CUSTOMER_DAILY_LIMIT = 3;
type Env = Record<string, string | undefined>;

/** Public address of the shop for links in emails. From the environment file, never from the request. */
export function siteUrl(env: Env = process.env): string {
  const raw = (env.BETTER_AUTH_URL ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\/[^\s/?#]+(:\d+)?$/i.test(raw) ? raw : "http://localhost:3000";
}

const rs = (n: number) => formatMoney(paisa(n));
/** One line of customer-typed text: no control characters or line breaks, limited length. */
const clean = (v: string | null | undefined, max = 200) =>
  (v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const karachiDayStart = (now: Date) => {
  const k = new Date(now.getTime() + 5 * 3600_000);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - 5 * 3600_000).toISOString();
};

function itemsBlock(o: CustomerOrder): string[] {
  const lines = o.items.map((i) => `  ${i.qty} x ${clean(i.name)} (${clean(i.detail)}) — ${rs(i.linePaisa)}`);
  lines.push("", `  Subtotal: ${rs(o.subtotalPaisa)}`);
  if (o.discountPaisa) lines.push(`  Discount: -${rs(o.discountPaisa)}`);
  lines.push(`  Delivery: ${deliveryLabel(o)}`);
  if (o.codFeePaisa) lines.push(`  Cash on delivery fee: ${rs(o.codFeePaisa)}`);
  lines.push(`  TOTAL: ${rs(o.totalPaisa)}`);
  return lines;
}

function footer(o: CustomerOrder): string[] {
  const c = [o.contact.phone ? `Phone ${o.contact.phone}` : null, o.contact.whatsapp ? `WhatsApp ${o.contact.whatsapp}` : null, o.contact.email ? o.contact.email : null].filter(Boolean);
  return ["", "—", `${clean(o.storeName)}${c.length ? ` · ${c.join(" · ")}` : ""}`, "Please quote your order number whenever you contact us."];
}

function linkBlock(link: string | null): string[] {
  return link ? ["", "See your order online and download it as a PDF (private link for you only, valid 30 days — please don't share it):", link] : [];
}

export function composeOrderEmail(kind: EmailKind, o: CustomerOrder, opts: { link?: string | null; adminLink?: string; refundDue?: boolean } = {}): { subject: string; text: string } {
  const name = clean(o.name, 80) || "Customer";
  const store = clean(o.storeName, 40) || "Caidea";
  const deliver = [`Deliver to: ${name}, ${clean(o.phone, 30)}`, `  ${clean(o.address, 300)}`];

  if (kind === "SALES_COPY") {
    return {
      subject: `New order ${o.code}: ${rs(o.totalPaisa)} (${o.methodLabel})`,
      text: [
        `New online order ${o.code}, placed ${formatKarachi(o.placedAt)}.`,
        `Payment: ${o.methodLabel} — ${o.paymentLabel}`,
        `Customer: ${name} · ${clean(o.phone, 30)} · ${clean(o.email, 120)}`,
        `  ${clean(o.address, 300)}`,
        ...(o.notes ? [`Notes: ${clean(o.notes, 500)}`] : []),
        "",
        "Items",
        ...itemsBlock(o),
        "",
        `Open it in admin: ${opts.adminLink ?? ""}`,
      ].join("\n"),
    };
  }

  if (kind === "ORDER_PLACED") {
    const next =
      o.method === "COD"
        ? [`1. We call or WhatsApp you to confirm the order before we send it.`, `2. We dispatch it and email you the courier and tracking number.`, `3. Keep ${rs(o.totalPaisa)} in cash ready for the courier.`]
        : paymentSteps(o).map((s, i) => `${i + 1}. ${s}`);
    const pay = o.payTo.flatMap((p) => [`  ${p.method}`, ...p.lines.map((l) => `    ${l}`)]);
    return {
      subject: `${store} order ${o.code}: ${o.method === "COD" ? "received" : "please complete payment"}`,
      text: [
        `Assalam o Alaikum ${name},`,
        "",
        `Thank you for your order. Your order number is ${o.code} (placed ${formatKarachi(o.placedAt)}).`,
        `Payment: ${o.methodLabel} — ${o.paymentLabel}`,
        ...(o.payDeadline ? [`Please pay by: ${formatKarachi(o.payDeadline)}`] : []),
        "",
        "Items",
        ...itemsBlock(o),
        "",
        ...deliver,
        "",
        "WHAT HAPPENS NEXT",
        ...next,
        ...(pay.length ? ["", "PAY TO (any one of these accounts)", ...pay] : []),
        ...linkBlock(opts.link ?? null),
        ...footer(o),
      ].join("\n"),
    };
  }

  if (kind === "PAYMENT_CONFIRMED") {
    return {
      subject: `${store} order ${o.code}: payment received`,
      text: [
        `Assalam o Alaikum ${name},`,
        "",
        `We have received your payment of ${rs(o.totalPaisa)} for order ${o.code}. Thank you!`,
        "Your order is confirmed and is being packed. We'll email you again when it is handed to the courier, with the tracking number.",
        "",
        "Items",
        ...itemsBlock(o),
        "",
        ...deliver,
        ...linkBlock(opts.link ?? null),
        ...footer(o),
      ].join("\n"),
    };
  }

  if (kind === "DISPATCHED") {
    return {
      subject: `${store} order ${o.code}: dispatched`,
      text: [
        `Assalam o Alaikum ${name},`,
        "",
        `Your order ${o.code} is on its way.`,
        ...(o.shipment ? [`Courier: ${o.shipment.courier}`, ...(o.shipment.cn ? [`Tracking (CN) number: ${clean(o.shipment.cn, 40)}`] : [])] : []),
        ...(o.eta ? [`Expected delivery: ${o.eta.replace(" after dispatch", "")}.`] : []),
        ...(o.method === "COD" ? [`Please keep ${rs(o.totalPaisa)} in cash ready for the courier.`] : ["Already paid — nothing to pay on delivery."]),
        "",
        "Items",
        ...itemsBlock(o),
        "",
        ...deliver,
        ...linkBlock(opts.link ?? null),
        ...footer(o),
      ].join("\n"),
    };
  }

  // CANCELLED
  return {
    subject: `${store} order ${o.code}: cancelled`,
    text: [
      `Assalam o Alaikum ${name},`,
      "",
      `Your order ${o.code} has been cancelled.${o.cancelReason ? ` Reason: ${clean(o.cancelReason, 300)}` : ""}`,
      ...(opts.refundDue ? ["", `You had already paid ${rs(o.totalPaisa)}. We will send the money back to you — we'll contact you to arrange it.`] : []),
      "",
      "If you think this is a mistake, please contact us with the order number.",
      ...footer(o),
    ].join("\n"),
  };
}

export type OrderEmailResult = EmailResult & { recipient: string | null };

/** Sends one order email, writes email_log, never throws. `token` is reused for the link if given. */
export async function sendOrderEmail(
  db: DB,
  args: {
    orderId: string;
    kind: EmailKind;
    token?: string;
    actorId?: string | null;
    refundDue?: boolean;
  },
  env: Env = process.env,
  now: Date = new Date(),
): Promise<OrderEmailResult> {
  const settings = getCheckoutSettings(db, env);
  const o = loadCustomerOrder(db, args.orderId, settings);
  if (!o) return { sent: false, detail: "Order not found.", recipient: null };
  const recipient = args.kind === "SALES_COPY" ? settings.salesEmail : (o.email?.toLowerCase() ?? null);
  const base = siteUrl(env);

  const log = (status: "SENT" | "FAILED" | "SKIPPED", subject: string, detail: string) =>
    db
      .insert(emailLog)
      .values({
        orderId: o.id,
        kind: args.kind,
        recipient: recipient ?? "(none)",
        subject,
        status,
        detail: detail.slice(0, 500),
        createdBy: args.actorId ?? null,
        createdAt: now.toISOString(),
      })
      .run();

  if (!recipient) {
    const detail = args.kind === "SALES_COPY" ? "No sales email set in Admin → Shop settings." : "The order has no customer email.";
    log("SKIPPED", "-", detail);
    return { sent: false, detail, recipient: null };
  }

  if (args.kind === "ORDER_PLACED") {
    const today = db
      .select({ id: emailLog.id })
      .from(emailLog)
      .where(and(eq(emailLog.recipient, recipient), eq(emailLog.kind, "ORDER_PLACED"), eq(emailLog.status, "SENT"), gte(emailLog.createdAt, karachiDayStart(now))))
      .all().length;
    if (today >= CUSTOMER_DAILY_LIMIT) {
      const detail = `Not sent: ${recipient} already got ${CUSTOMER_DAILY_LIMIT} order emails today (protection against misuse).`;
      log("SKIPPED", "-", detail);
      return { sent: false, detail, recipient };
    }
  }

  const needsLink = args.kind !== "SALES_COPY" && args.kind !== "CANCELLED";
  const token = needsLink ? (args.token ?? issueOrderToken(db, o.id, now)) : null;
  const link = token ? `${base}/order/${o.code}/open?t=${token}` : null;
  const msg = composeOrderEmail(args.kind, o, {
    link,
    adminLink: `${base}/admin/orders/${o.id}`,
    refundDue: args.refundDue,
  });
  const result = await sendEmail(db, { to: [recipient], subject: msg.subject, text: msg.text }, env, now);
  log(result.sent ? "SENT" : "FAILED", msg.subject, result.detail);
  return { ...result, recipient };
}

/** After checkout: the customer's email and the sales copy. Runs after the order is saved; never throws. */
export async function sendOrderPlacedEmails(db: DB, orderId: string, token: string, env: Env = process.env, now: Date = new Date()) {
  try {
    const customer = await sendOrderEmail(db, { orderId, kind: "ORDER_PLACED", token }, env, now);
    const sales = await sendOrderEmail(db, { orderId, kind: "SALES_COPY" }, env, now);
    return { customer, sales };
  } catch (e) {
    console.error("[order email]", e instanceof Error ? e.message : e);
    return null;
  }
}

export const orderEmailLog = (db: DB, orderId: string) => db.select().from(emailLog).where(eq(emailLog.orderId, orderId)).orderBy(desc(emailLog.createdAt), desc(sql`${emailLog}.rowid`)).all();
