/**
 * Money rules — SPECIFICATION.md §3.
 * All arithmetic happens in integer paisa (1 PKR = 100 paisa).
 * The blueprint price columns are `real` rupees; convert at the boundary with these helpers.
 */

export type Paisa = number & { readonly __brand: "Paisa" };

export function paisa(value: number): Paisa {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Paisa must be a safe integer, got ${value}`);
  }
  return value as Paisa;
}

/** Rupees (real column, max 2 dp) → integer paisa, rounding half away from zero. */
export function toPaisa(rupees: number): Paisa {
  if (!Number.isFinite(rupees)) throw new RangeError(`Invalid rupee amount: ${rupees}`);
  const sign = rupees < 0 ? -1 : 1;
  // toFixed(4) removes float noise such as 19.995000000000001 before rounding
  const scaled = Number((Math.abs(rupees) * 100).toFixed(4));
  return paisa(sign * Math.round(scaled));
}

/** Integer paisa → rupees for writing the blueprint `real` columns. */
export function fromPaisa(value: Paisa): number {
  return value / 100;
}

export function sumPaisa(values: readonly Paisa[]): Paisa {
  return paisa(values.reduce<number>((total, v) => total + v, 0));
}

const pkrFormatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/**
 * "Rs 12,500". The storefront is PKR-only (SPECIFICATION.md §3, v1.2): there is
 * deliberately no USD formatter, so a $ price can't appear by accident.
 */
export function formatMoney(value: Paisa): string {
  return `Rs ${pkrFormatter.format(Math.round(value / 100))}`;
}
