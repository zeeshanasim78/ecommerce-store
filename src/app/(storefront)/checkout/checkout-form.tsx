"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { cart, useCart, type CartState } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatMoney, paisa } from "@/lib/money";
import type { CheckoutFailure } from "@/server/orders/checkout";
import type { CheckoutMethod } from "@/server/settings/store-settings";
import type { CartQuote } from "@/server/storefront/cart";
import { getCartQuote } from "../cart/actions";
import { placeOrderAction } from "./actions";

export type CheckoutCity = { id: string; city: string; province: string; feePaisa: number; codFeePaisa: number; cod: boolean; etaMin: number; etaMax: number };
export type CheckoutMethodView = { id: CheckoutMethod; label: string; payTo: string[] | null };

const rs = (n: number) => formatMoney(paisa(n));
/** ["JazzCash", "Easypaisa", "Bank transfer"] → "JazzCash, Easypaisa or Bank transfer" */
const listWithOr = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`);
const noSubscribe = () => () => {};

/**
 * Checkout (spec §6.3, BUILD_GUIDE M8): 1 Contact & address → 2 Delivery city → 3 Payment → 4 Review.
 * Totals shown here are a preview; placeOrder re-prices everything and refuses if the total moved.
 * The idempotency key comes from the server render, so a double click can only ever make one order.
 */
export function CheckoutForm(props: {
  idempotencyKey: string;
  cities: CheckoutCity[];
  methods: CheckoutMethodView[];
  codMaxPaisa: number;
  waitHours: number;
  storePhone: string | null;
  whatsapp: string | null;
  salesEmail: string | null;
  codPaused: boolean;
  codPauseMessage: string | null;
  /** v1.12: delivery is free when the customer pays in advance (Shop settings). */
  prepaidFreeDelivery: boolean;
}) {
  const { cities, methods, codMaxPaisa } = props;
  const router = useRouter();
  const state = useCart();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [cityId, setCityId] = useState("");
  // v1.12: two choices — cash on delivery, or place the order and pay in advance (then which account)
  const [mode, setMode] = useState<"COD" | "PREPAID" | "">("");
  const [pickedPrepaid, setPrepaid] = useState<CheckoutMethod | "">("");
  const [failure, setFailure] = useState<CheckoutFailure | null>(null);
  const [pending, startTransition] = useTransition();
  const [quoteNo, setQuoteNo] = useState(0);
  const [placedCode, setPlacedCode] = useState<string | null>(null);

  const key = JSON.stringify(state);
  useEffect(() => {
    if (!hydrated || state.lines.length === 0) return;
    let live = true;
    getCartQuote(JSON.parse(key) as CartState).then((r) => {
      if (live && r.ok) setQuote(r.quote);
    });
    return () => {
      live = false;
    };
  }, [key, hydrated, state.lines.length, quoteNo]);

  const city = cities.find((c) => c.id === cityId);
  const discount = quote?.coupon?.ok ? quote.coupon.discountPaisa : 0;
  const beforeFees = quote ? quote.subtotalPaisa - discount : 0;
  const offersCod = methods.some((m) => m.id === "COD");
  const prepaid = methods.filter((m) => m.id !== "COD");
  // COD limit is checked as soon as the cart total is known (before a city is chosen too)
  const codTooBig = quote ? beforeFees + (city ? city.feePaisa + city.codFeePaisa : 0) > codMaxPaisa : false;
  const codBlocked = props.codPaused || !offersCod
    ? "Paused right now"
    : codMaxPaisa <= 0
      ? "Not available online right now"
      : codTooBig
        ? `Only for orders up to ${rs(codMaxPaisa)}`
        : city && !city.cod
          ? `Not available in ${city.city}`
          : null;
  // A COD choice that is no longer allowed is dropped, so the shopper must choose again
  const payMode = mode === "COD" && codBlocked ? "" : mode;
  const prepaidMethod = prepaid.find((m) => m.id === pickedPrepaid)?.id ?? prepaid[0]?.id ?? "";
  const method: CheckoutMethod | "" = payMode === "COD" ? "COD" : payMode === "PREPAID" ? prepaidMethod : "";
  const freeDelivery = payMode === "PREPAID" && props.prepaidFreeDelivery;
  const deliveryFee = city ? (freeDelivery ? 0 : city.feePaisa) : 0;
  const total = quote && city ? beforeFees + deliveryFee + (method === "COD" ? city.codFeePaisa : 0) : null;
  const shareTo = [props.whatsapp ? `WhatsApp ${props.whatsapp}` : null, props.salesEmail ? `email ${props.salesEmail}` : null].filter((x): x is string => Boolean(x));

  if (placedCode) {
    return (
      <p role="status" className="mt-10 rounded-bezel bg-midnight p-8 text-lg font-semibold text-canvas">
        Order {placedCode} placed. Opening your confirmation…
      </p>
    );
  }
  if (!hydrated || (state.lines.length > 0 && !quote)) {
    return <div className="mt-10 h-96 animate-pulse rounded-bezel bg-white ring-1 ring-midnight/8 motion-reduce:animate-none" aria-busy="true" />;
  }
  if (state.lines.length === 0) {
    return (
      <div className="mt-10 rounded-bezel bg-white p-10 text-center ring-1 ring-midnight/8">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <ButtonLink href="/store" className="mt-6">
          Browse the catalogue
        </ButtonLink>
      </div>
    );
  }
  if (quote && !quote.ready) {
    return (
      <div className="mt-10 rounded-bezel bg-white p-8 ring-1 ring-midnight/8">
        <p role="alert" className="text-lg font-semibold">
          {failure?.kind === "SOLD_OUT" ? failure.message : "Something in your cart has sold out or is running low."}
        </p>
        <p className="mt-2 text-midnight/70">Please check your cart before you order.</p>
        <ButtonLink href="/cart" className="mt-6">
          Back to cart
        </ButtonLink>
      </div>
    );
  }
  if (methods.length === 0) {
    return <p className="mt-10 rounded-bezel bg-white p-8 ring-1 ring-midnight/8">Online ordering is paused right now.{props.storePhone ? ` Please call ${props.storePhone} to order.` : ""}</p>;
  }

  function submit(form: HTMLFormElement) {
    if (pending || placedCode || !quote) return;
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    setFailure(null);
    startTransition(async () => {
      const result = await placeOrderAction({
        idempotencyKey: props.idempotencyKey,
        name: get("name"),
        phone: get("phone"),
        email: get("email"),
        line1: get("line1"),
        line2: get("line2") || undefined,
        area: get("area") || undefined,
        postalCode: get("postalCode") || undefined,
        cityId,
        notes: get("notes") || undefined,
        method: method || undefined,
        tid: get("tid") || undefined,
        payerPhone: get("payerPhone") || undefined,
        lines: state.lines,
        coupon: state.coupon,
        expectedTotalPaisa: total ?? undefined,
      });
      if (result.ok) {
        setPlacedCode(result.code);
        cart.clear();
        router.push(`/checkout/success?order=${encodeURIComponent(result.code)}`);
        return;
      }
      setFailure(result);
      if (result.kind === "PRICE_CHANGED" || result.kind === "SOLD_OUT") setQuoteNo((n) => n + 1);
    });
  }

  return (
    <form
      className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_24rem]"
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      noValidate={false}
    >
      <div className="flex flex-col gap-6">
        <Step n={1} title="Contact and address">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Full name">
              <Input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </Field>
            <Field id="phone" label="Mobile number" hint="For delivery calls and order updates.">
              <Input id="phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" aria-describedby="phone-hint" />
            </Field>
            <Field id="email" label="Email" hint="Your order details, payment steps and dispatch news are sent here.">
              <Input id="email" name="email" type="email" required maxLength={120} autoComplete="email" placeholder="name@gmail.com" aria-describedby="email-hint" />
            </Field>
            <Field id="postalCode" label="Postal code (optional)">
              <Input id="postalCode" name="postalCode" inputMode="numeric" pattern="\d{5}" maxLength={5} autoComplete="postal-code" />
            </Field>
            <div className="sm:col-span-2">
              <Field id="line1" label="House and street">
                <Input id="line1" name="line1" required minLength={5} maxLength={120} autoComplete="address-line1" placeholder="House 12, Street 4, Block C" />
              </Field>
            </div>
            <Field id="area" label="Area / town (optional)">
              <Input id="area" name="area" maxLength={60} autoComplete="address-level3" placeholder="Gulberg III" />
            </Field>
            <Field id="line2" label="Landmark (optional)">
              <Input id="line2" name="line2" maxLength={120} autoComplete="address-line2" placeholder="Near Main Market" />
            </Field>
          </div>
        </Step>

        <Step n={2} title="Delivery city">
          <Field id="city" label="City">
            <Select id="city" required value={cityId} onChange={(e) => setCityId(e.target.value)}>
              <option value="" disabled>
                Choose your city
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city}, {c.province} — {rs(c.feePaisa)}
                </option>
              ))}
            </Select>
          </Field>
          {city ? (
            <p className="text-[0.9375rem] text-midnight/75">
              Delivery {rs(city.feePaisa)} · usually {city.etaMin}–{city.etaMax} working days after dispatch{city.cod ? "" : " · cash on delivery isn’t available here"}.
            </p>
          ) : (
            <p className="text-sm text-midnight/65">Don’t see your city? Call us — we may still be able to send it.</p>
          )}
          <Field id="notes" label="Delivery notes (optional)">
            <Input id="notes" name="notes" maxLength={500} placeholder="Call before coming, shop closes at 9 pm…" />
          </Field>
        </Step>

        <Step n={3} title="Payment">
          <fieldset>
            <legend className="sr-only">How would you like to pay?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-bezel-sm bg-white p-5 ring-1 transition-shadow",
                  payMode === "COD" ? "ring-2 ring-midnight" : "ring-midnight/15 hover:ring-midnight/40",
                  codBlocked && "cursor-not-allowed opacity-55",
                )}
              >
                <input type="radio" name="payMode" value="COD" required checked={payMode === "COD"} disabled={Boolean(codBlocked)} onChange={() => setMode("COD")} className="mt-1 size-5 accent-midnight" />
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">Cash on delivery</span>
                  <span className="mt-1 block text-sm text-midnight/70">
                    {codBlocked
                      ? codBlocked
                      : `Pay the courier in cash when it arrives${city ? ` · delivery ${rs(city.feePaisa)}${city.codFeePaisa ? ` + ${rs(city.codFeePaisa)} COD fee` : ""}` : ""}`}
                  </span>
                  {props.codPaused && props.codPauseMessage ? <span className="mt-1 block text-sm text-midnight/70">{props.codPauseMessage}</span> : null}
                </span>
              </label>

              {prepaid.length ? (
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-bezel-sm bg-white p-5 ring-1 transition-shadow", payMode === "PREPAID" ? "ring-2 ring-midnight" : "ring-midnight/15 hover:ring-midnight/40")}>
                  <input type="radio" name="payMode" value="PREPAID" required checked={payMode === "PREPAID"} onChange={() => setMode("PREPAID")} className="mt-1 size-5 accent-midnight" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">Place order & pay in advance</span>
                      {props.prepaidFreeDelivery ? <span className="rounded-full bg-terracotta px-2.5 py-0.5 text-xs font-bold tracking-wide text-white uppercase">Free delivery</span> : null}
                    </span>
                    <span className="mt-1 block text-sm text-midnight/70">
                      Order now, pay by {listWithOr(prepaid.map((m) => m.label))}. We confirm your payment, then dispatch{props.prepaidFreeDelivery ? " — no delivery charge" : ""}.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
          </fieldset>

          {codBlocked && !prepaid.length ? (
            <p role="note" className="rounded-bezel-sm bg-surface px-5 py-4 text-[0.9375rem]">
              To order, please contact us and we’ll arrange payment
              {props.storePhone ? (
                <>
                  {" "}
                  — call{" "}
                  <a href={`tel:${props.storePhone.replace(/[^+\d]/g, "")}`} className="font-semibold underline underline-offset-4">
                    {props.storePhone}
                  </a>
                </>
              ) : null}
              {props.whatsapp ? (
                <>
                  {" "}
                  or{" "}
                  <a href={`https://wa.me/${props.whatsapp.replace(/\D/g, "").replace(/^0/, "92")}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                    message us on WhatsApp
                  </a>
                </>
              ) : null}
              .
            </p>
          ) : null}

          {payMode === "PREPAID" ? (
            <div className="flex flex-col gap-5 rounded-bezel-sm bg-surface p-5">
              <fieldset>
                <legend className="font-semibold">Which account will you pay into?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {prepaid.map((m) => (
                    <label key={m.id} className={cn("flex cursor-pointer items-start gap-3 rounded-bezel-sm bg-white p-4 ring-1", prepaidMethod === m.id ? "ring-2 ring-midnight" : "ring-midnight/15 hover:ring-midnight/40")}>
                      <input type="radio" name="method" value={m.id} checked={prepaidMethod === m.id} onChange={() => setPrepaid(m.id)} className="mt-1 size-5 accent-midnight" />
                      <span className="min-w-0">
                        <span className="block font-semibold">{m.label}</span>
                        {m.payTo ? (
                          <span className="mt-1 block text-sm break-words text-midnight/80 tabular">
                            {m.payTo.map((l) => {
                              const at = l.indexOf(": ");
                              return (
                                <span key={l} className="block">
                                  {at > 0 ? l.slice(0, at + 2) : ""}
                                  <span className={(at > 0 ? l.slice(at + 2) : l).length > 16 ? "break-all" : "whitespace-nowrap"}>{at > 0 ? l.slice(at + 2) : l}</span>
                                </span>
                              );
                            })}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div role="note" className="rounded-bezel-sm bg-white px-5 py-4 text-[0.9375rem] ring-1 ring-terracotta/30">
                <p className="font-semibold">What happens after you place the order</p>
                <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-midnight/80">
                  <li>You get an order number on the next page and by email.</li>
                  <li>Pay {total !== null ? rs(total) : "the total"} into the account above and write the order number in the transfer’s remarks.</li>
                  <li>
                    <b>Within {props.waitHours} hours</b>, send the payment slip (screenshot) and the transaction ID with your order number{shareTo.length ? ` — ${listWithOr(shareTo)}` : " to us"}.
                  </li>
                  <li>We confirm your payment by email, then dispatch and email you the tracking number.</li>
                </ol>
                <p className="mt-2 text-sm text-midnight/65">If we don’t receive your payment details within {props.waitHours} hours, the order is cancelled and the stock goes back on sale.</p>
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">Already paid? Add the transaction ID now (optional)</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field id="tid" label={method === "BANK_TRANSFER" ? "Bank reference number" : "Transaction ID"}>
                    <Input id="tid" name="tid" maxLength={30} pattern="[A-Za-z0-9\-]{6,30}" autoComplete="off" className="tabular uppercase" />
                  </Field>
                  {method !== "BANK_TRANSFER" ? (
                    <Field id="payerPhone" label="Number you paid from (optional)">
                      <Input id="payerPhone" name="payerPhone" type="tel" inputMode="tel" placeholder="0300 1234567" />
                    </Field>
                  ) : null}
                </div>
              </details>
            </div>
          ) : null}
        </Step>
      </div>

      <aside className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8 lg:sticky lg:top-6" aria-label="Review your order">
        <h2 className="flex items-center gap-3 font-sans text-lg font-semibold">
          <StepNo n={4} /> Review
        </h2>
        <ul className="mt-5 flex flex-col gap-3 text-[0.9375rem]">
          {quote?.lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span>
                {l.qty} × {l.product?.brand} {l.product?.model}
                <span className="block text-sm text-midnight/65">
                  {l.product?.grade} · {l.color}
                </span>
              </span>
              <span className="font-semibold tabular whitespace-nowrap">{rs(l.lineTotalPaisa)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 flex flex-col gap-2.5 border-t border-midnight/10 pt-5 text-[0.9375rem]">
          <Row label="Subtotal" value={quote ? rs(quote.subtotalPaisa) : "—"} />
          {discount > 0 ? <Row label={`Code ${quote?.coupon?.code}`} value={`−${rs(discount)}`} tone="sale" /> : null}
          <Row label="Delivery" value={city ? (freeDelivery ? "Free (paid in advance)" : rs(city.feePaisa)) : "Choose a city"} />
          {method === "COD" && city?.codFeePaisa ? <Row label="Cash on delivery fee" value={rs(city.codFeePaisa)} /> : null}
          <div className="mt-2 flex justify-between gap-4 border-t border-midnight/10 pt-4 text-lg">
            <dt className="font-semibold">Total</dt>
            <dd className="font-bold tabular">{total !== null ? rs(total) : "—"}</dd>
          </div>
        </dl>
        {quote?.coupon && !quote.coupon.ok ? (
          <p className="mt-3 text-sm text-terracotta">
            Code {quote.coupon.code} won’t be used: {quote.coupon.reason}{" "}
            <button type="button" className="font-semibold underline" onClick={() => cart.setCoupon(undefined)}>
              Remove it
            </button>
          </p>
        ) : null}

        {failure ? (
          <div role="alert" className="mt-5 rounded-bezel-sm bg-terracotta/10 px-4 py-3 text-[0.9375rem] font-medium text-terracotta">
            {failure.message}
            {failure.kind === "SOLD_OUT" ? (
              <Link href="/cart" className="mt-2 block font-semibold underline underline-offset-4">
                Check your cart
              </Link>
            ) : null}
            {failure.kind === "COUPON" ? (
              <button type="button" className="mt-2 block font-semibold underline underline-offset-4" onClick={() => cart.setCoupon(undefined)}>
                Order without the code
              </button>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" variant="urgent" size="lg" className="mt-6 w-full" disabled={pending || !cityId || !method || (method === "COD" && Boolean(codBlocked))} aria-busy={pending}>
          {pending ? "Placing your order…" : `${payMode === "PREPAID" ? "Place order & pay in advance" : "Place order"}${total !== null ? ` · ${rs(total)}` : ""}`}
        </Button>
        <p className="mt-3 text-sm text-midnight/65">By ordering you agree to our warranty and returns terms. We email your order details and confirm before dispatch.</p>
      </aside>
    </form>
  );
}

function StepNo({ n }: { n: number }) {
  return <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-midnight text-sm font-bold text-canvas tabular">{n}</span>;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8 sm:p-8" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-3 font-sans text-lg font-semibold">
        <StepNo n={n} /> {title}
      </h2>
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "sale" }) {
  return (
    <div className={cn("flex justify-between gap-4", tone === "sale" && "text-terracotta")}>
      <dt>{label}</dt>
      <dd className="font-semibold tabular">{value}</dd>
    </div>
  );
}

