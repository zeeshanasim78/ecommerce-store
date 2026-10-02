"use server";

import { headers } from "next/headers";
import { db } from "@/db/client";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { CartInputSchema, quoteCart, type CartQuote } from "@/server/storefront/cart";

export type QuoteResponse = { ok: true; quote: CartQuote } | { ok: false; error: string };

/**
 * Re-prices the browser's cart from the database (read-only). Rate-limited per IP; coupon
 * checks have a tighter limit so codes can't be guessed by trying thousands of them.
 */
export async function getCartQuote(input: unknown): Promise<QuoteResponse> {
  const parsed = CartInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Your cart couldn’t be read. Try removing an item and adding it again." };

  const ip = clientIp(await headers());
  if (!rateLimit(`cart:${ip}`, 120, 60_000).ok) return { ok: false, error: "Too many refreshes. Wait a minute and reload the page." };

  const data = parsed.data;
  if (data.coupon) {
    const limit = rateLimit(`coupon:${ip}`, 20, 10 * 60_000);
    if (!limit.ok) {
      const quote = quoteCart(db, { lines: data.lines });
      return {
        ok: true,
        quote: { ...quote, coupon: { code: data.coupon, ok: false, reason: `Too many codes tried. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.` } },
      };
    }
  }
  return { ok: true, quote: quoteCart(db, data) };
}
