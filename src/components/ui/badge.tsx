import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "grade" | "neutral" | "stock" | "low" | "out" | "dark";

const tones: Record<Tone, string> = {
  // Amber fill with midnight text keeps contrast above 4.5:1 (spec §0.2 accessibility guard)
  grade: "bg-amber text-midnight",
  neutral: "bg-surface text-midnight",
  stock: "bg-midnight/8 text-midnight",
  low: "bg-amber/18 text-midnight ring-1 ring-inset ring-amber/60",
  out: "bg-terracotta/10 text-terracotta",
  dark: "bg-canvas/12 text-canvas",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] leading-none font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Quality grade label, e.g. "OEM Original" or "Compatible A Grade". */
export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  return (
    <Badge tone="grade" className={className}>
      {grade}
    </Badge>
  );
}

/** Stock state shown to shoppers. Exact counts only appear when stock is low. */
export function StockBadge({ stock, lowThreshold }: { stock: number; lowThreshold: number }) {
  if (stock <= 0) return <Badge tone="out">Out of stock</Badge>;
  if (stock <= lowThreshold) return <Badge tone="low">Only {stock} left</Badge>;
  return <Badge tone="stock">In stock</Badge>;
}
