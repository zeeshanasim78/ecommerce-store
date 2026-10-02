"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cart, MAX_QTY, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";

type Variant = {
  id: string;
  color: string;
  label: string | null;
  stock: number;
};

/**
 * Colour picker + quantity + Add to cart (spec §2 product detail, BUILD_GUIDE M7).
 * Stock shown here is from the page render; the cart and checkout re-check it on the server.
 */
export function AddToCart({
  variants,
  lowThreshold,
  productName,
}: {
  variants: Variant[];
  lowThreshold: number;
  productName: string;
}) {
  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selected, setSelected] = useState(firstInStock?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<string | null>(null);
  const state = useCart();
  const groupId = useId();

  const variant = variants.find((v) => v.id === selected);
  const inCart = state.lines.find((l) => l.variantId === selected)?.qty ?? 0;
  const canAddMore = variant
    ? Math.max(0, Math.min(variant.stock, MAX_QTY) - inCart)
    : 0;
  const clampedQty = Math.max(1, Math.min(qty, Math.max(1, canAddMore)));

  if (!variant) return null;

  function add() {
    if (!variant || canAddMore <= 0) return;
    if (!cart.add(variant.id, clampedQty)) {
      setAdded(
        "Your cart is full (30 different screens). Remove something first.",
      );
      return;
    }
    setAdded(
      `Added ${clampedQty} × ${productName} (${variant.color}) to your cart.`,
    );
    setQty(1);
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend id={groupId} className="font-sans text-base font-semibold">
          Colour
        </legend>
        <div
          role="radiogroup"
          aria-labelledby={groupId}
          className="mt-3 flex flex-wrap gap-2"
        >
          {variants.map((v) => {
            const on = v.id === selected;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setSelected(v.id);
                  setAdded(null);
                  setQty(1);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
                  on
                    ? "bg-midnight text-canvas"
                    : "bg-white ring-1 ring-midnight/15 hover:ring-midnight/40",
                  v.stock <= 0 && !on && "text-midnight/45",
                )}
              >
                {v.color}
                {v.label ? (
                  <span className={on ? "text-canvas/70" : "text-midnight/55"}>
                    ({v.label})
                  </span>
                ) : null}
                {v.stock <= 0 ? (
                  <span className={on ? "text-canvas/80" : "text-terracotta"}>
                    sold out
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        {variant.stock <= 0 ? (
          <Badge tone="out">Out of stock</Badge>
        ) : variant.stock <= lowThreshold ? (
          <Badge tone="low">Only {variant.stock} left</Badge>
        ) : (
          <Badge tone="stock">In stock</Badge>
        )}
        {inCart > 0 ? (
          <span className="text-sm text-midnight/70">
            {inCart} already in your cart
          </span>
        ) : null}
      </div>

      {variant.stock > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          {canAddMore > 0 ? (
            <div
              className="inline-flex h-12 items-center rounded-full bg-white ring-1 ring-midnight/15"
              role="group"
              aria-label="Quantity"
            >
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={clampedQty <= 1}
                aria-label="One fewer"
                className="size-12 rounded-full text-xl font-semibold disabled:opacity-35"
              >
                −
              </button>
              <span
                className="w-8 text-center font-semibold tabular"
                aria-live="polite"
              >
                {clampedQty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(canAddMore, q + 1))}
                disabled={clampedQty >= canAddMore}
                aria-label="One more"
                className="size-12 rounded-full text-xl font-semibold disabled:opacity-35"
              >
                +
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={add}
            disabled={canAddMore <= 0}
            className={buttonClasses("urgent", "lg", "hover:-translate-y-px")}
          >
            {canAddMore <= 0
              ? "All available units are in your cart"
              : "Add to cart"}
          </button>
        </div>
      ) : (
        <p className="rounded-bezel-sm bg-surface px-4 py-3 text-[0.9375rem]">
          This colour is sold out. Choose another colour, or call the shop to
          ask when it’s back.
        </p>
      )}

      {added ? (
        <p
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-bezel-sm bg-midnight px-4 py-3 text-[0.9375rem] text-canvas"
        >
          {added}
          <Link
            href="/cart"
            className="font-semibold underline underline-offset-4"
          >
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  );
}
