import { createHmac, timingSafeEqual } from "node:crypto";
import { SignatureError } from "./types";

/**
 * Webhook signatures — SPECIFICATION §11 rule 5, §31.
 * Header `X-Gateway-Signature: t=<unix seconds>,v1=<hex>` where v1 = HMAC-SHA256(secret, `${t}.${rawBody}`).
 * Verified on the raw body, in constant time, with a timestamp tolerance so an old capture can't be replayed.
 * (Replays inside the tolerance are stopped by the event-id de-duplication in online.ts.)
 */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export function signPayload(secret: string, timestampSeconds: number, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestampSeconds}.${rawBody}`).digest("hex");
}

export function signatureHeader(secret: string, rawBody: string, timestampSeconds = Math.floor(Date.now() / 1000)): string {
  return `t=${timestampSeconds},v1=${signPayload(secret, timestampSeconds, rawBody)}`;
}

/** Throws SignatureError unless the header is valid for this exact body. */
export function verifySignature(header: string | null, rawBody: string, secret: string, now: Date, toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS): void {
  if (!header || !secret) throw new SignatureError("missing");
  let t: number | null = null;
  const candidates: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t" && /^\d{9,12}$/.test(v)) t = Number(v);
    else if (k === "v1" && /^[0-9a-f]{64}$/i.test(v)) candidates.push(v.toLowerCase());
  }
  if (t === null || candidates.length === 0) throw new SignatureError("malformed");
  if (Math.abs(Math.floor(now.getTime() / 1000) - t) > toleranceSeconds) throw new SignatureError("stale");
  const expected = Buffer.from(signPayload(secret, t, rawBody), "hex");
  const ok = candidates.some((c) => {
    const got = Buffer.from(c, "hex");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
  if (!ok) throw new SignatureError("mismatch");
}
