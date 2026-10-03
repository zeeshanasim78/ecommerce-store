import { sqliteTable, text, integer, real, index, check, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";
import { customers } from "./customers";
import { productVariants } from "./inventory";
import { COURIERS, SHIPMENT_STATUSES, deliveryZones } from "./logistics";

/** Orders (online + counter), items, payments, webhooks, shipments — SPECIFICATION.md §4.7–4.11. */

export const ORDER_CHANNELS = ["ONLINE", "COUNTER"] as const;
export const PRICE_TIERS = ["RETAIL", "WHOLESALE"] as const;
export const PAYMENT_METHODS = [
  "COD",
  "JAZZCASH",
  "EASYPAISA",
  "NAYAPAY",
  "AGGREGATOR",
  "CARD_STRIPE",
  "BANK_TRANSFER",
  "CASH",
  "POS_CARD",
] as const;
export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING_VERIFICATION",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "COD_PENDING",
  "COD_COLLECTED",
  "COD_REMITTED",
] as const;
export const FULFILLMENT_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PACKED",
  "BOOKED",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNED_TO_ORIGIN",
  "CANCELLED",
] as const;
export const PAYMENT_PROVIDERS = ["STRIPE", "JAZZCASH", "EASYPAISA", "NAYAPAY", "AGGREGATOR", "MANUAL", "CASH"] as const;
export const PAYMENT_RECORD_STATUSES = ["INITIATED", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export const DISPLAY_CURRENCIES = ["PKR", "USD"] as const;

export type ShippingAddressSnapshot = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  area?: string;
  city: string;
  postalCode?: string;
};

export type ProductSnapshot = {
  brand: string;
  model: string;
  displayType: string;
  qualityGrade: string;
  color: string;
  variantLabel?: string | null;
  sku: string;
};

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    code: text("code").notNull().unique(), // CA-ORD-261002-0042
    channel: text("channel", { enum: ORDER_CHANNELS }).notNull(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    guestName: text("guest_name"),
    guestPhone: text("guest_phone"),
    guestEmail: text("guest_email"),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<ShippingAddressSnapshot>(),
    cityId: text("city_id").references(() => deliveryZones.id),
    priceTier: text("price_tier", { enum: PRICE_TIERS }).default("RETAIL").notNull(),
    subtotalPaisa: integer("subtotal_paisa").notNull(),
    discountPaisa: integer("discount_paisa").default(0).notNull(),
    shippingFeePaisa: integer("shipping_fee_paisa").default(0).notNull(),
    codFeePaisa: integer("cod_fee_paisa").default(0).notNull(),
    totalPaisa: integer("total_paisa").notNull(),
    displayCurrency: text("display_currency", { enum: DISPLAY_CURRENCIES }).default("PKR").notNull(),
    fxRateUsed: real("fx_rate_used"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).default("UNPAID").notNull(),
    fulfillmentStatus: text("fulfillment_status", { enum: FULFILLMENT_STATUSES }).default("NEW").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    placedAt: timestamp("placed_at"),
    paidAt: text("paid_at"),
    cancelledAt: text("cancelled_at"),
    cancelReason: text("cancel_reason"),
    createdBy: text("created_by").references(() => user.id),
    notes: text("notes"),
  },
  (t) => [
    check("orders_channel", inList("channel", ORDER_CHANNELS)),
    check("orders_price_tier", inList("price_tier", PRICE_TIERS)),
    check("orders_payment_method", inList("payment_method", PAYMENT_METHODS)),
    check("orders_payment_status", inList("payment_status", PAYMENT_STATUSES)),
    check("orders_fulfillment_status", inList("fulfillment_status", FULFILLMENT_STATUSES)),
    check("orders_display_currency", inList("display_currency", DISPLAY_CURRENCIES)),
    check(
      "orders_total_arithmetic",
      sql`${t.totalPaisa} = ${t.subtotalPaisa} - ${t.discountPaisa} + ${t.shippingFeePaisa} + ${t.codFeePaisa}`,
    ),
    check("orders_amounts_non_negative", sql`${t.subtotalPaisa} >= 0 AND ${t.discountPaisa} >= 0 AND ${t.totalPaisa} >= 0`),
    // Online orders need a contact; counter sales may be anonymous walk-ins
    check("orders_online_contact", sql`${t.channel} = 'COUNTER' OR ${t.customerId} IS NOT NULL OR ${t.guestPhone} IS NOT NULL`),
    index("orders_status_idx").on(t.fulfillmentStatus, t.paymentStatus),
    index("orders_placed_idx").on(t.placedAt),
    index("orders_customer_idx").on(t.customerId),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id),
    productSnapshot: text("product_snapshot", { mode: "json" }).$type<ProductSnapshot>().notNull(),
    quantity: integer("quantity").notNull(),
    unitPricePaisa: integer("unit_price_paisa").notNull(),
    unitCostPaisa: integer("unit_cost_paisa").notNull(),
    lineTotalPaisa: integer("line_total_paisa").notNull(),
    warrantyUntil: text("warranty_until"),
  },
  (t) => [
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
    check("order_items_line_total", sql`${t.lineTotalPaisa} = ${t.quantity} * ${t.unitPricePaisa}`),
    index("order_items_order_idx").on(t.orderId),
    index("order_items_variant_idx").on(t.variantId),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    provider: text("provider", { enum: PAYMENT_PROVIDERS }).notNull(),
    /** Gateway transaction ID, or the wallet TID for manual payments once verified */
    providerRef: text("provider_ref"),
    /** Transaction ID typed by the customer at checkout (manual wallet payments) */
    manualReference: text("manual_reference"),
    payerMsisdn: text("payer_msisdn"),
    amountPaisa: integer("amount_paisa").notNull(),
    currency: text("currency", { enum: DISPLAY_CURRENCIES }).default("PKR").notNull(),
    fxRateUsed: real("fx_rate_used"),
    status: text("status", { enum: PAYMENT_RECORD_STATUSES }).default("INITIATED").notNull(),
    verifiedBy: text("verified_by").references(() => user.id),
    verifiedAt: text("verified_at"),
    rawResponseHash: text("raw_response_hash"),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("payments_provider", inList("provider", PAYMENT_PROVIDERS)),
    check("payments_status", inList("status", PAYMENT_RECORD_STATUSES)),
    check("payments_amount_positive", sql`${t.amountPaisa} > 0`),
    // The same transaction ID can never be claimed by two orders (spec §4.9)
    uniqueIndex("payments_provider_ref_unique").on(t.provider, t.providerRef),
    uniqueIndex("payments_manual_reference_unique").on(t.provider, t.manualReference),
    index("payments_order_idx").on(t.orderId),
  ],
);

/**
 * v1.11 — private links to an order's full details and PDF (spec §23). Only a SHA-256 hash of the
 * random token is stored; the token itself lives in the customer's browser cookie and email link.
 */
export const orderAccessTokens = sqliteTable(
  "order_access_tokens",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("order_access_tokens_order_idx").on(t.orderId)],
);

/** v1.11 — every customer email about an order (spec §23): what was sent, to whom, and whether it left. */
export const EMAIL_KINDS = ["ORDER_PLACED", "SALES_COPY", "PAYMENT_CONFIRMED", "DISPATCHED", "CANCELLED"] as const;
export const EMAIL_STATUSES = ["SENT", "FAILED", "SKIPPED"] as const;
export const emailLog = sqliteTable(
  "email_log",
  {
    id: id(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: EMAIL_KINDS }).notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    status: text("status", { enum: EMAIL_STATUSES }).notNull(),
    detail: text("detail"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("email_log_kind", inList("kind", EMAIL_KINDS)),
    check("email_log_status", inList("status", EMAIL_STATUSES)),
    index("email_log_order_idx").on(t.orderId),
    index("email_log_recipient_idx").on(t.recipient, t.createdAt),
  ],
);

export const webhookEvents = sqliteTable(
  "webhook_events",
  {
    id: id(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    receivedAt: timestamp("received_at"),
    processedAt: text("processed_at"),
    status: text("status", { enum: ["RECEIVED", "PROCESSED", "IGNORED", "FAILED"] }).default("RECEIVED").notNull(),
    payloadSha256: text("payload_sha256").notNull(),
  },
  (t) => [
    uniqueIndex("webhook_events_provider_event_unique").on(t.provider, t.eventId),
    check("webhook_events_status", inList("status", ["RECEIVED", "PROCESSED", "IGNORED", "FAILED"])),
  ],
);

export const shipments = sqliteTable(
  "shipments",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    courier: text("courier", { enum: COURIERS }).notNull(),
    serviceType: text("service_type"),
    /** Consignment number from the courier; entered manually until API keys arrive */
    cnNumber: text("cn_number"),
    labelUrl: text("label_url"),
    weightGrams: integer("weight_grams"),
    codAmountPaisa: integer("cod_amount_paisa").default(0).notNull(),
    status: text("status", { enum: SHIPMENT_STATUSES }).default("BOOKED").notNull(),
    lastTrackingEvent: text("last_tracking_event"),
    bookedAt: timestamp("booked_at"),
    deliveredAt: text("delivered_at"),
    rtoAt: text("rto_at"),
    loadsheetId: text("loadsheet_id"),
    createdBy: text("created_by").references(() => user.id),
  },
  (t) => [
    check("shipments_courier", inList("courier", COURIERS)),
    check("shipments_status", inList("status", SHIPMENT_STATUSES)),
    check("shipments_cod_non_negative", sql`${t.codAmountPaisa} >= 0`),
    uniqueIndex("shipments_courier_cn_unique").on(t.courier, t.cnNumber),
    index("shipments_order_idx").on(t.orderId),
  ],
);
