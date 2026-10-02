"use client";

import { useSyncExternalStore } from "react";

/**
 * The shopper's cart, kept in this browser only (BUILD_GUIDE M7): colour (variant) ids and
 * quantities — never prices, which the server works out every time (spec §6.3).
 * Storage can be unavailable (private mode, blocked site data); the cart then lives in memory
 * for the visit instead of failing.
 */

export type CartLine = { variantId: string; qty: number };
export type CartState = { lines: CartLine[]; coupon?: string };

const KEY = "caidea:cart:v1";
const EVENT = "caidea:cart";
export const MAX_LINES = 30;
export const MAX_QTY = 99;
const EMPTY: CartState = { lines: [] };

let memory: CartState = EMPTY;
let cachedRaw: string | null | undefined;
let cachedState: CartState = EMPTY;

function sanitize(value: unknown): CartState {
  if (!value || typeof value !== "object") return EMPTY;
  const v = value as { lines?: unknown; coupon?: unknown };
  const lines = Array.isArray(v.lines)
    ? v.lines
        .filter((l): l is CartLine => !!l && typeof l === "object" && typeof (l as CartLine).variantId === "string" && Number.isInteger((l as CartLine).qty))
        .map((l) => ({ variantId: l.variantId.slice(0, 64), qty: Math.min(MAX_QTY, Math.max(1, l.qty)) }))
        .slice(0, MAX_LINES)
    : [];
  const coupon = typeof v.coupon === "string" && v.coupon.trim() ? v.coupon.trim().slice(0, 40) : undefined;
  return coupon ? { lines, coupon } : { lines };
}

function read(): CartState {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return memory;
  }
  if (raw === cachedRaw) return cachedState; // stable snapshot for useSyncExternalStore
  cachedRaw = raw;
  try {
    cachedState = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

function write(next: CartState) {
  const clean = sanitize(next);
  memory = clean;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    /* storage blocked — keep the in-memory copy */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const cart = {
  get: read,
  add(variantId: string, qty: number) {
    const s = read();
    const existing = s.lines.find((l) => l.variantId === variantId);
    const lines = existing ? s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)) : [...s.lines, { variantId, qty: Math.min(MAX_QTY, qty) }];
    if (lines.length > MAX_LINES) return false;
    write({ ...s, lines });
    return true;
  },
  setQty(variantId: string, qty: number) {
    const s = read();
    write({ ...s, lines: qty <= 0 ? s.lines.filter((l) => l.variantId !== variantId) : s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)) });
  },
  remove(variantId: string) {
    cart.setQty(variantId, 0);
  },
  setCoupon(code: string | undefined) {
    write({ ...read(), coupon: code?.trim().toUpperCase() || undefined });
  },
  clear() {
    write(EMPTY);
  },
};

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange(); // another tab changed the cart
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Live cart state. On the server (and the first client render) it is empty, to avoid hydration mismatches. */
export function useCart(): CartState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(state: CartState): number {
  return state.lines.reduce((n, l) => n + l.qty, 0);
}
