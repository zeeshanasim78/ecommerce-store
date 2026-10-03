"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/db/client";
import { sendOrderPlacedEmails } from "@/server/notify/order-emails";
import { cookieOptions, orderCookieName } from "@/server/orders/access";
import { placeOrder, type CheckoutResult } from "@/server/orders/checkout";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { revalidateStorefront } from "@/server/revalidate";

/** What the browser gets back: never the access token itself (it goes into an httpOnly cookie). */
export type PlaceOrderResponse = Exclude<CheckoutResult, { ok: true }> | { ok: true; code: string };

/** Place an order (spec §6.3). All the rules live in server/orders/checkout.ts. */
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResponse> {
  const ip = clientIp(await headers());
  if (!rateLimit(`checkout:${ip}`, 12, 10 * 60_000).ok) {
    return {
      ok: false,
      kind: "INVALID",
      message: "Too many attempts from this connection. Please wait a few minutes, or call us to order.",
    };
  }
  const result = placeOrder(db, input);
  if (!result.ok) return result;

  // v1.11 §23: this browser may open the full order details and PDF for 30 days
  (await cookies()).set(orderCookieName(result.code), result.accessToken, cookieOptions());
  if (!result.repeated) {
    revalidateStorefront(); // stock went down: refresh shop pages
    // Customer + sales emails after the response is sent — a slow or failing Gmail never blocks the order
    const { orderId, accessToken } = result;
    after(() => sendOrderPlacedEmails(db, orderId, accessToken));
  }
  return { ok: true, code: result.code };
}
