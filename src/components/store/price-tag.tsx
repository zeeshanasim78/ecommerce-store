import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { PriceResult } from "@/server/pricing/price";

/**
 * Price hierarchy (SPECIFICATION.md §0.2, v1.2): when discounted, the original price is
 * struck through in muted midnight and the price to pay is shown in terracotta.
 */
export function PriceTag({ price, size = "md", className }: { price: PriceResult; size?: "md" | "lg"; className?: string }) {
  const big = size === "lg";
  if (!price.isDiscounted) {
    return <p className={cn("tabular font-bold", big ? "text-3xl" : "text-lg", className)}>{formatMoney(price.finalPaisa)}</p>;
  }
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <span className={cn("tabular font-bold text-terracotta", big ? "text-3xl" : "text-lg")}>{formatMoney(price.finalPaisa)}</span>
      <span className={cn("tabular text-midnight/45 line-through decoration-1", big ? "text-lg" : "text-sm")}>
        <span className="sr-only">Was </span>
        {formatMoney(price.originalPaisa)}
      </span>
      <span className="text-sm font-semibold text-terracotta">Save {formatMoney(price.savingPaisa)}</span>
    </p>
  );
}

/** Corner badge for discounted cards: "-15%". */
export function DiscountBadge({ price, className }: { price: PriceResult; className?: string }) {
  if (!price.isDiscounted) return null;
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full bg-terracotta px-3 text-[0.8125rem] font-bold text-white", className)}>
      −{price.percentOff}%
    </span>
  );
}
