"use client";

import { cartCount, useCart } from "@/lib/cart-store";

/** Number of items in this browser's cart, shown on the header's Cart pill. */
export function CartCount() {
  const n = cartCount(useCart());
  if (n === 0) return <span className="sr-only">, empty</span>;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-bold text-white tabular">
      {n > 99 ? "99+" : n}
      <span className="sr-only"> item{n === 1 ? "" : "s"}</span>
    </span>
  );
}
