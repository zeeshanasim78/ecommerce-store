import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { cookieOptions, orderCookieName, orderIdForToken } from "@/server/orders/access";
import { cleanOrderCode } from "@/server/orders/order-cookie";
import { clientIp, rateLimit } from "@/server/rate-limit";

/**
 * The private link in the order email: /order/CODE/open?t=TOKEN (v1.11 §23).
 * A valid token is moved into an httpOnly cookie and the browser is sent to the clean address,
 * so the token doesn't stay in the address bar, history or Referer headers.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = cleanOrderCode((await params).code);
  const base = new URL(request.url);
  if (!code) return NextResponse.redirect(new URL("/order", base), 303);
  const target = new URL(`/order/${code}`, base);
  const limited = !rateLimit(`order-link:${clientIp(request.headers)}`, 30, 10 * 60_000).ok;
  const token = request.nextUrl.searchParams.get("t");
  if (limited || !orderIdForToken(db, code, token)) {
    target.searchParams.set("link", "expired");
    return noStore(NextResponse.redirect(target, 303));
  }
  const res = NextResponse.redirect(target, 303);
  res.cookies.set(orderCookieName(code), token!, cookieOptions());
  return noStore(res);
}

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
