import { eq } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { productVariants, products, stockLedger } from "@/db/schema";
import { toPaisa } from "@/lib/money";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { applyStockMovement, withStockTransaction } from "./stock";

/**
 * Manual stock corrections — SPECIFICATION.md §6.5.
 * Only OWNER/MANAGER may call these (checked by the Server Action). Corrections are always
 * NEW ledger rows written through the stock engine; old rows are never edited.
 */

export type AdjustReason = "MANUAL_ADJUST" | "DAMAGED_WRITE_OFF";

export class StockAdjustError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockAdjustError";
  }
}

function variantWithCost(db: DB | Tx, variantId: string) {
  const v = db
    .select({ id: productVariants.id, stock: productVariants.currentStock, sku: productVariants.variantSku, costPrice: products.costPrice })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.id, variantId))
    .get();
  if (!v) throw new StockAdjustError("That colour no longer exists.");
  return v;
}

/** Add or remove units with a reason. Breakage uses DAMAGED_WRITE_OFF (always a removal). */
export function adjustStock(
  db: DB,
  input: { variantId: string; delta: number; reason: AdjustReason; notes: string; expectedStock: number },
  actor: { id: string },
  ctx: AuditContext,
) {
  const notes = input.notes.trim();
  if (!notes) throw new StockAdjustError("Write why the stock is changing — it’s kept in the ledger for good.");
  if (!Number.isSafeInteger(input.delta) || input.delta === 0) throw new StockAdjustError("Enter a whole number of units, other than 0.");
  if (input.reason === "DAMAGED_WRITE_OFF" && input.delta > 0) throw new StockAdjustError("A damage write-off removes units — use a negative number.");

  return withStockTransaction(db, (tx) => {
    const v = variantWithCost(tx, input.variantId);
    if (v.stock !== input.expectedStock) {
      throw new StockAdjustError(`Stock for ${v.sku} changed to ${v.stock} while you were typing (a sale or receipt happened). Nothing was changed — check and try again.`);
    }
    const result = applyStockMovement(tx, {
      variantId: v.id,
      delta: input.delta,
      type: input.reason,
      referenceType: "ADJUSTMENT",
      operatorId: actor.id,
      unitCostPaisa: toPaisa(v.costPrice),
      notes,
    });
    writeAudit(tx, ctx, { actorId: actor.id, action: "stock.adjust", entity: "product_variants", entityId: v.id, before: { stock: result.previousStock }, after: { stock: result.newStock, reason: input.reason, notes } });
    return result;
  });
}

/**
 * Physical stock count: staff enter what's on the shelf; the difference is written as one
 * movement with reference_type COUNT. A colour that has never had stock gets OPENING_BALANCE.
 */
export function countStock(
  db: DB,
  input: { variantId: string; counted: number; notes: string; expectedStock: number },
  actor: { id: string },
  ctx: AuditContext,
): { previousStock: number; newStock: number; changed: boolean } {
  if (!Number.isSafeInteger(input.counted) || input.counted < 0 || input.counted > 1_000_000) {
    throw new StockAdjustError("Enter the counted quantity as a whole number, 0 or more.");
  }

  return withStockTransaction(db, (tx) => {
    const v = variantWithCost(tx, input.variantId);
    if (v.stock !== input.expectedStock) {
      throw new StockAdjustError(`Stock for ${v.sku} changed to ${v.stock} since you opened the page. Nothing was changed — recount or reload.`);
    }
    const delta = input.counted - v.stock;
    if (delta === 0) {
      writeAudit(tx, ctx, { actorId: actor.id, action: "stock.count", entity: "product_variants", entityId: v.id, after: { counted: input.counted, matched: true } });
      return { previousStock: v.stock, newStock: v.stock, changed: false };
    }

    const hasHistory = Boolean(tx.select({ id: stockLedger.id }).from(stockLedger).where(eq(stockLedger.variantId, v.id)).limit(1).get());
    const opening = !hasHistory && delta > 0;
    const extra = input.notes.trim();
    const result = applyStockMovement(tx, {
      variantId: v.id,
      delta,
      type: opening ? "OPENING_BALANCE" : "MANUAL_ADJUST",
      referenceType: "COUNT",
      operatorId: actor.id,
      unitCostPaisa: toPaisa(v.costPrice),
      notes: `Stock count: system ${v.stock}, counted ${input.counted}${extra ? `. ${extra}` : ""}`,
    });
    writeAudit(tx, ctx, { actorId: actor.id, action: "stock.count", entity: "product_variants", entityId: v.id, before: { stock: v.stock }, after: { stock: result.newStock, counted: input.counted } });
    return { previousStock: result.previousStock, newStock: result.newStock, changed: true };
  });
}
