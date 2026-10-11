"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { CounterReceipt, type ShopHeader } from "@/components/admin/counter-receipt";
import { PrintableReceipt } from "@/components/admin/printable-receipt";
import { Badge, GradeBadge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { COUNTER_METHOD_LABEL, type CounterMethod } from "@/lib/counter";
import { formatMoney, paisa } from "@/lib/money";
import { parseTimestamp } from "@/lib/time";
import type { CounterItem, CounterReceipt as Receipt, RecentSale, Technician, TicketQuote } from "@/server/counter/pos";
import { addTechnicianAction, approveTechnicianAction, completeSaleAction, findTechnicianAction, quoteTicketAction, searchItemsAction } from "./actions";

/**
 * The till (spec §6.4, BUILD_GUIDE M9). Keyboard first:
 *   type or scan a code + Enter → added ("3*CODE" adds three) · ↑/↓ pick a search result · Esc clears
 *   F2 search · F4 cash received · F6 technician / customer · F9 or Ctrl+Enter complete sale
 *   after a sale: Enter / N new sale · P print again
 * The browser holds only { variantId, qty }; every change is re-priced by the server, and the
 * total the cashier saw is sent with the sale so a price change in between is caught.
 */

type Line = { variantId: string; qty: number };
type Props = {
  staffName: string;
  canNonCash: boolean;
  canDiscount: boolean;
  canApprove: boolean;
  shop: ShopHeader;
  recent: RecentSale[];
};

const rs = (n: number) => formatMoney(paisa(n));
const NON_CASH: CounterMethod[] = ["JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "POS_CARD"];
/** "12,500" / "12500" → 1250000 paisa; whole rupees only. */
const rupeesToPaisa = (s: string): number | null => {
  const clean = s.replace(/[,\s]/g, "").replace(/^rs\.?/i, "");
  return /^\d{1,9}$/.test(clean) ? Number(clean) * 100 : null;
};
const newKey = () => crypto.randomUUID();
const AUTO_PRINT_KEY = "caidea:pos:autoprint";
const AUTO_PRINT_EVENT = "caidea:pos:autoprint";
let memoryAutoPrint = true;
function readAutoPrint(): boolean {
  try {
    const v = window.localStorage.getItem(AUTO_PRINT_KEY);
    return v === null ? memoryAutoPrint : v !== "off";
  } catch {
    return memoryAutoPrint;
  }
}
function subscribeAutoPrint(cb: () => void) {
  window.addEventListener(AUTO_PRINT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(AUTO_PRINT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function PosTerminal({ staffName, canNonCash, canDiscount, canApprove, shop, recent: initialRecent }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  /** The server's price for a ticket, tagged with which ticket it was ("key"), so stale prices never show as current. */
  const [priced, setPriced] = useState<{ key: string; quote: TicketQuote | null } | null>(null);
  const [tier, setTier] = useState<"RETAIL" | "WHOLESALE">("RETAIL");
  const [query, setQuery] = useState("");
  /** Live search results and the text they are for (shown only while the box still holds that text). */
  const [found, setFound] = useState<{ text: string; items: CounterItem[] }>({ text: "", items: [] });
  const [highlight, setHighlight] = useState(0);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [method, setMethod] = useState<CounterMethod>("CASH");
  const [cash, setCash] = useState("");
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [phone, setPhone] = useState("");
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [techLookup, setTechLookup] = useState<"idle" | "none" | "found">("idle");
  const [newTech, setNewTech] = useState({ name: "", shopName: "", city: "" });
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ receipt: Receipt; changePaisa: number } | null>(null);
  const [recent, setRecent] = useState(initialRecent);
  const [ticketKey, setTicketKey] = useState(newKey);
  /** Bumped to ask the server for fresh prices without changing the ticket (after "price changed"). */
  const [repriceTick, setRepriceTick] = useState(0);
  const [pending, startTransition] = useTransition();

  const searchRef = useRef<HTMLInputElement>(null);
  const cashRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);
  const quoteSeq = useRef(0);
  const searchSeq = useRef(0);

  const autoPrint = useSyncExternalStore(subscribeAutoPrint, readAutoPrint, () => true);
  const toggleAutoPrint = (on: boolean) => {
    try {
      window.localStorage.setItem(AUTO_PRINT_KEY, on ? "on" : "off");
    } catch {
      /* storage blocked: the setting lasts until the page reloads */
      memoryAutoPrint = on;
    }
    window.dispatchEvent(new Event(AUTO_PRINT_EVENT));
  };

  // ── Server re-pricing on every change ──
  const ticketKeyForPrice = JSON.stringify([lines, tier]);
  useEffect(() => {
    if (lines.length === 0) return;
    const seq = ++quoteSeq.current;
    quoteTicketAction({ lines, tier }).then((q) => {
      if (seq !== quoteSeq.current) return; // a newer change is on its way
      setPriced({ key: JSON.stringify([lines, tier]), quote: q });
    });
  }, [lines, tier, repriceTick]);
  const upToDate = lines.length > 0 && priced?.key === ticketKeyForPrice && !!priced.quote;
  // Keep showing the last prices while new ones load (marked as updating), never after the ticket is cleared
  const quote = lines.length > 0 ? (priced?.quote ?? null) : null;

  const discountPaisa = canDiscount ? (rupeesToPaisa(discount) ?? 0) : 0;
  const subtotal = quote?.subtotalPaisa ?? 0;
  const total = Math.max(0, subtotal - discountPaisa);
  const cashPaisa = rupeesToPaisa(cash);
  const change = cashPaisa !== null ? cashPaisa - total : null;

  const blocker = useMemo((): string | null => {
    if (lines.length === 0) return "Scan or search for an item.";
    if (!upToDate) return "Updating prices…";
    if (!quote!.ready) return "Fix the items marked in red first.";
    if (tier === "WHOLESALE" && technician?.status !== "APPROVED") return "Wholesale needs an approved technician.";
    if (discountPaisa > 0 && discountReason.trim().length < 3) return "Write the reason for the discount.";
    if (discountPaisa >= subtotal && discountPaisa > 0) return "The discount must be less than the total.";
    if (discount && rupeesToPaisa(discount) === null) return "Discount: whole rupees, like 500.";
    if (method === "CASH") {
      if (cashPaisa === null) return "Enter the cash received (F4).";
      if (cashPaisa < total) return `Cash received is less than ${rs(total)}.`;
    } else {
      if (!/^[A-Za-z0-9-]{6,30}$/.test(reference.trim())) return "Enter the transaction ID (6–30 letters or numbers).";
      if (!confirmed) return "Confirm the transaction ID is genuine and checked.";
    }
    return null;
  }, [lines.length, upToDate, quote, tier, technician, discountPaisa, discountReason, subtotal, discount, method, cashPaisa, total, reference, confirmed]);

  // ── Adding items ──
  const addItem = useCallback((item: CounterItem, qty = 1, clearBox = true) => {
    if (item.stock <= 0) {
      setSearchNote(`${item.brand} ${item.model} (${item.color}) is out of stock.`);
      return;
    }
    setLines((prev) => {
      const at = prev.findIndex((l) => l.variantId === item.variantId);
      if (at === -1) return [...prev, { variantId: item.variantId, qty: Math.min(qty, 99) }];
      return prev.map((l, i) => (i === at ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
    });
    setSearchNote(`Added ${qty > 1 ? `${qty} × ` : ""}${item.brand} ${item.model} — ${item.color}`);
    if (clearBox) setQuery("");
    setHighlight(0);
    setError(null);
    searchRef.current?.focus();
  }, []);

  const parseQuery = (raw: string) => {
    const m = /^(\d{1,2})\s*[*x×]\s*(.+)$/i.exec(raw.trim());
    return m ? { qty: Math.max(1, Number(m[1])), text: m[2]!.trim() } : { qty: 1, text: raw.trim() };
  };

  const queryText = parseQuery(query).text;
  const results = queryText.length >= 2 && found.text === queryText ? found.items : [];

  // Live results while typing (a scanner's Enter is handled straight away below)
  useEffect(() => {
    const { text } = parseQuery(query);
    if (text.length < 2) return;
    const seq = ++searchSeq.current;
    const t = setTimeout(() => {
      searchItemsAction(text).then((items) => {
        if (seq !== searchSeq.current) return;
        setFound({ text, items });
        setHighlight(0);
      });
    }, 160);
    return () => clearTimeout(t);
  }, [query]);

  /**
   * Enter in the search box. Reads the box itself (a scanner's last character may not have re-rendered
   * yet), clears it at once so the next scan can start, and applies every lookup — two quick scans both land.
   */
  const onSearchEnter = async () => {
    const box = searchRef.current;
    const { qty, text } = parseQuery(box?.value ?? query);
    if (!text) return;
    // The cashier was choosing from the list on screen for this text: take the highlighted one
    if (results.length && found.text === text) {
      const pick = results.find((i) => i.exact) ?? results[highlight];
      if (pick) return addItem(pick, qty);
    }
    searchSeq.current++; // a live search still on its way is no longer wanted
    setQuery("");
    if (box) box.value = "";
    const items = await searchItemsAction(text);
    const exact = items.find((i) => i.exact);
    if (exact) return addItem(exact, qty, false);
    if (items.length === 1) return addItem(items[0]!, qty, false);
    if (items.length === 0) {
      setSearchNote(`Nothing found for “${text}”.`);
      return;
    }
    // Several matches: put the text back (unless the next scan has started) and show the list
    if (!searchRef.current?.value) {
      setQuery(text);
      setFound({ text, items });
      setHighlight(0);
    }
    setSearchNote("Several matches — pick one with ↑ ↓ and press Enter.");
  };

  const setQty = (variantId: string, qty: number) => setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(1, Math.min(99, qty || 1)) } : l)));
  const remove = (variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
    searchRef.current?.focus();
  };

  // ── Technician (wholesale) and customer ──
  const lookUp = async () => {
    const p = phone.trim();
    if (!p) return;
    const t = await findTechnicianAction(p);
    setTechnician(t);
    setTechLookup(t ? "found" : "none");
    if (t?.status === "APPROVED") setTier("WHOLESALE");
    else setTier("RETAIL");
  };
  const saveTechnician = () =>
    startTransition(async () => {
      const r = await addTechnicianAction({ ...newTech, phone });
      if (!r.ok) return setError(r.message);
      setTechnician(r.value);
      setTechLookup("found");
      setTier(r.value.status === "APPROVED" ? "WHOLESALE" : "RETAIL");
      setError(null);
    });
  const approve = () =>
    startTransition(async () => {
      if (!technician) return;
      const r = await approveTechnicianAction(technician.id);
      if (!r.ok) return setError(r.message);
      setTechnician(r.value);
      setTier("WHOLESALE");
    });
  const clearCustomer = () => {
    setPhone("");
    setTechnician(null);
    setTechLookup("idle");
    setTier("RETAIL");
    setCustomerName("");
  };

  // ── Complete ──
  const complete = () => {
    if (pending || done) return;
    if (blocker) {
      setError(blocker);
      return;
    }
    startTransition(async () => {
      const r = await completeSaleAction({
        idempotencyKey: ticketKey,
        lines,
        tier,
        technicianPhone: tier === "WHOLESALE" ? technician?.phone : undefined,
        customerName: tier === "RETAIL" ? customerName || undefined : undefined,
        customerPhone: tier === "RETAIL" && phone.trim() ? phone : undefined,
        method,
        cashReceivedPaisa: method === "CASH" ? (cashPaisa ?? undefined) : undefined,
        reference: method === "CASH" ? undefined : reference.trim(),
        referenceConfirmed: method === "CASH" ? undefined : confirmed,
        discountPaisa,
        discountReason: discountPaisa > 0 ? discountReason.trim() : undefined,
        expectedTotalPaisa: total,
      });
      if (!r.ok) {
        setError(r.message);
        if (r.kind === "PRICE_CHANGED" || r.kind === "SOLD_OUT") {
          setPriced(null); // re-price now
          setRepriceTick((n) => n + 1);
        }
        return;
      }
      const { sale, receipt } = r.value;
      setDone({ receipt, changePaisa: sale.changePaisa });
      setError(null);
      if (!sale.repeated) setRecent((prev) => [{ orderId: sale.orderId, code: sale.code, placedAt: receipt.placedAt, totalPaisa: sale.totalPaisa, method: receipt.method, items: receipt.items.reduce((n, i) => n + i.qty, 0), cashier: receipt.cashierName, tier: receipt.tier }, ...prev].slice(0, 20));
    });
  };

  const newSale = useCallback(() => {
    setLines([]);
    setPriced(null);
    setTier("RETAIL");
    setMethod("CASH");
    setCash("");
    setReference("");
    setConfirmed(false);
    setDiscount("");
    setDiscountReason("");
    setPhone("");
    setTechnician(null);
    setTechLookup("idle");
    setNewTech({ name: "", shopName: "", city: "" });
    setCustomerName("");
    setError(null);
    setSearchNote(null);
    setDone(null);
    setTicketKey(newKey());
    setTimeout(() => searchRef.current?.focus(), 0);
  }, []);

  // Print once the receipt is on the page
  useEffect(() => {
    if (done && autoPrint) {
      const t = setTimeout(() => window.print(), 150);
      return () => clearTimeout(t);
    }
  }, [done, autoPrint]);

  // ── Keyboard shortcuts ──
  const completeRef = useRef(complete);
  useEffect(() => {
    completeRef.current = complete;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) {
        const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
        if (e.key === "Enter" || (!typing && e.key.toLowerCase() === "n")) {
          e.preventDefault();
          newSale();
        } else if (!typing && e.key.toLowerCase() === "p") {
          e.preventDefault();
          window.print();
        }
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        (method === "CASH" ? cashRef : refRef).current?.focus();
      } else if (e.key === "F6") {
        e.preventDefault();
        phoneRef.current?.focus();
      } else if (e.key === "F9" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        completeRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, method, newSale]);

  const quickCash = useMemo(() => {
    if (total <= 0) return [];
    const r = total / 100;
    const ups = [500, 1000, 5000].map((step) => Math.ceil(r / step) * step).filter((v) => v > r);
    return [...new Set([r, ...ups])].slice(0, 4);
  }, [total]);

  return (
    <>
      <div className="print:hidden">
        {done ? (
          <SaleDone done={done} autoPrint={autoPrint} onNew={newSale} shop={shop} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
            {/* ── Left: scan + ticket ── */}
            <section aria-label="Ticket" className="min-w-0">
              <div className="relative">
                <label htmlFor="pos-search" className="sr-only">
                  Scan barcode or search
                </label>
                <input
                  id="pos-search"
                  ref={searchRef}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchNote(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      void onSearchEnter();
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlight((h) => Math.min(h + 1, Math.max(0, results.length - 1)));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlight((h) => Math.max(h - 1, 0));
                    } else if (e.key === "Escape") {
                      setQuery("");
                    }
                  }}
                  placeholder="Scan barcode or type SKU / model…  (3*SKU adds three)"
                  className="h-14 w-full rounded-full border-2 border-midnight bg-white px-6 text-lg text-midnight placeholder:text-midnight/45 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  aria-controls="pos-results"
                  aria-activedescendant={results[highlight] ? `pos-r-${results[highlight]!.variantId}` : undefined}
                />
                {results.length > 0 && (
                  <ul id="pos-results" role="listbox" aria-label="Search results" className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-[26rem] overflow-y-auto rounded-bezel bg-white p-2 shadow-[0_18px_40px_-18px_rgb(11_28_51/0.45)] ring-1 ring-midnight/10">
                    {results.map((r, i) => (
                      <li
                        key={r.variantId}
                        id={`pos-r-${r.variantId}`}
                        role="option"
                        aria-selected={i === highlight}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addItem(r);
                        }}
                        onMouseEnter={() => setHighlight(i)}
                        className={cn("flex cursor-pointer items-center gap-3 rounded-bezel-sm px-4 py-2.5", i === highlight && "bg-surface", r.stock === 0 && "opacity-55")}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {r.brand} {r.model} <span className="font-normal text-midnight/70">— {r.color}{r.variantLabel ? `, ${r.variantLabel}` : ""}</span>
                          </p>
                          <p className="text-xs text-midnight/60">
                            {r.sku} · {r.grade}
                            {r.bin ? ` · Shelf ${r.bin}` : ""}
                          </p>
                        </div>
                        <span className={cn("text-sm font-semibold", r.stock === 0 ? "text-terracotta" : "text-midnight/70")}>{r.stock === 0 ? "Out of stock" : `${r.stock} in stock`}</span>
                        <span className="w-24 text-right font-semibold">{rs(tier === "WHOLESALE" ? r.wholesalePaisa : r.retailPaisa)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-2 min-h-5 pl-2 text-sm text-midnight/70" role="status" aria-live="polite">
                {searchNote}
              </p>

              <div className="mt-3 overflow-hidden rounded-bezel bg-white ring-1 ring-midnight/8">
                {lines.length === 0 ? (
                  <div className="px-6 py-16 text-center text-midnight/60">
                    <p className="font-display text-xl font-bold text-midnight">Ready for the next customer</p>
                    <p className="mt-2">Scan a barcode or type a SKU or model, then press Enter.</p>
                  </div>
                ) : (
                  <table className="w-full text-[0.9375rem]">
                    <thead className="bg-surface text-left text-sm text-midnight/70">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Item</th>
                        <th className="w-24 px-2 py-2.5 font-semibold">Qty</th>
                        <th className="px-2 py-2.5 text-right font-semibold">Price</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => {
                        const q = quote?.lines.find((x) => x.variantId === l.variantId);
                        const gone = quote?.missing.includes(l.variantId);
                        return (
                          <tr key={l.variantId} className="border-t border-midnight/8 align-middle">
                            <td className="px-4 py-3">
                              {q ? (
                                <>
                                  <p className="font-semibold">
                                    {q.brand} {q.model} <span className="font-normal text-midnight/70">— {q.color}{q.variantLabel ? `, ${q.variantLabel}` : ""}</span>
                                  </p>
                                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-midnight/60">
                                    <span>{q.sku}</span>
                                    <GradeBadge grade={q.grade} className="scale-90" />
                                    {q.short ? <span className="font-semibold text-terracotta">Only {q.stock} left — lower the quantity</span> : <span>{q.stock} in stock</span>}
                                  </p>
                                </>
                              ) : gone ? (
                                <p className="font-semibold text-terracotta">No longer on sale — remove this line</p>
                              ) : (
                                <p className="text-midnight/50">Loading…</p>
                              )}
                            </td>
                            <td className="px-2 py-3">
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={l.qty}
                                onChange={(e) => setQty(l.variantId, Number(e.target.value))}
                                aria-label={`Quantity${q ? ` of ${q.brand} ${q.model} ${q.color}` : ""}`}
                                className={cn("h-10 w-18 rounded-full border bg-white px-3 text-center", q?.short ? "border-terracotta text-terracotta" : "border-midnight/20")}
                              />
                            </td>
                            <td className="px-2 py-3 text-right whitespace-nowrap">
                              {q && (
                                <>
                                  {tier === "RETAIL" && q.listPaisa > q.unitPaisa && <span className="mr-1.5 text-sm text-midnight/45 line-through">{rs(q.listPaisa)}</span>}
                                  {rs(q.unitPaisa)}
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{q ? rs(q.lineTotalPaisa) : ""}</td>
                            <td className="pr-3">
                              <button type="button" onClick={() => remove(l.variantId)} aria-label="Remove line" className="grid size-8 place-items-center rounded-full text-midnight/60 hover:bg-terracotta/10 hover:text-terracotta">
                                <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <p className="mt-4 text-xs text-midnight/60">
                <Kbd>Enter</Kbd> add · <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> pick · <Kbd>Esc</Kbd> clear · <Kbd>F2</Kbd> search · <Kbd>F4</Kbd> cash / ID · <Kbd>F6</Kbd> customer · <Kbd>F9</Kbd> or <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> complete
              </p>

              <RecentList recent={recent} />
            </section>

            {/* ── Right: customer, payment, total ── */}
            <aside aria-label="Payment" className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
              <div className="rounded-bezel bg-midnight p-5 text-canvas">
                {discountPaisa > 0 && (
                  <>
                    <p className="flex justify-between text-sm text-canvas/75">
                      <span>Subtotal</span>
                      <span>{rs(subtotal)}</span>
                    </p>
                    <p className="flex justify-between text-sm text-canvas/75">
                      <span>Discount</span>
                      <span>− {rs(discountPaisa)}</span>
                    </p>
                  </>
                )}
                <p className="flex items-baseline justify-between">
                  <span>
                    Total · {quote?.itemCount ?? 0} item{quote?.itemCount === 1 ? "" : "s"}
                    {tier === "WHOLESALE" && <span className="ml-2 rounded-full bg-amber px-2 py-0.5 text-xs font-semibold text-midnight">Wholesale</span>}
                  </span>
                  <span className="font-display text-3xl font-bold" data-testid="pos-total">
                    {rs(total)}
                  </span>
                </p>
                {error && (
                  <p role="alert" className="mt-3 rounded-bezel-sm bg-white px-4 py-2.5 text-sm font-semibold text-terracotta">
                    {error}
                  </p>
                )}
                <button type="button" onClick={complete} disabled={pending} className={buttonClasses("urgent", "lg", "mt-4 w-full")} aria-describedby="pos-blocker">
                  {pending ? "Saving…" : `Complete sale${total > 0 ? ` · ${rs(total)}` : ""}`}
                </button>
                <p id="pos-blocker" className="mt-2 min-h-5 text-center text-sm text-canvas/70">
                  {blocker && blocker !== error ? blocker : blocker ? "" : "F9 or Ctrl+Enter"}
                </p>
              </div>
              <div className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Customer</h2>
                  <div role="radiogroup" aria-label="Price" className="flex rounded-full bg-surface p-1 text-sm font-semibold">
                    {(["RETAIL", "WHOLESALE"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={tier === t}
                        disabled={t === "WHOLESALE" && technician?.status !== "APPROVED"}
                        title={t === "WHOLESALE" && technician?.status !== "APPROVED" ? "Find an approved technician by mobile number first" : undefined}
                        onClick={() => setTier(t)}
                        className={cn("rounded-full px-3.5 py-1.5 disabled:opacity-40", tier === t ? "bg-midnight text-canvas" : "text-midnight/70")}
                      >
                        {t === "RETAIL" ? "Retail" : "Wholesale"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <label htmlFor="pos-phone" className="sr-only">
                    Customer or technician mobile
                  </label>
                  <input
                    id="pos-phone"
                    ref={phoneRef}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (techLookup !== "idle") {
                        setTechLookup("idle");
                        setTechnician(null);
                        setTier("RETAIL");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.ctrlKey) {
                        e.preventDefault();
                        void lookUp();
                      }
                    }}
                    placeholder="Mobile (optional) — 0300 1234567"
                    className="h-10 min-w-0 flex-1 rounded-full border border-midnight/20 bg-white px-4 text-[0.9375rem] focus:border-midnight focus:outline-none"
                  />
                  <Button size="sm" variant="outline" onClick={() => void lookUp()} disabled={!phone.trim()}>
                    Find
                  </Button>
                </div>
                {techLookup === "found" && technician && (
                  <div className="mt-3 rounded-bezel-sm bg-surface px-4 py-3 text-sm">
                    <p className="font-semibold">
                      {technician.name} · {technician.shopName}
                    </p>
                    <p className="mt-1 flex items-center gap-2">
                      Technician
                      <Badge tone={technician.status === "APPROVED" ? "stock" : "out"}>{technician.status === "APPROVED" ? "Approved — wholesale" : technician.status === "PENDING" ? "Waiting for approval" : "Rejected"}</Badge>
                    </p>
                    {technician.status === "PENDING" && (canApprove ? <Button size="sm" className="mt-2" onClick={approve} disabled={pending}>Approve now</Button> : <p className="mt-1 text-midnight/70">Retail prices until a manager approves.</p>)}
                  </div>
                )}
                {techLookup === "none" && (
                  <div className="mt-3 rounded-bezel-sm bg-surface px-4 py-3 text-sm">
                    <p>Not a registered technician. Sell at retail (name optional), or register them:</p>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" aria-label="Customer name" className="mt-2 h-9 w-full rounded-full border border-midnight/20 bg-white px-4" />
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold underline underline-offset-4">Register as technician</summary>
                      <div className="mt-2 flex flex-col gap-2">
                        <input value={newTech.name} onChange={(e) => setNewTech({ ...newTech, name: e.target.value })} placeholder="Technician name" aria-label="Technician name" className="h-9 rounded-full border border-midnight/20 bg-white px-4" />
                        <input value={newTech.shopName} onChange={(e) => setNewTech({ ...newTech, shopName: e.target.value })} placeholder="Repair shop name" aria-label="Repair shop name" className="h-9 rounded-full border border-midnight/20 bg-white px-4" />
                        <input value={newTech.city} onChange={(e) => setNewTech({ ...newTech, city: e.target.value })} placeholder="City (optional)" aria-label="City" className="h-9 rounded-full border border-midnight/20 bg-white px-4" />
                        <Button size="sm" onClick={saveTechnician} disabled={pending}>
                          {canApprove ? "Register and approve" : "Register (manager approves)"}
                        </Button>
                      </div>
                    </details>
                  </div>
                )}
                {techLookup !== "idle" && (
                  <button type="button" onClick={clearCustomer} className="mt-2 text-sm text-midnight/60 underline underline-offset-4">
                    Clear customer
                  </button>
                )}
              </div>

              <div className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
                <h2 className="font-semibold">Payment</h2>
                <div role="radiogroup" aria-label="Payment method" className="mt-3 flex flex-wrap gap-2">
                  {(["CASH", ...(canNonCash ? NON_CASH : [])] as CounterMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={method === m}
                      onClick={() => {
                        setMethod(m);
                        setConfirmed(false);
                      }}
                      className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", method === m ? "border-midnight bg-midnight text-canvas" : "border-midnight/20 hover:border-midnight/45")}
                    >
                      {COUNTER_METHOD_LABEL[m]}
                    </button>
                  ))}
                </div>
                {!canNonCash && <p className="mt-2 text-xs text-midnight/60">Cash only at your till. JazzCash, bank and card payments are taken by the owner.</p>}

                {method === "CASH" ? (
                  <div className="mt-4">
                    <label htmlFor="pos-cash" className="pl-1 text-sm font-semibold">
                      Cash received <span className="font-normal text-midnight/60">(F4)</span>
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-midnight/60">Rs</span>
                      <input
                        id="pos-cash"
                        ref={cashRef}
                        inputMode="numeric"
                        autoComplete="off"
                        value={cash}
                        onChange={(e) => setCash(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            complete();
                          }
                        }}
                        className="h-12 min-w-0 flex-1 rounded-full border-2 border-midnight/25 bg-white px-5 text-right text-xl font-semibold focus:border-midnight focus:outline-none"
                        aria-describedby="pos-change"
                      />
                    </div>
                    {quickCash.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {quickCash.map((v, i) => (
                          <button key={v} type="button" onClick={() => setCash(String(v))} className="rounded-full bg-surface px-3 py-1 text-sm font-semibold hover:bg-midnight/10">
                            {i === 0 ? "Exact" : rs(v * 100)}
                          </button>
                        ))}
                      </div>
                    )}
                    <p id="pos-change" className="mt-3 flex items-baseline justify-between text-lg" aria-live="polite">
                      <span>Change</span>
                      <span className={cn("font-display text-2xl font-bold", change !== null && change < 0 && "text-terracotta")}>{change === null ? "—" : change < 0 ? `${rs(-change)} short` : rs(change)}</span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    <label htmlFor="pos-ref" className="pl-1 text-sm font-semibold">
                      Transaction ID {method === "POS_CARD" ? "(card slip / RRN)" : ""}
                    </label>
                    <input id="pos-ref" ref={refRef} autoComplete="off" value={reference} onChange={(e) => setReference(e.target.value)} className="h-11 rounded-full border-2 border-midnight/25 bg-white px-5 font-semibold tracking-wide uppercase focus:border-midnight focus:outline-none" />
                    <label className="mt-1 flex items-start gap-2.5 rounded-bezel-sm bg-terracotta/8 px-4 py-3 text-sm">
                      <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-4 accent-terracotta" />
                      <span>
                        <strong>I confirm this transaction ID is genuine</strong> and I checked that {rs(total)} arrived in the shop’s {COUNTER_METHOD_LABEL[method]} account.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {canDiscount && (
                <details className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8" open={!!discount}>
                  <summary className="cursor-pointer font-semibold">Manager discount</summary>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-midnight/60">Rs</span>
                      <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" placeholder="0" aria-label="Discount in rupees" className="h-10 min-w-0 flex-1 rounded-full border border-midnight/20 bg-white px-4 text-right" />
                    </div>
                    <input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="Reason (required)" aria-label="Discount reason" maxLength={200} className="h-10 rounded-full border border-midnight/20 bg-white px-4" />
                  </div>
                </details>
              )}

              <label className="flex items-center gap-2 pl-2 text-sm text-midnight/70">
                <input type="checkbox" checked={autoPrint} onChange={(e) => toggleAutoPrint(e.target.checked)} className="size-4 accent-midnight" />
                Print the receipt automatically
              </label>
              <p className="pl-2 text-xs text-midnight/50">Till: {staffName}</p>
            </aside>
          </div>
        )}
      </div>

      {done && (
        <PrintableReceipt offscreen>
          <CounterReceipt receipt={done.receipt} shop={shop} />
        </PrintableReceipt>
      )}
    </>
  );
}

function SaleDone({ done, autoPrint, onNew, shop }: { done: { receipt: Receipt; changePaisa: number }; autoPrint: boolean; onNew: () => void; shop: ShopHeader }) {
  const r = done.receipt;
  const newRef = useRef<HTMLButtonElement>(null);
  useEffect(() => newRef.current?.focus(), []);
  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_auto]">
      <div className="rounded-bezel-lg bg-midnight p-8 text-canvas">
        <p className="text-sm font-semibold text-canvas/70">Sale complete · {r.code}</p>
        {r.method === "CASH" ? (
          <>
            <p className="mt-6 text-canvas/80">Give change</p>
            <p className="font-display text-6xl font-bold" data-testid="pos-change">
              {rs(done.changePaisa)}
            </p>
            <p className="mt-2 text-canvas/70">
              Total {rs(r.totalPaisa)} · cash received {rs(r.cashReceivedPaisa ?? 0)}
            </p>
          </>
        ) : (
          <>
            <p className="mt-6 font-display text-5xl font-bold">{rs(r.totalPaisa)}</p>
            <p className="mt-2 text-canvas/70">
              Paid by {COUNTER_METHOD_LABEL[r.method]} · {r.reference}
            </p>
          </>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <button ref={newRef} type="button" onClick={onNew} className={buttonClasses("inverse", "lg")}>
            New sale <Kbd>Enter</Kbd>
          </button>
          <button type="button" onClick={() => window.print()} className={buttonClasses("inverse", "lg")}>
            Print receipt <Kbd>P</Kbd>
          </button>
        </div>
        <p className="mt-4 text-sm text-canvas/60">{autoPrint ? "The receipt was sent to the printer." : "Automatic printing is off."}</p>
      </div>
      <div className="hidden rounded-bezel bg-white p-4 shadow-[0_18px_40px_-24px_rgb(11_28_51/0.4)] ring-1 ring-midnight/8 md:block">
        <CounterReceipt receipt={r} shop={shop} />
      </div>
    </div>
  );
}

function RecentList({ recent }: { recent: RecentSale[] }) {
  if (recent.length === 0) return null;
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Today’s sales</h2>
        <Link href="/admin/counter-sale/summary" className="text-sm font-semibold underline underline-offset-4">
          End of day
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-midnight/8 rounded-bezel bg-white text-sm ring-1 ring-midnight/8">
        {recent.slice(0, 8).map((s) => (
          <li key={s.orderId} className="flex items-center gap-3 px-4 py-2.5">
            <Link href={`/admin/counter-sale/receipt/${s.code}`} className="font-semibold underline-offset-4 hover:underline">
              {s.code}
            </Link>
            <span className="text-midnight/60">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" }).format(parseTimestamp(s.placedAt))}</span>
            <span className="text-midnight/60">
              {s.items} item{s.items === 1 ? "" : "s"} · {COUNTER_METHOD_LABEL[s.method]}
              {s.tier === "WHOLESALE" ? " · wholesale" : ""}
            </span>
            <span className="ml-auto font-semibold">{rs(s.totalPaisa)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="mx-0.5 inline-block rounded-md border border-midnight/20 bg-white px-1.5 py-0.5 font-sans text-[0.75rem] font-semibold text-midnight/80">{children}</kbd>;
}
