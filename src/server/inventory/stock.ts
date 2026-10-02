import { and, eq, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import {
  productVariants,
  stockLedger,
  type StockReferenceType,
  type StockTransactionType,
} from "@/db/schema/inventory";

/**
 * The stock engine — SPECIFICATION.md §6.1, §6.5 and Constitution rule §0.4.1.
 *
 * `applyStockMovement` is the ONLY code allowed to change `product_variants.current_stock`.
 * Checkout, counter sales, purchase-order receiving, returns, cancellations and stock counts
 * all call it inside their own transaction, so the stock change and the business record
 * (order, PO, return …) succeed or fail together.
 *
 * Deliberately free of `server-only` / Next.js imports so CLI scripts (seed) and tests use
 * exactly the same code as the app.
 */

/** Which direction each movement type may move stock. MANUAL_ADJUST may go either way. */
const DIRECTION: Record<StockTransactionType, "IN" | "OUT" | "EITHER"> = {
  INBOUND_PO: "IN",
  STORE_SALE: "OUT",
  COUNTER_POS: "OUT",
  REPAIR_RETURN: "IN",
  MANUAL_ADJUST: "EITHER",
  ORDER_CANCEL_RESTOCK: "IN",
  RETURN_TO_VENDOR: "OUT",
  DAMAGED_WRITE_OFF: "OUT",
  OPENING_BALANCE: "IN",
};

/** Reference type used when the caller doesn't give one (amendment A-4). */
const DEFAULT_REFERENCE_TYPE: Record<StockTransactionType, StockReferenceType> = {
  INBOUND_PO: "PO",
  STORE_SALE: "ORDER",
  COUNTER_POS: "ORDER",
  REPAIR_RETURN: "RETURN",
  MANUAL_ADJUST: "ADJUSTMENT",
  ORDER_CANCEL_RESTOCK: "ORDER",
  RETURN_TO_VENDOR: "RETURN",
  DAMAGED_WRITE_OFF: "ADJUSTMENT",
  OPENING_BALANCE: "COUNT",
};

export type StockMovement = {
  variantId: string;
  /** Units added (positive) or removed (negative). Whole number, never 0. */
  delta: number;
  type: StockTransactionType;
  /** Defaults from `type` (e.g. STORE_SALE → ORDER). */
  referenceType?: StockReferenceType;
  /** Order / PO / return id this movement belongs to. */
  referenceId?: string | null;
  /** Staff user id, or SYSTEM_USER_ID for automated movements. */
  operatorId: string;
  /** Cost of one unit at the moment of the movement, in paisa (for COGS and valuation). */
  unitCostPaisa?: number | null;
  /** Required for MANUAL_ADJUST (spec §6.5). */
  notes?: string | null;
};

export type StockMovementResult = {
  ledgerId: string;
  variantId: string;
  previousStock: number;
  newStock: number;
};

/** The variant doesn't have enough units — the whole transaction must roll back. */
export class InsufficientStockError extends Error {
  readonly code = "INSUFFICIENT_STOCK";
  constructor(
    readonly variantId: string,
    readonly requested: number,
    readonly available: number,
  ) {
    super(`Insufficient stock for variant ${variantId}: asked for ${requested}, only ${available} available`);
    this.name = "InsufficientStockError";
  }
}

/** No variant with this id exists. */
export class VariantNotFoundError extends Error {
  readonly code = "VARIANT_NOT_FOUND";
  constructor(readonly variantId: string) {
    super(`Variant ${variantId} does not exist`);
    this.name = "VariantNotFoundError";
  }
}

/** The movement itself is malformed (programming error — not a shopper-facing message). */
export class InvalidStockMovementError extends Error {
  readonly code = "INVALID_STOCK_MOVEMENT";
  constructor(message: string) {
    super(message);
    this.name = "InvalidStockMovementError";
  }
}

function validate(m: StockMovement): void {
  if (!m.variantId) throw new InvalidStockMovementError("variantId is required");
  if (!m.operatorId) throw new InvalidStockMovementError("operatorId is required");
  if (!Number.isSafeInteger(m.delta) || m.delta === 0) {
    throw new InvalidStockMovementError(`delta must be a whole number other than 0 (got ${m.delta})`);
  }
  const direction = DIRECTION[m.type];
  if (!direction) throw new InvalidStockMovementError(`Unknown movement type ${String(m.type)}`);
  if (direction === "IN" && m.delta < 0) throw new InvalidStockMovementError(`${m.type} must add stock (delta > 0)`);
  if (direction === "OUT" && m.delta > 0) throw new InvalidStockMovementError(`${m.type} must remove stock (delta < 0)`);
  if (m.type === "MANUAL_ADJUST" && !m.notes?.trim()) {
    throw new InvalidStockMovementError("MANUAL_ADJUST needs notes explaining the correction");
  }
  if (m.unitCostPaisa != null && (!Number.isSafeInteger(m.unitCostPaisa) || m.unitCostPaisa < 0)) {
    throw new InvalidStockMovementError("unitCostPaisa must be a whole number of paisa, 0 or more");
  }
}

/**
 * Refuses to run outside a transaction: without one, a failure on a later line of an order
 * would leave earlier lines' stock already removed.
 */
function assertInTransaction(tx: Tx): void {
  const client = (tx as unknown as { session?: { client?: { inTransaction?: boolean } } }).session?.client;
  if (client && client.inTransaction === false) {
    throw new InvalidStockMovementError("applyStockMovement must run inside a transaction (use withStockTransaction)");
  }
}

/**
 * Moves stock for one variant and appends the matching ledger row (spec §6.1).
 * Must be called inside a transaction; synchronous on purpose (better-sqlite3).
 *
 * Step 1 is a single conditional UPDATE, so "is there enough?" and "take it" happen in one
 * atomic statement — there is no read-then-write gap for another sale to slip into.
 */
export function applyStockMovement(tx: Tx, m: StockMovement): StockMovementResult {
  validate(m);
  assertInTransaction(tx);

  const [row] = tx
    .update(productVariants)
    .set({
      currentStock: sql`${productVariants.currentStock} + ${m.delta}`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(and(eq(productVariants.id, m.variantId), sql`${productVariants.currentStock} + ${m.delta} >= 0`))
    .returning({ newStock: productVariants.currentStock })
    .all();

  if (!row) {
    // Nothing changed. Work out why, for a precise error; the caller's transaction rolls back.
    const [existing] = tx
      .select({ stock: productVariants.currentStock })
      .from(productVariants)
      .where(eq(productVariants.id, m.variantId))
      .all();
    if (!existing) throw new VariantNotFoundError(m.variantId);
    throw new InsufficientStockError(m.variantId, -m.delta, existing.stock);
  }

  const ledgerId = crypto.randomUUID();
  const previousStock = row.newStock - m.delta;

  tx.insert(stockLedger)
    .values({
      id: ledgerId,
      variantId: m.variantId,
      transactionType: m.type,
      quantityChanged: m.delta,
      previousStock,
      newStock: row.newStock,
      referenceType: m.referenceType ?? DEFAULT_REFERENCE_TYPE[m.type],
      referenceId: m.referenceId ?? null,
      operatorId: m.operatorId,
      unitCostPaisa: m.unitCostPaisa ?? null,
      notes: m.notes?.trim() || null,
    })
    .run();

  return { ledgerId, variantId: m.variantId, previousStock, newStock: row.newStock };
}

/**
 * Runs `fn` in a write transaction that takes the database write lock up front
 * (`BEGIN IMMEDIATE`, spec §6.2), so two checkouts can never interleave.
 *
 * `fn` must be synchronous: no `await`, no network calls (payment/courier APIs go before or
 * after). Throwing anything — e.g. InsufficientStockError — rolls everything back.
 */
export function withStockTransaction<T>(db: DB, fn: (tx: Tx) => T): T {
  return db.transaction(
    (tx) => {
      const result = fn(tx);
      if (result instanceof Promise) {
        throw new InvalidStockMovementError("withStockTransaction callbacks must be synchronous (no async/await)");
      }
      return result;
    },
    { behavior: "immediate" },
  );
}

export type LedgerDrift = { variantId: string; variantSku: string; currentStock: number; ledgerTotal: number };

/**
 * Ledger invariant (spec §6.5): for every variant, SUM(quantity_changed) = current_stock.
 * Returns the variants that break it (empty = healthy). Used by `npm run db:verify` and,
 * later, the nightly reconcile-stock job.
 */
export function findLedgerDrift(db: DB | Tx): LedgerDrift[] {
  return db
    .select({
      variantId: productVariants.id,
      variantSku: productVariants.variantSku,
      currentStock: productVariants.currentStock,
      ledgerTotal: sql<number>`coalesce(sum(${stockLedger.quantityChanged}), 0)`,
    })
    .from(productVariants)
    .leftJoin(stockLedger, eq(stockLedger.variantId, productVariants.id))
    .groupBy(productVariants.id)
    .having(sql`${productVariants.currentStock} <> coalesce(sum(${stockLedger.quantityChanged}), 0)`)
    .all();
}
