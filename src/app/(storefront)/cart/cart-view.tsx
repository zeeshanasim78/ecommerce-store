"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Badge, GradeBadge } from "@/components/ui/badge";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cart, MAX_QTY, useCart, type CartState } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatMoney, paisa } from "@/lib/money";
import type { CartQuote, QuotedLine } from "@/server/storefront/cart";
import { getCartQuote } from "./actions";

const rs = (n: number) => formatMoney(paisa(n));
const noSubscribe = () => () => {};

/**
 * The cart page body. The browser holds ids and quantities only; every change asks the server
 * for fresh prices and stock (getCartQuote), so nothing shown here comes from the browser.
 */
export function CartView({ storePhone, minDeliveryPaisa }: { storePhone: string | null; minDeliveryPaisa: number | null }) {
  const state = useCart();
  // false during server render and the first client render, true afterwards (no effect needed)
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const requestNo = useRef(0);

  // Re-price whenever the cart changes (quantities, removals, coupon)
  const key = JSON.stringify(state);
  useEffect(() => {
    if (!hydrated || (state.lines.length === 0 && !state.coupon)) return; // the empty state needs no prices
    const n = ++requestNo.current;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await getCartQuote(JSON.parse(key) as CartState);
        if (n !== requestNo.current) return; // a newer change is already being priced
        if (res.ok) {
          setQuote(res.quote);
          setError(null);
        } else setError(res.error);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [key, hydrated, state.lines.length, state.coupon]);

  if (!hydrated || (state.lines.length > 0 && !quote && !error)) {
    return (
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]" aria-busy="true">
        <div className="h-40 animate-pulse rounded-bezel bg-white ring-1 ring-midnight/8 motion-reduce:animate-none" />
        <div className="h-56 animate-pulse rounded-bezel bg-white ring-1 ring-midnight/8 motion-reduce:animate-none" />
        <p className="sr-only">Loading your cart…</p>
      </div>
    );
  }

  if (state.lines.length === 0) {
    return (
      <div className="mt-10 rounded-bezel bg-white p-10 text-center ring-1 ring-midnight/8">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <p className="mt-2 text-midnight/70">Find your phone’s screen by brand, model or the code inside the SIM tray.</p>
        <ButtonLink href="/store" className="mt-6">
          Browse the catalogue
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Items" className="flex flex-col gap-4">
        {error ? <p className="rounded-bezel-sm bg-terracotta/10 px-5 py-3 font-medium text-terracotta">{error}</p> : null}
        {quote?.lines.map((l) => <CartLineRow key={l.variantId} line={l} />)}
        <p className="text-sm text-midnight/65">Prices and stock are checked again when you place your order.</p>
      </section>

      {quote ? (
        <aside className={cn("rounded-bezel bg-white p-6 ring-1 ring-midnight/8 lg:sticky lg:top-6", pending && "opacity-70 transition-opacity")} aria-label="Order summary" aria-busy={pending}>
          <h2 className="font-sans text-lg font-semibold">Summary</h2>
          <dl className="mt-5 flex flex-col gap-3 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt>
                {quote.itemCount} item{quote.itemCount === 1 ? "" : "s"}
              </dt>
              <dd className="font-semibold tabular">{rs(quote.subtotalPaisa)}</dd>
            </div>
            {quote.savingsPaisa > 0 ? (
              <div className="flex justify-between gap-4 text-terracotta">
                <dt>You save</dt>
                <dd className="font-semibold tabular">{rs(quote.savingsPaisa)}</dd>
              </div>
            ) : null}
            {quote.coupon?.ok ? (
              <div className="flex justify-between gap-4 text-terracotta">
                <dt>Code {quote.coupon.code}</dt>
                <dd className="font-semibold tabular">−{rs(quote.coupon.discountPaisa)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 text-midnight/70">
              <dt>Delivery</dt>
              <dd className="text-right">{minDeliveryPaisa !== null ? `From ${rs(minDeliveryPaisa)}, by city` : "By city"}</dd>
            </div>
            <div className="mt-2 flex justify-between gap-4 border-t border-midnight/10 pt-4 text-lg">
              <dt className="font-semibold">Total before delivery</dt>
              <dd className="font-bold tabular">{rs(quote.totalBeforeDeliveryPaisa)}</dd>
            </div>
          </dl>

          <CouponForm current={state.coupon} result={quote.coupon} />

          <div className="mt-6 border-t border-midnight/10 pt-6">
            {quote.ready ? (
              <ButtonLink href="/checkout" variant="urgent" size="lg" className="w-full">
                Checkout
              </ButtonLink>
            ) : (
              <button type="button" disabled className={buttonClasses("urgent", "lg", "w-full")}>
                Checkout
              </button>
            )}
            <p className="mt-3 text-sm text-midnight/70">
              Cash on delivery, JazzCash, Easypaisa, NayaPay or bank transfer.
              {storePhone ? (
                <>
                  {" "}
                  Questions? Call{" "}
                  <a href={`tel:${storePhone.replace(/[^+\d]/g, "")}`} className="font-semibold underline underline-offset-4">
                    {storePhone}
                  </a>
                  .
                </>
              ) : null}
            </p>
            {!quote.ready ? <p className="mt-3 text-sm font-semibold text-terracotta">Some items need your attention before you can order.</p> : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function CartLineRow({ line }: { line: QuotedLine }) {
  const p = line.product;
  const maxQty = Math.min(MAX_QTY, Math.max(line.available, 0));
  return (
    <article className="grid grid-cols-[4.5rem_1fr] gap-4 rounded-bezel bg-white p-4 ring-1 ring-midnight/8 sm:grid-cols-[6rem_1fr_auto] sm:p-5">
      <div className="size-18 overflow-hidden rounded-bezel-sm bg-surface sm:size-24">
        {p?.image ? (
          <Image src={p.image.url} alt={p.image.alt} width={96} height={96} className="size-full object-contain" />
        ) : (
          <svg viewBox="0 0 48 48" aria-hidden="true" className="size-full p-4 text-midnight/35">
            <rect x="14" y="5" width="20" height="38" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M21 9h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="min-w-0">
        {p ? (
          <>
            <p className="text-sm text-midnight/65">{p.brand}</p>
            <Link href={`/store/${p.slug}`} className="font-semibold hover:underline">
              {p.model}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <GradeBadge grade={p.grade} />
              <span className="text-sm text-midnight/75">
                {line.color}
                {line.variantLabel ? ` (${line.variantLabel})` : ""}
              </span>
            </div>
          </>
        ) : (
          <p className="font-semibold">A screen that’s no longer sold</p>
        )}

        <LineNotice line={line} />

        {line.status !== "unavailable" && line.status !== "sold_out" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-10 items-center rounded-full bg-canvas ring-1 ring-midnight/15" role="group" aria-label={`Quantity of ${p?.model ?? "item"}`}>
              <button type="button" onClick={() => cart.setQty(line.variantId, line.qty - 1)} aria-label="One fewer" className="size-10 rounded-full text-lg font-semibold">
                −
              </button>
              <span className="w-7 text-center font-semibold tabular">{line.qty}</span>
              <button type="button" onClick={() => cart.setQty(line.variantId, line.qty + 1)} disabled={line.qty >= maxQty} aria-label="One more" className="size-10 rounded-full text-lg font-semibold disabled:opacity-35">
                +
              </button>
            </div>
            <button type="button" onClick={() => cart.remove(line.variantId)} className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => cart.remove(line.variantId)} className={buttonClasses("outline", "sm", "mt-3")}>
            Remove from cart
          </button>
        )}
      </div>

      {line.status !== "unavailable" ? (
        <div className="col-span-2 flex items-baseline justify-between gap-3 border-t border-midnight/8 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <span className="text-sm text-midnight/65 tabular">
            {line.originalUnitPaisa > line.unitPaisa ? <span className="mr-1.5 line-through">{rs(line.originalUnitPaisa)}</span> : null}
            <span className={line.originalUnitPaisa > line.unitPaisa ? "font-semibold text-terracotta" : ""}>{rs(line.unitPaisa)}</span> each
          </span>
          <span className="text-lg font-bold tabular">{rs(line.lineTotalPaisa)}</span>
        </div>
      ) : null}
    </article>
  );
}

function LineNotice({ line }: { line: QuotedLine }) {
  if (line.status === "unavailable") return <p className="mt-2 text-sm font-medium text-terracotta">This screen has been taken off sale.</p>;
  if (line.status === "sold_out")
    return (
      <p className="mt-2">
        <Badge tone="out">Sold out</Badge>
        <span className="ml-2 text-sm text-midnight/70">It sold since you added it.</span>
      </p>
    );
  if (line.status === "short")
    return (
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <Badge tone="low">Only {line.available} left</Badge>
        <button type="button" onClick={() => cart.setQty(line.variantId, line.available)} className="font-semibold underline underline-offset-4">
          Change to {line.available}
        </button>
      </p>
    );
  if (line.lowStock) return <p className="mt-2"><Badge tone="low">Only {line.available} left</Badge></p>;
  return null;
}

function CouponForm({ current, result }: { current?: string; result: CartQuote["coupon"] }) {
  const [code, setCode] = useState("");
  if (current && result?.ok) {
    return (
      <p className="mt-5 flex items-center justify-between gap-3 rounded-bezel-sm bg-surface px-4 py-3 text-sm">
        <span>
          Code <b className="tabular">{result.code}</b> applied
        </span>
        <button type="button" onClick={() => cart.setCoupon(undefined)} className="font-semibold underline underline-offset-4">
          Remove
        </button>
      </p>
    );
  }
  return (
    <form
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) cart.setCoupon(code);
      }}
    >
      <label htmlFor="coupon" className="pl-1 text-sm font-semibold">
        Discount code
      </label>
      <div className="mt-2 flex gap-2">
        <Input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} autoComplete="off" className="h-10 uppercase tabular" aria-describedby={current && result && !result.ok ? "coupon-error" : undefined} />
        <Button type="submit" variant="outline" size="sm" className="h-10">
          Apply
        </Button>
      </div>
      {current && result && !result.ok ? (
        <p id="coupon-error" className="mt-2 pl-1 text-sm font-medium text-terracotta">
          {current}: {result.reason}
        </p>
      ) : null}
    </form>
  );
}
