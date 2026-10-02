"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CatalogCard } from "@/server/storefront/catalog";
import { ProductCard } from "./product-card";

/** Home-page product grid with brand tabs (spec §0.3.5): all screens, or one brand at a time. */
export function BrandShowcase({ products, brands }: { products: CatalogCard[]; brands: { name: string; count: number }[] }) {
  const [brand, setBrand] = useState<string | null>(null);
  const shown = brand ? products.filter((p) => p.brand === brand) : products;

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Filter by brand">
        <div className="flex w-max gap-2">
          {[{ name: null as string | null, count: products.length }, ...brands].map((b) => (
            <button
              key={b.name ?? "all"}
              type="button"
              role="tab"
              aria-selected={brand === b.name}
              onClick={() => setBrand(b.name)}
              className={cn(
                "h-10 rounded-full px-5 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors",
                brand === b.name ? "bg-midnight text-canvas" : "bg-white ring-1 ring-midnight/12 hover:ring-midnight/35",
              )}
            >
              {b.name ?? "All brands"} <span className={cn("ml-1 font-medium", brand === b.name ? "text-canvas/60" : "text-midnight/50")}>{b.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 2} />
        ))}
      </div>
    </>
  );
}
