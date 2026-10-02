"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GradeBadge, StockBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { CatalogCard } from "@/server/storefront/catalog";
import { DiscountBadge, PriceTag } from "./price-tag";
import { ScreenPlaceholder } from "./screen-placeholder";

const ANGLE_LABEL = { FRONT: "Front", BACK: "Back", SIDE: "Side", DETAIL: "Detail" } as const;

/**
 * Product card (spec §0.3.5, v1.2): 2–3 images with an angle toggle and hover swap,
 * colour chips that switch to colour-specific photos, feature tags and price hierarchy.
 */
export function ProductCard({ product, priority = false }: { product: CatalogCard; priority?: boolean }) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const images = useMemo(() => {
    const forVariant = variantId ? product.images.filter((i) => i.variantId === variantId) : [];
    const general = product.images.filter((i) => !i.variantId);
    return (forVariant.length ? [...forVariant, ...general] : product.images).slice(0, 3);
  }, [product.images, variantId]);

  // Hover shows the second angle unless the shopper already picked one
  const shown = hovering && index === 0 && images.length > 1 ? 1 : Math.min(index, Math.max(images.length - 1, 0));
  const href = `/store/${product.slug}`;
  const tags = [product.displayType, ...product.featureTags].slice(0, 3);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-bezel bg-white ring-1 ring-midnight/8 transition-shadow duration-300 hover:shadow-[0_24px_48px_-28px_rgb(11_28_51/0.45)]">
      <div className="relative" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden bg-surface">
          {images.length ? (
            <div className="relative aspect-square">
              {images.map((img, i) => (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
                  priority={priority && i === 0}
                  className={cn(
                    "object-contain p-4 transition duration-500 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none",
                    i === shown ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
          ) : (
            <ScreenPlaceholder brand={product.brand} model={product.model} className="transition duration-500 group-hover:-translate-y-1.5" />
          )}
        </Link>
        <DiscountBadge price={product.price} className="absolute top-3 left-3" />
        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" role="group" aria-label="Photo angle">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={i === shown}
                aria-label={`Show ${ANGLE_LABEL[img.angle].toLowerCase()} photo`}
                className={cn(
                  "h-6 rounded-full px-2.5 text-[0.6875rem] font-semibold transition-colors",
                  i === shown ? "bg-midnight text-canvas" : "bg-white/90 text-midnight ring-1 ring-midnight/12 hover:bg-white",
                )}
              >
                {ANGLE_LABEL[img.angle]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-sm text-midnight/60">{product.brand}</p>
          <h3 className="font-display text-lg leading-snug font-bold tracking-[-0.01em]">
            <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {product.model}
            </Link>
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <GradeBadge grade={product.qualityGrade} />
          {tags.map((t) => (
            <span key={t} className="inline-flex h-7 items-center rounded-full bg-surface px-3 text-[0.8125rem] font-medium">
              {t}
            </span>
          ))}
        </div>
        {product.variants.length > 1 ? (
          <div className="relative z-10 flex flex-wrap gap-1.5" role="group" aria-label="Colour">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id === variantId ? null : v.id);
                  setIndex(0);
                }}
                aria-pressed={v.id === variantId}
                className={cn(
                  "h-7 rounded-full px-3 text-[0.8125rem] font-medium ring-1 transition-colors",
                  v.id === variantId ? "bg-midnight text-canvas ring-midnight" : "ring-midnight/15 hover:ring-midnight/40",
                )}
              >
                {v.color}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
          <PriceTag price={product.price} />
          <StockBadge stock={product.totalStock} lowThreshold={product.lowStockThreshold} />
        </div>
      </div>
    </article>
  );
}
