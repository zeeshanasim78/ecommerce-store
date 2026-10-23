import { sqliteTable, text, integer, index, check, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";
import { customers } from "./customers";
import { orderItems, orders } from "./orders";
import { vendors } from "./purchasing";

/** Returns (RMA), warranty and vendor claims — SPECIFICATION.md §4.12. */

export const RETURN_REASONS = [
  "DEAD_ON_ARRIVAL",
  "TOUCH_FAULT",
  "LINES_ON_DISPLAY",
  "WRONG_ITEM",
  "DAMAGED_IN_TRANSIT",
  "CHANGE_OF_MIND",
] as const;
export const RETURN_STATUSES = ["REQUESTED", "RECEIVED", "INSPECTING", "APPROVED", "REJECTED", "CLOSED"] as const;
export const RETURN_RESOLUTIONS = ["REFUND", "REPLACEMENT", "STORE_CREDIT", "REJECTED"] as const;
export const ITEM_CONDITIONS = ["RESELLABLE", "DEFECTIVE", "PHYSICALLY_DAMAGED"] as const;
export const DISPOSITIONS = ["RESTOCK", "RETURN_TO_VENDOR", "WRITE_OFF"] as const;
export const VENDOR_CLAIM_STATUSES = ["OPEN", "SENT", "CREDITED", "REJECTED"] as const;
/** v1.16 (M11): how a refund was paid out (spec §28). */
export const REFUND_METHODS = ["CASH", "BANK_TRANSFER", "JAZZCASH", "EASYPAISA", "NAYAPAY", "OTHER"] as const;

export const returns = sqliteTable(
  "returns",
  {
    id: id(),
    code: text("code").notNull().unique(), // RMA-0012
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    reason: text("reason", { enum: RETURN_REASONS }).notNull(),
    status: text("status", { enum: RETURN_STATUSES }).default("REQUESTED").notNull(),
    resolution: text("resolution", { enum: RETURN_RESOLUTIONS }),
    withinWarranty: integer("within_warranty", { mode: "boolean" }).notNull(),
    inspectedBy: text("inspected_by").references(() => user.id),
    inspectionNotes: text("inspection_notes"),
    refundPaisa: integer("refund_paisa").default(0).notNull(),
    createdAt: timestamp("created_at"),
    closedAt: text("closed_at"),
    // ---- v1.16 (M11, spec §28) ----
    createdBy: text("created_by").references(() => user.id),
    /** What the customer said is wrong, in staff words. */
    description: text("description"),
    receivedAt: text("received_at"),
    decidedBy: text("decided_by").references(() => user.id),
    decidedAt: text("decided_at"),
    /** Why it was rejected, or why less than the full amount is refunded. */
    decisionNotes: text("decision_notes"),
    /** Outside warranty / return window but approved anyway — the reason staff gave. */
    overrideReason: text("override_reason"),
    /** The refund includes the delivery (and COD) charges paid on the order. */
    refundIncludesDelivery: integer("refund_includes_delivery", { mode: "boolean" }).default(false).notNull(),
    refundMethod: text("refund_method", { enum: REFUND_METHODS }),
    refundReference: text("refund_reference"),
    refundedAt: text("refunded_at"),
    refundedBy: text("refunded_by").references(() => user.id),
  },
  (t) => [
    check("returns_refund_method", sql`${t.refundMethod} IS NULL OR ${inList("refund_method", REFUND_METHODS)}`),
    check("returns_reason", inList("reason", RETURN_REASONS)),
    check("returns_status", inList("status", RETURN_STATUSES)),
    check("returns_resolution", sql`${t.resolution} IS NULL OR ${inList("resolution", RETURN_RESOLUTIONS)}`),
    check("returns_refund_non_negative", sql`${t.refundPaisa} >= 0`),
    index("returns_order_idx").on(t.orderId),
  ],
);

export const returnItems = sqliteTable(
  "return_items",
  {
    id: id(),
    returnId: text("return_id")
      .notNull()
      .references(() => returns.id, { onDelete: "cascade" }),
    orderItemId: text("order_item_id")
      .notNull()
      .references(() => orderItems.id),
    quantity: integer("quantity").notNull(),
    condition: text("condition", { enum: ITEM_CONDITIONS }),
    /** Stock only moves when a disposition is set (spec §4.12) */
    disposition: text("disposition", { enum: DISPOSITIONS }),
    // ---- v1.16 (M11) ----
    /** This item's share of the refund (price paid, after the order discount), fixed when the return is opened. */
    refundPaisa: integer("refund_paisa").default(0).notNull(),
    /** Supplier to claim from when the disposition is RETURN_TO_VENDOR. */
    vendorId: text("vendor_id").references(() => vendors.id),
  },
  (t) => [
    check("return_items_quantity_positive", sql`${t.quantity} > 0`),
    check("return_items_refund_non_negative", sql`${t.refundPaisa} >= 0`),
    check("return_items_condition", sql`${t.condition} IS NULL OR ${inList("condition", ITEM_CONDITIONS)}`),
    check("return_items_disposition", sql`${t.disposition} IS NULL OR ${inList("disposition", DISPOSITIONS)}`),
    index("return_items_return_idx").on(t.returnId),
  ],
);

export const vendorClaims = sqliteTable(
  "vendor_claims",
  {
    id: id(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id),
    returnItemId: text("return_item_id")
      .notNull()
      .references(() => returnItems.id),
    status: text("status", { enum: VENDOR_CLAIM_STATUSES }).default("OPEN").notNull(),
    creditPaisa: integer("credit_paisa").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at"),
    // ---- v1.16 (M11) ----
    /** What we paid for the returned units (unit cost × quantity). */
    claimPaisa: integer("claim_paisa").default(0).notNull(),
    /** The supplier's own RMA / credit note number. */
    reference: text("reference"),
    sentAt: text("sent_at"),
    resolvedAt: text("resolved_at"),
  },
  (t) => [
    check("vendor_claims_amounts", sql`${t.claimPaisa} >= 0 AND ${t.creditPaisa} >= 0`),
    uniqueIndex("vendor_claims_return_item_unique").on(t.returnItemId),
    check("vendor_claims_status", inList("status", VENDOR_CLAIM_STATUSES)),
    index("vendor_claims_vendor_idx").on(t.vendorId),
  ],
);
