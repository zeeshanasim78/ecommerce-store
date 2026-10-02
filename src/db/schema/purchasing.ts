import { sqliteTable, text, integer, real, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";
import { productVariants } from "./inventory";

/** Vendors and purchase orders — SPECIFICATION.md §4.5–4.6. */

export const VENDOR_CURRENCIES = ["PKR", "USD", "CNY", "AED"] as const;
export const PAYMENT_TERMS = ["ADVANCE", "NET_15", "NET_30"] as const;
export const PO_STATUSES = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"] as const;
export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export const vendors = sqliteTable(
  "vendors",
  {
    id: id(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    email: text("email"),
    city: text("city"),
    /** ISO 3166-1 alpha-2, e.g. 'PK', 'CN', 'AE' */
    country: text("country").default("PK").notNull(),
    currency: text("currency", { enum: VENDOR_CURRENCIES }).default("PKR").notNull(),
    paymentTerms: text("payment_terms", { enum: PAYMENT_TERMS }).default("ADVANCE").notNull(),
    leadTimeDays: integer("lead_time_days").default(7).notNull(),
    rating: integer("rating"),
    brandsSupplied: text("brands_supplied", { mode: "json" }).$type<string[]>().default(sql`'[]'`).notNull(),
    notes: text("notes"),
    archivedAt: text("archived_at"),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("vendors_currency", inList("currency", VENDOR_CURRENCIES)),
    check("vendors_payment_terms", inList("payment_terms", PAYMENT_TERMS)),
    check("vendors_rating", sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`),
    check("vendors_country", sql`length(${t.country}) = 2`),
  ],
);

export const purchaseOrders = sqliteTable(
  "purchase_orders",
  {
    id: id(),
    code: text("code").notNull().unique(), // PO-0007
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id),
    status: text("status", { enum: PO_STATUSES }).default("DRAFT").notNull(),
    orderedAt: text("ordered_at"),
    expectedAt: text("expected_at"),
    receivedAt: text("received_at"),
    currency: text("currency", { enum: VENDOR_CURRENCIES }).default("PKR").notNull(),
    /** PKR per 1 unit of `currency` at time of order; 1 for PKR */
    fxRateToPkr: real("fx_rate_to_pkr").default(1).notNull(),
    shippingCostPaisa: integer("shipping_cost_paisa").default(0).notNull(),
    customsDutyPaisa: integer("customs_duty_paisa").default(0).notNull(),
    otherLandedCostPaisa: integer("other_landed_cost_paisa").default(0).notNull(),
    notes: text("notes"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("purchase_orders_status", inList("status", PO_STATUSES)),
    check("purchase_orders_currency", inList("currency", VENDOR_CURRENCIES)),
    check("purchase_orders_fx_positive", sql`${t.fxRateToPkr} > 0`),
    check(
      "purchase_orders_costs_non_negative",
      sql`${t.shippingCostPaisa} >= 0 AND ${t.customsDutyPaisa} >= 0 AND ${t.otherLandedCostPaisa} >= 0`,
    ),
    index("purchase_orders_vendor_idx").on(t.vendorId),
  ],
);

export const purchaseOrderItems = sqliteTable(
  "purchase_order_items",
  {
    id: id(),
    poId: text("po_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id),
    qtyOrdered: integer("qty_ordered").notNull(),
    qtyReceived: integer("qty_received").default(0).notNull(),
    /** Unit cost in the PO currency's minor unit (paisa, cents, fen) */
    unitCostForeign: integer("unit_cost_foreign").notNull(),
    /** Filled on receipt: unit cost × fx + allocated landed costs */
    landedUnitCostPaisa: integer("landed_unit_cost_paisa"),
  },
  (t) => [
    check("po_items_qty", sql`${t.qtyOrdered} > 0 AND ${t.qtyReceived} >= 0 AND ${t.qtyReceived} <= ${t.qtyOrdered}`),
    check("po_items_cost_non_negative", sql`${t.unitCostForeign} >= 0`),
    index("po_items_po_idx").on(t.poId),
    index("po_items_variant_idx").on(t.variantId),
  ],
);
