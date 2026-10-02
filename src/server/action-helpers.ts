import "server-only";
import { redirect } from "next/navigation";
import { CsvParseError } from "@/lib/csv";
import { StockAdjustError } from "@/server/inventory/adjust";
import { InsufficientStockError } from "@/server/inventory/stock";
import { PurchaseOrderError } from "@/server/purchasing/purchase-orders";
import { friendlyDbError } from "./db-errors";

/** Redirect back to a page with ?saved=… or ?error=… (the admin pages show these as notices). */
export function goTo(path: string, params: Record<string, string> = {}): never {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path);
}

/** Message for staff from a rule error, a stock error or a database constraint. Unknown errors re-throw. */
export function staffMessage(error: unknown): string {
  if (error instanceof PurchaseOrderError || error instanceof StockAdjustError || error instanceof CsvParseError) return error.message;
  if (error instanceof InsufficientStockError) return `Not enough stock: only ${error.available} left.`;
  return friendlyDbError(error);
}

/**
 * Runs a synchronous change and returns an error message instead of throwing, so the caller can
 * redirect AFTER the try/catch (redirect() works by throwing, so it must not run inside one).
 */
export function attempt<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, error: staffMessage(e) };
  }
}
