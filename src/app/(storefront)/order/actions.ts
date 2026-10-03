"use server";

import { cookies, headers } from "next/headers";
import { db } from "@/db/client";
import { cookieOptions, issueOrderToken, orderCookieName } from "@/server/orders/access";
import { findCustomerOrder, submitTransactionIdForOrder, TidError } from "@/server/orders/checkout";
import { cleanOrderCode, orderIdFromCookie } from "@/server/orders/order-cookie";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type LookupState = { opened?: string; error?: string };
export type TidState = { done?: boolean; error?: string };

/**
 * Order lookup needs the code AND the checkout phone number; rate-limited so codes can't be tried
 * in bulk. On success this browser gets the order's private cookie (v1.11 §23) and the page reloads
 * with the full details and the PDF download.
 */
export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .slice(0, 40);
  const phone = String(formData.get("phone") ?? "")
    .trim()
    .slice(0, 30);
  if (!code || !phone)
    return {
      error: "Enter your order number and the phone number you ordered with.",
    };
  const ip = clientIp(await headers());
  if (!rateLimit(`track:${ip}`, 15, 10 * 60_000).ok) return { error: "Too many tries. Please wait 10 minutes, or call us." };
  const found = findCustomerOrder(db, code, phone);
  if (!found)
    return {
      error: "We couldn’t find an order with that number and phone. Check both and try again.",
    };
  const token = issueOrderToken(db, found.order.id);
  (await cookies()).set(orderCookieName(found.order.code), token, cookieOptions());
  return { opened: found.order.code };
}

/** Customer adds the transaction ID later. Allowed only in a browser holding the order's private cookie. */
export async function addTransactionId(_prev: TidState, formData: FormData): Promise<TidState> {
  const code = cleanOrderCode(String(formData.get("code") ?? ""));
  const ip = clientIp(await headers());
  if (!rateLimit(`tid:${ip}`, 10, 10 * 60_000).ok) return { error: "Too many tries. Please wait 10 minutes, or call us." };
  const orderId = code ? await orderIdFromCookie(code) : null;
  if (!orderId)
    return {
      error: "Please open your order again (order number and phone) and retry.",
    };
  try {
    submitTransactionIdForOrder(db, orderId, {
      tid: String(formData.get("tid") ?? ""),
      payerPhone: String(formData.get("payerPhone") ?? ""),
    });
  } catch (e) {
    if (e instanceof TidError) return { error: e.message };
    throw e;
  }
  return { done: true };
}
