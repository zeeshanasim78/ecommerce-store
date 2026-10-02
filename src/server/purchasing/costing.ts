/**
 * Purchasing maths — SPECIFICATION.md §4.6. Pure functions, all in integer paisa.
 *
 * Landed cost of a line = unit cost × FX rate + its share of the PO's extra costs
 * (shipping + customs + other), shared out by line value. Shares use ordered quantities,
 * so every partial receipt of a line gets the same per-unit landed cost.
 */

export type LandedLineInput = {
  id: string;
  qtyOrdered: number;
  /** Unit cost in the PO currency's minor unit (paisa, cents, fen). */
  unitCostForeign: number;
};

/** Foreign minor units × (PKR per 1 major unit) = paisa, rounded half-up. */
export function foreignToPaisa(minorUnits: number, fxRateToPkr: number): number {
  return Math.round(Number((minorUnits * fxRateToPkr).toFixed(4)));
}

/**
 * Per-unit landed cost in paisa for every line.
 * Extra costs are split in proportion to each line's value (largest-remainder, so the
 * shares add up exactly). If every line is free (value 0), they're split by quantity.
 */
export function landedUnitCosts(lines: readonly LandedLineInput[], fxRateToPkr: number, extraCostsPaisa: number): Map<string, number> {
  const result = new Map<string, number>();
  if (lines.length === 0) return result;

  const values = lines.map((l) => foreignToPaisa(l.unitCostForeign, fxRateToPkr) * l.qtyOrdered);
  const totalValue = values.reduce((a, b) => a + b, 0);
  const weights = totalValue > 0 ? values : lines.map((l) => l.qtyOrdered);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Largest-remainder allocation of the extra costs across lines
  const raw = weights.map((w) => (totalWeight > 0 ? (extraCostsPaisa * w) / totalWeight : 0));
  const shares = raw.map(Math.floor);
  let left = extraCostsPaisa - shares.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
    .forEach(({ i }) => {
      if (left > 0) {
        shares[i]! += 1;
        left -= 1;
      }
    });

  lines.forEach((l, i) => {
    const lineTotal = values[i]! + shares[i]!;
    result.set(l.id, Math.round(lineTotal / l.qtyOrdered));
  });
  return result;
}

/**
 * Weighted average cost (Clarify Q9) after receiving `qtyIn` units at `unitCostIn`.
 * With no (or negative) stock on hand the new cost is simply the incoming cost.
 */
export function weightedAverageCost(currentCostPaisa: number, stockOnHand: number, unitCostInPaisa: number, qtyIn: number): number {
  if (qtyIn <= 0) return currentCostPaisa;
  if (stockOnHand <= 0) return unitCostInPaisa;
  return Math.round((currentCostPaisa * stockOnHand + unitCostInPaisa * qtyIn) / (stockOnHand + qtyIn));
}

/** "12.50" (major units, up to 2 decimals) → 1250 minor units. Returns null if not a valid amount. */
export function majorToMinor(input: string): number | null {
  const s = input.trim().replaceAll(",", "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const n = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(n) ? n : null;
}

/** 1250 → "12.50" */
export function minorToMajor(minor: number): string {
  return (minor / 100).toFixed(2);
}
