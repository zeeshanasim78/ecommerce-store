import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { orderAccessTokens, orders } from "@/db/schema";

/**
 * Private access to an order's full details and PDF (v1.11, SPECIFICATION §23).
 *
 * The order number alone never shows personal data (Q39). Full details need either the checkout
 * phone number (existing /order lookup) or a private token:
 *   - 32 random bytes (256 bits), base64url; only its SHA-256 hash is stored, so a copy of the
 *     database can't be used to open orders;
 *   - valid for 30 days;
 *   - kept in an httpOnly cookie in the browser that placed the order (or proved the phone number),
 *     and in the link in the customer's order email. The link is swapped for the cookie on first
 *     use and the browser is redirected to a clean address, so the token never sits in history.
 */

export const ORDER_TOKEN_DAYS = 30;
export const ORDER_TOKEN_TTL_MS = ORDER_TOKEN_DAYS * 24 * 3600_000;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const CODE_RE = /^CA-ORD-\d{6}-\d{4,6}$/;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Cookie name per order, so several orders from one browser all stay open. */
export const orderCookieName = (code: string) => `caidea_order_${code.replace(/[^A-Z0-9]/gi, "").toLowerCase()}`;

export function issueOrderToken(db: DB | Tx, orderId: string, now: Date = new Date()): string {
  const token = randomBytes(32).toString("base64url");
  db.insert(orderAccessTokens)
    .values({
      orderId,
      tokenHash: hash(token),
      expiresAt: new Date(now.getTime() + ORDER_TOKEN_TTL_MS).toISOString(),
      createdAt: now.toISOString(),
    })
    .run();
  // Housekeeping: expired tokens are useless, remove them as we go
  db.delete(orderAccessTokens).where(lt(orderAccessTokens.expiresAt, now.toISOString())).run();
  return token;
}

/** The order id if `token` opens order `code` and hasn't expired, otherwise null. Constant work either way. */
export function orderIdForToken(db: DB | Tx, code: string, token: string | undefined | null, now: Date = new Date()): string | null {
  const c = code.trim().toUpperCase();
  if (!token || !TOKEN_RE.test(token) || !CODE_RE.test(c)) return null;
  const row = db
    .select({ orderId: orderAccessTokens.orderId })
    .from(orderAccessTokens)
    .innerJoin(orders, eq(orders.id, orderAccessTokens.orderId))
    .where(and(eq(orderAccessTokens.tokenHash, hash(token)), eq(orders.code, c), eq(orders.channel, "ONLINE"), gt(orderAccessTokens.expiresAt, now.toISOString())))
    .get();
  return row?.orderId ?? null;
}

export const cookieOptions = (now: Date = new Date()) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  expires: new Date(now.getTime() + ORDER_TOKEN_TTL_MS),
});
