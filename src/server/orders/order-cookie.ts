import "server-only";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { CODE_RE, orderCookieName, orderIdForToken } from "./access";

/** "CA-ORD-261003-0001" from a URL segment, or null. */
export function cleanOrderCode(raw: string): string | null {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const c = s.trim().toUpperCase().slice(0, 40);
  return CODE_RE.test(c) ? c : null;
}

/** Order id if this browser holds a valid private token for `code` (v1.11 §23). */
export async function orderIdFromCookie(code: string): Promise<string | null> {
  const token = (await cookies()).get(orderCookieName(code))?.value;
  return orderIdForToken(db, code, token);
}
