import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { id, timestamp } from "./_helpers";
import { user } from "./auth";

/** Settings (key/value) and the admin audit log — SPECIFICATION.md §4.14. */

/** Known setting keys. Values are stored as JSON text. */
export type SettingKey =
  | "usd_pkr_rate"
  | "usd_rate_updated_at"
  | "store_name"
  | "store_phone"
  | "whatsapp"
  | "cod_max_order_paisa"
  | "unpaid_order_ttl_minutes"
  | "manual_tid_ttl_minutes"
  | "enabled_payment_methods"
  | "wallet_accounts"
  | "home_stats" // v1.3: figures for the "Caidea in numbers" band
  | "home_video" // v1.3: repair video shown on the home page
  | "bank_account" // v1.7 (unused since v1.8: bank details come from the environment file)
  | "payment_details_seen" // v1.9: fingerprint of the payment details the app last started with
  | "payment_details_alert" // v1.9: unacknowledged change to payment details
  | "email_daily_count" // v1.10: Gmail recipients sent today (free-tier limit)
  | "sales_email" // v1.11: where customers email payment screenshots; gets a copy of each order
  | "cod_pause_message" // v1.11: shown at checkout while cash on delivery is paused
  | "prepaid_free_delivery"; // v1.12: true = no delivery charge when the customer pays in advance

export const settings = sqliteTable("settings", {
  key: text("key").$type<SettingKey>().primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: timestamp("updated_at"),
  updatedBy: text("updated_by").references(() => user.id),
});

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: id(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    action: text("action").notNull(), // e.g. 'product.update'
    entity: text("entity").notNull(), // e.g. 'products'
    entityId: text("entity_id"),
    before: text("before", { mode: "json" }),
    after: text("after", { mode: "json" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("admin_audit_entity_idx").on(t.entity, t.entityId), index("admin_audit_actor_idx").on(t.actorId, t.createdAt)],
);
