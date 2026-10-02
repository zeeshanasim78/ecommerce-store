import { sqliteTable, text, integer, index, check, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";
import { deliveryZones } from "./logistics";

/** Customers and addresses — SPECIFICATION.md §4.3–4.4 (guest checkout + optional accounts, Clarify Q7 default). */

export const CUSTOMER_TYPES = ["RETAIL", "TECHNICIAN"] as const;
export const TECHNICIAN_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const customers = sqliteTable(
  "customers",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** E.164, e.g. +923001234567 */
    phone: text("phone").notNull().unique(),
    email: text("email"),
    customerType: text("customer_type", { enum: CUSTOMER_TYPES }).default("RETAIL").notNull(),
    technicianStatus: text("technician_status", { enum: TECHNICIAN_STATUSES }),
    shopName: text("shop_name"),
    city: text("city"),
    notes: text("notes"),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("customers_type", inList("customer_type", CUSTOMER_TYPES)),
    check("customers_technician_status", sql`${t.technicianStatus} IS NULL OR ${inList("technician_status", TECHNICIAN_STATUSES)}`),
    check("customers_phone_e164", sql`${t.phone} GLOB '+92[0-9]*' AND length(${t.phone}) = 13`),
    uniqueIndex("customers_user_idx").on(t.userId),
  ],
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: id(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    area: text("area"),
    cityId: text("city_id")
      .notNull()
      .references(() => deliveryZones.id),
    postalCode: text("postal_code"),
    phone: text("phone").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);
