import { sqliteTable, text, integer, real, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList } from "./_helpers";

/** Delivery zones — SPECIFICATION.md §4.13. Shipments live in orders.ts next to their order. */

export const COURIERS = ["LEOPARDS", "POSTEX", "TCS", "TRAX", "SELF"] as const;
export type Courier = (typeof COURIERS)[number];

export const SHIPMENT_STATUSES = [
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURN_IN_PROGRESS",
  "RETURNED_TO_ORIGIN",
  "CANCELLED",
] as const;

export const deliveryZones = sqliteTable(
  "delivery_zones",
  {
    id: id(),
    city: text("city").notNull().unique(),
    province: text("province").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    shippingFeePaisa: integer("shipping_fee_paisa").notNull(),
    codAvailable: integer("cod_available", { mode: "boolean" }).default(true).notNull(),
    codFeePaisa: integer("cod_fee_paisa").default(0).notNull(),
    etaMinDays: integer("eta_min_days").notNull(),
    etaMaxDays: integer("eta_max_days").notNull(),
    defaultCourier: text("default_courier", { enum: COURIERS }).default("LEOPARDS").notNull(),
    /** Pin position on the landing-page map, 0–100 (% of width / height). */
    mapX: real("map_x").notNull(),
    mapY: real("map_y").notNull(),
    isHub: integer("is_hub", { mode: "boolean" }).default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [
    check("delivery_zones_courier", inList("default_courier", COURIERS)),
    check("delivery_zones_eta", sql`${t.etaMinDays} >= 0 AND ${t.etaMaxDays} >= ${t.etaMinDays}`),
    check("delivery_zones_fees", sql`${t.shippingFeePaisa} >= 0 AND ${t.codFeePaisa} >= 0`),
  ],
);
