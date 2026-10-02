import { and, desc, eq, gte, like, lt, or, sql, type SQL } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { orders, productVariants, products, purchaseOrders, stockLedger, user } from "@/db/schema";
import { STOCK_TRANSACTION_TYPES, type StockTransactionType } from "@/db/schema/inventory";

/** Stock ledger page and CSV export — SPECIFICATION.md §7 (read-only, filterable). */

export const MOVEMENT_LABEL: Record<StockTransactionType, string> = {
  INBOUND_PO: "Purchase order received",
  STORE_SALE: "Online sale",
  COUNTER_POS: "Counter sale",
  REPAIR_RETURN: "Customer return restocked",
  MANUAL_ADJUST: "Manual adjustment",
  ORDER_CANCEL_RESTOCK: "Cancelled order restocked",
  RETURN_TO_VENDOR: "Returned to vendor",
  DAMAGED_WRITE_OFF: "Damaged — written off",
  OPENING_BALANCE: "Opening stock",
};

export type LedgerFilters = {
  /** Searches model, brand, product SKU and variant SKU. */
  q?: string;
  type?: StockTransactionType;
  operatorId?: string;
  /** Reference id or human code (PO-0007, CA-ORD-…). */
  reference?: string;
  /** Karachi calendar dates, YYYY-MM-DD, inclusive. */
  from?: string;
  to?: string;
  variantId?: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads filters from URL search params, dropping anything malformed. */
export function parseLedgerFilters(sp: Record<string, string | string[] | undefined>): LedgerFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const type = one("type");
  return {
    q: one("q")?.slice(0, 60),
    type: type && (STOCK_TRANSACTION_TYPES as readonly string[]).includes(type) ? (type as StockTransactionType) : undefined,
    operatorId: one("operator")?.slice(0, 64),
    reference: one("ref")?.slice(0, 64),
    from: one("from") && DATE.test(one("from")!) ? one("from") : undefined,
    to: one("to") && DATE.test(one("to")!) ? one("to") : undefined,
    variantId: one("variant")?.slice(0, 64),
  };
}

/** Karachi date → UTC timestamp string comparable with SQLite CURRENT_TIMESTAMP ("YYYY-MM-DD HH:MM:SS"). */
function karachiDayStartUtc(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00+05:00`)).toISOString().replace("T", " ").slice(0, 19);
}
function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

function where(f: LedgerFilters): SQL | undefined {
  const parts: (SQL | undefined)[] = [
    f.type ? eq(stockLedger.transactionType, f.type) : undefined,
    f.operatorId ? eq(stockLedger.operatorId, f.operatorId) : undefined,
    f.variantId ? eq(stockLedger.variantId, f.variantId) : undefined,
    f.reference ? or(eq(stockLedger.referenceId, f.reference), eq(purchaseOrders.code, f.reference.toUpperCase()), eq(orders.code, f.reference.toUpperCase())) : undefined,
    f.from ? gte(stockLedger.timestamp, karachiDayStartUtc(f.from)) : undefined,
    f.to ? lt(stockLedger.timestamp, karachiDayStartUtc(nextDay(f.to))) : undefined,
    f.q
      ? or(
          like(products.model, `%${f.q}%`),
          like(products.brand, `%${f.q}%`),
          like(products.sku, `%${f.q}%`),
          like(productVariants.variantSku, `%${f.q}%`),
        )
      : undefined,
  ];
  return and(...parts);
}

function baseQuery(db: DB) {
  return db
    .select({
      id: stockLedger.id,
      timestamp: stockLedger.timestamp,
      type: stockLedger.transactionType,
      quantity: stockLedger.quantityChanged,
      previousStock: stockLedger.previousStock,
      newStock: stockLedger.newStock,
      referenceType: stockLedger.referenceType,
      referenceId: stockLedger.referenceId,
      unitCostPaisa: stockLedger.unitCostPaisa,
      notes: stockLedger.notes,
      operatorId: stockLedger.operatorId,
      operatorName: user.name,
      variantId: productVariants.id,
      variantSku: productVariants.variantSku,
      color: productVariants.color,
      variantLabel: productVariants.variantLabel,
      productId: products.id,
      brand: products.brand,
      model: products.model,
      grade: products.qualityGrade,
      poCode: purchaseOrders.code,
      orderCode: orders.code,
    })
    .from(stockLedger)
    .innerJoin(productVariants, eq(productVariants.id, stockLedger.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(user, eq(user.id, stockLedger.operatorId))
    .leftJoin(purchaseOrders, and(eq(stockLedger.referenceType, "PO"), eq(purchaseOrders.id, stockLedger.referenceId)))
    .leftJoin(orders, and(eq(stockLedger.referenceType, "ORDER"), eq(orders.id, stockLedger.referenceId)));
}

export type LedgerRow = Awaited<ReturnType<ReturnType<typeof baseQuery>["all"]>>[number];

/** Newest first. rowid breaks ties between rows written in the same second. */
export function listLedger(db: DB, f: LedgerFilters, page: { limit: number; offset: number }): LedgerRow[] {
  return baseQuery(db)
    .where(where(f))
    .orderBy(desc(stockLedger.timestamp), desc(sql`${stockLedger}.rowid`))
    .limit(page.limit)
    .offset(page.offset)
    .all();
}

export function countLedger(db: DB, f: LedgerFilters): number {
  return (
    db
      .select({ n: sql<number>`count(*)` })
      .from(stockLedger)
      .innerJoin(productVariants, eq(productVariants.id, stockLedger.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(purchaseOrders, and(eq(stockLedger.referenceType, "PO"), eq(purchaseOrders.id, stockLedger.referenceId)))
      .leftJoin(orders, and(eq(stockLedger.referenceType, "ORDER"), eq(orders.id, stockLedger.referenceId)))
      .where(where(f))
      .get()?.n ?? 0
  );
}

/** Human reference shown for a row: PO code, order code, or the raw id. */
export function referenceLabel(r: Pick<LedgerRow, "referenceType" | "referenceId" | "poCode" | "orderCode">): string {
  return r.poCode ?? r.orderCode ?? r.referenceId ?? (r.referenceType === "COUNT" ? "Stock count" : "—");
}
