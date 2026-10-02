"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CardImage } from "@/server/storefront/catalog";

/** Product-page gallery: large image plus angle thumbnails. */
export function ProductGallery({ images }: { images: CardImage[] }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-bezel-lg bg-surface">
        <Image key={current.url} src={current.url} alt={current.alt} fill priority sizes="(min-width: 1024px) 34rem, 92vw" className="object-contain p-6" />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3" role="group" aria-label="Photos">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              aria-label={`Show photo ${i + 1}: ${img.alt}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-bezel-sm bg-surface ring-2 transition-[box-shadow,transform] hover:-translate-y-0.5",
                i === index ? "ring-midnight" : "ring-transparent",
              )}
            >
              <Image src={img.url} alt="" fill sizes="8rem" className="object-contain p-2" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
