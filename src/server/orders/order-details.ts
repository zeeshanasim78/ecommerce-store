import { desc, eq } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { deliveryZones, orderItems, orders, payments, shipments } from "@/db/schema";
import { FULFILLMENT_LABEL, PAYMENT_LABEL } from "@/lib/order-labels";
import { formatMoney, paisa } from "@/lib/money";
import { formatPkMobile } from "@/lib/phone";
import { parseTimestamp } from "@/lib/time";
import { MANUAL_METHODS, METHOD_LABEL, getCheckoutSettings, payToLines, prepaidMethods, type CheckoutMethod, type CheckoutSettings } from "@/server/settings/store-settings";

/**
 * One description of an order for the customer: used by the order page, the PDF and the emails
 * (v1.11, SPECIFICATION §23). Contains personal data — only build it after the access check.
 */

export const COURIER_LABEL: Record<string, string> = {
  LEOPARDS: "Leopards Courier",
  POSTEX: "PostEx",
  TCS: "TCS",
  TRAX: "Trax",
  SELF: "Our own rider",
};

export type PayAccount = { method: string; lines: string[] };

export type CustomerOrder = {
  id: string;
  code: string;
  placedAt: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  notes: string | null;
  method: CheckoutMethod;
  methodLabel: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  statusLabel: string;
  paymentLabel: string;
  cancelled: boolean;
  cancelReason: string | null;
  /** Prepaid order still waiting for money (or for the shop to receive the screenshot). */
  awaitingPayment: boolean;
  /** Accounts to pay into, the one chosen at checkout first. Empty unless awaitingPayment. */
  payTo: PayAccount[];
  payDeadline: string | null;
  waitHours: number;
  eta: string | null;
  shipment: { courier: string; cn: string | null; bookedAt: string } | null;
  items: {
    name: string;
    detail: string;
    qty: number;
    unitPaisa: number;
    linePaisa: number;
  }[];
  subtotalPaisa: number;
  discountPaisa: number;
  shippingPaisa: number;
  codFeePaisa: number;
  totalPaisa: number;
  contact: {
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
  };
  storeName: string;
};

export function loadCustomerOrder(db: DB | Tx, orderId: string, settings?: CheckoutSettings): CustomerOrder | null {
  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order || order.channel !== "ONLINE") return null;
  const s = settings ?? getCheckoutSettings(db);
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).all();
  const zone = order.cityId ? db.select().from(deliveryZones).where(eq(deliveryZones.id, order.cityId)).get() : undefined;
  const ship = db.select().from(shipments).where(eq(shipments.orderId, order.id)).orderBy(desc(shipments.bookedAt)).get();
  const method = order.paymentMethod as CheckoutMethod;
  const cancelled = order.fulfillmentStatus === "CANCELLED";
  const awaitingPayment = MANUAL_METHODS.includes(method) && (order.paymentStatus === "UNPAID" || order.paymentStatus === "PENDING_VERIFICATION") && !cancelled;
  const ordered = [method, ...prepaidMethods(s).filter((m) => m !== method)];
  const payTo = awaitingPayment
    ? ordered.flatMap((m) => {
        const lines = payToLines(s, m);
        return lines ? [{ method: METHOD_LABEL[m], lines }] : [];
      })
    : [];
  const a = order.shippingAddress;
  const placed = parseTimestamp(order.placedAt);
  return {
    id: order.id,
    code: order.code,
    placedAt: order.placedAt,
    name: order.guestName ?? a?.name ?? "",
    phone: order.guestPhone ? formatPkMobile(order.guestPhone) : "",
    email: order.guestEmail,
    address: a ? [a.line1, a.line2, a.area, a.city, a.postalCode].filter(Boolean).join(", ") : "",
    notes: order.notes,
    method,
    methodLabel: METHOD_LABEL[method] ?? method,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentStatus: order.paymentStatus,
    statusLabel: FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus,
    paymentLabel: order.paymentStatus === "PENDING_VERIFICATION" ? "Payment proof received — being checked" : (PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus),
    cancelled,
    cancelReason: order.cancelReason,
    awaitingPayment,
    payTo,
    payDeadline: awaitingPayment && order.paymentStatus === "UNPAID" && Number.isFinite(placed) ? new Date(placed + s.manualTtlMinutes * 60_000).toISOString() : null,
    waitHours: Math.round(s.manualTtlMinutes / 60),
    eta: zone && !cancelled ? `${zone.etaMinDays}–${zone.etaMaxDays} working days after dispatch` : null,
    shipment: ship
      ? {
          courier: COURIER_LABEL[ship.courier] ?? ship.courier,
          cn: ship.cnNumber,
          bookedAt: ship.bookedAt,
        }
      : null,
    items: items.map((i) => ({
      name: `${i.productSnapshot.brand} ${i.productSnapshot.model}`,
      detail: `${i.productSnapshot.qualityGrade} · ${i.productSnapshot.color}${i.productSnapshot.variantLabel ? ` (${i.productSnapshot.variantLabel})` : ""}`,
      qty: i.quantity,
      unitPaisa: i.unitPricePaisa,
      linePaisa: i.lineTotalPaisa,
    })),
    subtotalPaisa: order.subtotalPaisa,
    discountPaisa: order.discountPaisa,
    shippingPaisa: order.shippingFeePaisa,
    codFeePaisa: order.codFeePaisa,
    totalPaisa: order.totalPaisa,
    contact: {
      whatsapp: s.whatsapp ? formatPkMobile(s.whatsapp) : null,
      phone: s.storePhone ? formatPkMobile(s.storePhone) : null,
      email: s.salesEmail,
    },
    storeName: s.storeName,
  };
}

/** Payment record (admin only). */
export const orderPayment = (db: DB | Tx, orderId: string) => db.select().from(payments).where(eq(payments.orderId, orderId)).get() ?? null;

const rs = (n: number) => formatMoney(paisa(n));

/**
 * The steps a prepaid customer follows (owner request v1.11): pay with the order number in the
 * remarks, then send the screenshot by WhatsApp / call / email; the shop confirms, then dispatches.
 */
export function paymentSteps(o: Pick<CustomerOrder, "code" | "totalPaisa" | "contact" | "waitHours" | "paymentStatus">): string[] {
  // v1.12 owner wording: payment slip + transaction ID + order number, by WhatsApp or email, within 24 hours
  const ways = [o.contact.whatsapp ? `WhatsApp ${o.contact.whatsapp}` : null, o.contact.email ? `email ${o.contact.email}` : null].filter((x): x is string => Boolean(x));
  const share = ways.length ? ways.join(" or ") : o.contact.phone ? `call ${o.contact.phone}` : "contact us";
  const questions = o.contact.phone ? `Questions? Call ${o.contact.phone} with your order number.` : null;
  if (o.paymentStatus === "PENDING_VERIFICATION") {
    return [
      "We have your payment details and are checking them with the bank / wallet.",
      "When the money is confirmed we email you a payment confirmation, then a dispatch email with the courier and tracking number.",
      ...(questions ? [questions] : []),
    ];
  }
  return [
    `Pay ${rs(o.totalPaisa)} into one of the accounts below.`,
    `Write your order number ${o.code} in the transfer’s remarks / description.`,
    `Within ${o.waitHours} hours, send us the payment slip (screenshot) and the transaction ID together with your order number ${o.code}: ${share}.`,
    "We confirm your payment by email, then dispatch the order and email you the courier and tracking number.",
    `If your payment details don’t reach us within ${o.waitHours} hours, the order is cancelled and the stock goes back on sale.`,
    ...(questions ? [questions] : []),
  ];
}

/** "Rs 250", or "Free (paid in advance)" for prepaid orders with the v1.12 free delivery. */
export const deliveryLabel = (o: Pick<CustomerOrder, "shippingPaisa" | "method">) =>
  o.shippingPaisa === 0 && o.method !== "COD" ? "Free (paid in advance)" : o.shippingPaisa === 0 ? "Free" : rs(o.shippingPaisa);
