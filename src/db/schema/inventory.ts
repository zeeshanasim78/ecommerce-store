import { sqliteTable, text, integer, real, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { inList } from "./_helpers";

/**
 * Inventory core — SPECIFICATION.md §4.1.
 * Every blueprint column below is unchanged from the brief. Additive amendments
 * (A-1 … A-5) are appended under clearly marked comments; A-6 (triggers) lives in a
 * custom SQL migration in /drizzle because Drizzle cannot express triggers.
 */

export const STOCK_TRANSACTION_TYPES = [
  // Blueprint values
  "INBOUND_PO",
  "STORE_SALE",
  "COUNTER_POS",
  "REPAIR_RETURN",
  "MANUAL_ADJUST",
  // Amendment A-3
  "ORDER_CANCEL_RESTOCK",
  "RETURN_TO_VENDOR",
  "DAMAGED_WRITE_OFF",
  "OPENING_BALANCE",
] as const;
export type StockTransactionType = (typeof STOCK_TRANSACTION_TYPES)[number];

export const STOCK_REFERENCE_TYPES = ["ORDER", "PO", "RETURN", "ADJUSTMENT", "COUNT"] as const;
export type StockReferenceType = (typeof STOCK_REFERENCE_TYPES)[number];

// 1. Core Product Table
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    brand: text("brand").notNull(), // e.g., 'Samsung', 'Apple', 'Xiaomi'
    model: text("model").notNull(), // e.g., 'Galaxy S23 Ultra', 'iPhone 14 Pro Max'
    displayType: text("display_type").notNull(), // e.g., 'AMOLED', 'OLED', 'IPS LCD'
    qualityGrade: text("quality_grade").notNull(), // e.g., 'OEM Original', 'Compatible Grade AAA+'
    sku: text("sku").unique().notNull(),
    costPrice: real("cost_price").notNull(), // Sourced cost basis
    retailPricePKR: real("retail_price_pkr").notNull(),
    wholesalePricePKR: real("wholesale_price_pkr").notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),

    // --- Amendment A-1 ---
    slug: text("slug").unique().notNull(),
    description: text("description"),
    compatibility: text("compatibility", { mode: "json" }).$type<string[]>().default(sql`'[]'`).notNull(),
    warrantyDays: integer("warranty_days").default(7).notNull(),
    isPublished: integer("is_published", { mode: "boolean" }).default(false).notNull(),
    archivedAt: text("archived_at"),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),

    // --- Amendment A-7 (v1.2, SPECIFICATION §4.16) ---
    /** categories.id — integrity enforced by triggers in migration 0003 (adding a real FK would rebuild this table) */
    categoryId: text("category_id"),
    featureTags: text("feature_tags", { mode: "json" }).$type<string[]>().default(sql`'[]'`).notNull(),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false).notNull(),
    isFeaturedHero: integer("is_featured_hero", { mode: "boolean" }).default(false).notNull(),
    /** Product-level sale price in rupees (blueprint convention); null = no sale */
    salePricePKR: real("sale_price_pkr"),
    saleStartsAt: text("sale_starts_at"),
    saleEndsAt: text("sale_ends_at"),
  },
  (t) => [
    // --- Amendment A-5 ---
    index("products_brand_model_idx").on(t.brand, t.model),
    index("products_category_idx").on(t.categoryId),
    check("products_prices_non_negative", sql`${t.costPrice} >= 0 AND ${t.retailPricePKR} >= 0 AND ${t.wholesalePricePKR} >= 0`),
    check("products_low_stock_threshold_non_negative", sql`${t.lowStockThreshold} >= 0`),
  ],
);

// 2. Product Variant / Real-time Stock Inventory Table
export const productVariants = sqliteTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    color: text("color").notNull(), // e.g., 'Phantom Black', 'Deep Purple'
    currentStock: integer("current_stock").default(0).notNull(),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),

    // --- Amendment A-2 ---
    variantSku: text("variant_sku").unique().notNull(),
    variantLabel: text("variant_label"), // e.g. 'With Frame'
    binLocation: text("bin_location"), // shelf code, e.g. 'A3-04'
    archivedAt: text("archived_at"),
  },
  (t) => [
    check("product_variants_stock_non_negative", sql`${t.currentStock} >= 0`),
    // --- Amendment A-5 ---
    index("product_variants_product_idx").on(t.productId),
  ],
);

// 3. Complete Stock Ledger Table (Audit Trail)
export const stockLedger = sqliteTable(
  "stock_ledger",
  {
    id: text("id").primaryKey(),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "cascade" }).notNull(),
    transactionType: text("transaction_type", { enum: STOCK_TRANSACTION_TYPES }).notNull(), // 'INBOUND_PO', 'STORE_SALE', 'COUNTER_POS', 'REPAIR_RETURN', 'MANUAL_ADJUST'
    quantityChanged: integer("quantity_changed").notNull(), // Positive values for additions, negative for sales/reductions
    previousStock: integer("previous_stock").notNull(),
    newStock: integer("new_stock").notNull(),
    referenceId: text("reference_id"), // Connects to Order ID, Purchase Order ID, or Return ID
    operatorId: text("operator_id").notNull(), // Tracks the admin user executing the shift change
    notes: text("notes"),
    timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`).notNull(),

    // --- Amendment A-4 ---
    referenceType: text("reference_type", { enum: STOCK_REFERENCE_TYPES }),
    unitCostPaisa: integer("unit_cost_paisa"),
  },
  (t) => [
    check("stock_ledger_transaction_type", inList("transaction_type", STOCK_TRANSACTION_TYPES)),
    check("stock_ledger_reference_type", sql`${t.referenceType} IS NULL OR ${inList("reference_type", STOCK_REFERENCE_TYPES)}`),
    check("stock_ledger_quantity_non_zero", sql`${t.quantityChanged} <> 0`),
    check("stock_ledger_arithmetic", sql`${t.previousStock} + ${t.quantityChanged} = ${t.newStock}`),
    check("stock_ledger_new_stock_non_negative", sql`${t.newStock} >= 0`),
    // --- Amendment A-5 ---
    index("stock_ledger_variant_time_idx").on(t.variantId, t.timestamp),
    index("stock_ledger_reference_idx").on(t.referenceId),
  ],
);
