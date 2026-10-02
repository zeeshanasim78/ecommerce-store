import { sqliteTable, text, integer, index, check, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";
import { orders } from "./orders";

/**
 * Discount engine — SPECIFICATION.md §4.16 (v1.2).
 * Values: PERCENT in basis points (1500 = 15 %), FIXED in paisa (100 = Rs 1).
 * Times: ISO-8601 UTC text ("2026-10-02T09:00:00.000Z"); a window is [starts_at, ends_at).
 */

export const DISCOUNT_TYPES = ["PERCENT", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PROMOTION_SCOPES = ["ALL", "BRAND", "CATEGORY", "PRODUCT"] as const;
export type PromotionScope = (typeof PROMOTION_SCOPES)[number];

export const COUPON_USAGE = ["SINGLE_USE", "MULTI_USE"] as const;
export type CouponUsage = (typeof COUPON_USAGE)[number];

export const promotions = sqliteTable(
  "promotions",
  {
    id: id(),
    name: text("name").notNull(),
    /** Shown in the site-wide banner and as the card badge, e.g. "Eid sale: 10% off OLED screens" */
    bannerText: text("banner_text"),
    discountType: text("discount_type", { enum: DISCOUNT_TYPES }).notNull(),
    value: integer("value").notNull(),
    scope: text("scope", { enum: PROMOTION_SCOPES }).default("ALL").notNull(),
    /** Brand name, category id or product id, depending on scope; null for ALL */
    scopeValue: text("scope_value"),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    showBanner: integer("show_banner", { mode: "boolean" }).default(false).notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("promotions_type", inList("discount_type", DISCOUNT_TYPES)),
    check("promotions_scope", inList("scope", PROMOTION_SCOPES)),
    check("promotions_value", sql`${t.value} > 0 AND (${t.discountType} <> 'PERCENT' OR ${t.value} <= 9000)`),
    check("promotions_scope_value", sql`(${t.scope} = 'ALL') = (${t.scopeValue} IS NULL)`),
    check("promotions_window", sql`${t.endsAt} > ${t.startsAt}`),
    index("promotions_active_idx").on(t.isActive, t.startsAt, t.endsAt),
  ],
);

export const coupons = sqliteTable(
  "coupons",
  {
    id: id(),
    code: text("code").notNull().unique(),
    description: text("description"),
    discountType: text("discount_type", { enum: DISCOUNT_TYPES }).notNull(),
    value: integer("value").notNull(),
    minOrderPaisa: integer("min_order_paisa").default(0).notNull(),
    /** Cap for percentage coupons, in paisa; null = no cap */
    maxDiscountPaisa: integer("max_discount_paisa"),
    usage: text("usage", { enum: COUPON_USAGE }).default("MULTI_USE").notNull(),
    /** null = unlimited (MULTI_USE only); SINGLE_USE is always 1 */
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").default(0).notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    check("coupons_code_format", sql`${t.code} = upper(${t.code}) AND length(${t.code}) BETWEEN 3 AND 32 AND ${t.code} NOT GLOB '*[^A-Z0-9-]*'`),
    check("coupons_type", inList("discount_type", DISCOUNT_TYPES)),
    check("coupons_usage", inList("usage", COUPON_USAGE)),
    check("coupons_value", sql`${t.value} > 0 AND (${t.discountType} <> 'PERCENT' OR ${t.value} <= 9000)`),
    check("coupons_single_use", sql`${t.usage} <> 'SINGLE_USE' OR ${t.maxRedemptions} = 1`),
    check("coupons_redemptions", sql`${t.redemptionCount} >= 0 AND (${t.maxRedemptions} IS NULL OR ${t.redemptionCount} <= ${t.maxRedemptions})`),
    check("coupons_min_order", sql`${t.minOrderPaisa} >= 0`),
    check("coupons_window", sql`${t.endsAt} > ${t.startsAt}`),
  ],
);

export const couponRedemptions = sqliteTable(
  "coupon_redemptions",
  {
    id: id(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    customerPhone: text("customer_phone"),
    discountPaisa: integer("discount_paisa").notNull(),
    redeemedAt: timestamp("redeemed_at"),
  },
  (t) => [
    uniqueIndex("coupon_redemptions_coupon_order_unique").on(t.couponId, t.orderId),
    check("coupon_redemptions_discount_positive", sql`${t.discountPaisa} > 0`),
  ],
);
