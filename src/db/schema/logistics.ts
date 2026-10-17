import { sqliteTable, text, integer, real, check, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";

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

// ---- v1.15 — Milestone 10 Phase B (SPECIFICATION §27) -----------------------------------------

/** Couriers with an API adapter. TCS / Trax / own rider stay manual (CN pasted by staff). */
export const API_COURIERS = ["LEOPARDS", "POSTEX"] as const;
export type ApiCourier = (typeof API_COURIERS)[number];
export const BOOKING_SOURCES = ["MANUAL", "API"] as const;

/** Our delivery city → the courier's own city code / name (Leopards uses ids, PostEx names). */
export const courierCities = sqliteTable(
  "courier_cities",
  {
    id: id(),
    courier: text("courier", { enum: API_COURIERS }).notNull(),
    cityId: text("city_id")
      .notNull()
      .references(() => deliveryZones.id, { onDelete: "cascade" }),
    courierCityCode: text("courier_city_code").notNull(),
    courierCityName: text("courier_city_name").notNull(),
    /** AUTO = matched by name from the courier's list; MANUAL = picked by staff. */
    source: text("source", { enum: ["AUTO", "MANUAL"] }).default("AUTO").notNull(),
    updatedAt: timestamp("updated_at"),
    updatedBy: text("updated_by").references(() => user.id),
  },
  (t) => [
    check("courier_cities_courier", inList("courier", API_COURIERS)),
    check("courier_cities_source", inList("source", ["AUTO", "MANUAL"])),
    uniqueIndex("courier_cities_unique").on(t.courier, t.cityId),
  ],
);

/** A load sheet: the parcels handed to one courier's rider in one pickup. */
export const loadSheets = sqliteTable(
  "load_sheets",
  {
    id: id(),
    code: text("code").notNull().unique(), // LS-261017-01
    courier: text("courier", { enum: COURIERS }).notNull(),
    /** The courier's own load-sheet reference, when made through its API. */
    courierRef: text("courier_ref"),
    parcels: integer("parcels").notNull(),
    codTotalPaisa: integer("cod_total_paisa").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at"),
  },
  (t) => [check("load_sheets_courier", inList("courier", COURIERS)), check("load_sheets_counts", sql`${t.parcels} >= 1 AND ${t.codTotalPaisa} >= 0`)],
);

export const REMITTANCE_STATUSES = ["DRAFT", "CONFIRMED", "DISCARDED"] as const;
/** One courier payment report (CSV) uploaded by staff. Lines are matched to shipments by CN. */
export const codRemittances = sqliteTable(
  "cod_remittances",
  {
    id: id(),
    code: text("code").notNull().unique(), // COD-0001
    courier: text("courier", { enum: COURIERS }).notNull(),
    /** The courier's payment reference (e.g. PostEx CPR number, bank transfer ID). */
    reference: text("reference"),
    fileName: text("file_name").notNull(),
    /** SHA-256 of the uploaded file — the same report can't be applied twice. */
    fileSha256: text("file_sha256").notNull(),
    status: text("status", { enum: REMITTANCE_STATUSES }).default("DRAFT").notNull(),
    rows: integer("rows").notNull(),
    /** Sum of the amounts actually marked remitted when confirmed. */
    appliedPaisa: integer("applied_paisa").default(0).notNull(),
    appliedCount: integer("applied_count").default(0).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at"),
    confirmedBy: text("confirmed_by").references(() => user.id),
    confirmedAt: text("confirmed_at"),
  },
  (t) => [
    check("cod_remittances_courier", inList("courier", COURIERS)),
    check("cod_remittances_status", inList("status", REMITTANCE_STATUSES)),
    uniqueIndex("cod_remittances_file_unique").on(t.courier, t.fileSha256),
  ],
);

export const REMITTANCE_RESULTS = ["MATCH", "AMOUNT_DIFFERS", "UNKNOWN_CN", "NOT_DELIVERED", "ALREADY_REMITTED", "NOT_COD", "DUPLICATE_ROW"] as const;
export type RemittanceResult = (typeof REMITTANCE_RESULTS)[number];
export const codRemittanceLines = sqliteTable(
  "cod_remittance_lines",
  {
    id: id(),
    remittanceId: text("remittance_id")
      .notNull()
      .references(() => codRemittances.id, { onDelete: "cascade" }),
    rowNo: integer("row_no").notNull(),
    cn: text("cn").notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    /** Set when the CN matched one of our shipments (no FK: shipments reference remittances). */
    shipmentId: text("shipment_id"),
    orderId: text("order_id"),
    expectedPaisa: integer("expected_paisa"),
    result: text("result", { enum: REMITTANCE_RESULTS }).notNull(),
    applied: integer("applied", { mode: "boolean" }).default(false).notNull(),
    note: text("note"),
  },
  (t) => [
    check("cod_remittance_lines_result", inList("result", REMITTANCE_RESULTS)),
    check("cod_remittance_lines_amount", sql`${t.amountPaisa} >= 0`),
    index("cod_remittance_lines_remittance_idx").on(t.remittanceId),
  ],
);
