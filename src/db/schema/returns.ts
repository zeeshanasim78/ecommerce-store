import { sqliteTable, text, integer, index, check } from "drizzle-orm/sqlite-core";
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
  },
  (t) => [
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
  },
  (t) => [
    check("return_items_quantity_positive", sql`${t.quantity} > 0`),
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
  },
  (t) => [
    check("vendor_claims_status", inList("status", VENDOR_CLAIM_STATUSES)),
    index("vendor_claims_vendor_idx").on(t.vendorId),
  ],
);
