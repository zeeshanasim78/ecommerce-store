import type { ApiCourier } from "@/db/schema/logistics";
import { CourierError, type FetchLike } from "./types";

/**
 * One HTTP call to a courier: 20-second timeout, JSON or PDF, plain-English errors.
 * Request bodies (which carry the API keys) are never put into an error message.
 */
export const COURIER_TIMEOUT_MS = 20_000;
const MAX_BYTES = 10 * 1024 * 1024;

type Kind = "json" | "pdf";

export async function courierRequest(courier: ApiCourier, fetchImpl: FetchLike, url: string, init: RequestInit & { expect?: Kind } = {}): Promise<unknown> {
  const { expect = "json", ...rest } = init;
  let res: Response;
  try {
    res = await fetchImpl(url, { ...rest, signal: AbortSignal.timeout(COURIER_TIMEOUT_MS), redirect: "error", cache: "no-store" });
  } catch (e) {
    const name = (e as Error).name;
    throw new CourierError(name === "TimeoutError" || name === "AbortError" ? `${label(courier)} didn’t answer within ${COURIER_TIMEOUT_MS / 1000} seconds. Try again, or book on the courier’s portal and paste the CN.` : `Couldn’t reach ${label(courier)} (${(e as Error).message.slice(0, 120)}). Check the shop’s internet connection.`, courier);
  }
  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) throw new CourierError(`${label(courier)} sent an unexpectedly large reply.`, courier);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) throw new CourierError(`${label(courier)} sent an unexpectedly large reply.`, courier);
  const type = res.headers.get("content-type") ?? "";

  if (expect === "pdf") {
    const isPdf = buf.byteLength > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
    if (res.ok && isPdf) return buf;
    throw new CourierError(`${label(courier)} didn’t send a PDF (${res.status}${errorText(buf, type) ? `: ${errorText(buf, type)}` : ""}).`, courier);
  }

  let body: unknown = null;
  try {
    body = JSON.parse(new TextDecoder().decode(buf));
  } catch {
    // fall through
  }
  if (res.status === 401 || res.status === 403) throw new CourierError(`${label(courier)} refused the API key (${res.status}). Check the keys in the environment file.`, courier);
  if (!res.ok) throw new CourierError(`${label(courier)} answered ${res.status}${errorText(buf, type) ? `: ${errorText(buf, type)}` : ""}.`, courier);
  if (body === null || typeof body !== "object") throw new CourierError(`${label(courier)} sent a reply the shop couldn’t read.`, courier);
  return body;
}

function errorText(buf: Uint8Array, type: string): string {
  const raw = new TextDecoder().decode(buf.slice(0, 2000));
  if (type.includes("json")) {
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      const m = j.statusMessage ?? j.message ?? j.error ?? j.errors;
      if (m) return clean(typeof m === "string" ? m : JSON.stringify(m));
    } catch {
      /* ignore */
    }
  }
  return type.includes("html") ? "" : clean(raw);
}

/** Courier text shown to staff: one line, no control characters, short. */
export const clean = (s: unknown, max = 200) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const label = (c: ApiCourier) => (c === "LEOPARDS" ? "Leopards" : "PostEx");

/** Reads a field that couriers spell in several ways ("track_number", "trackNumber", "Track Number"). */
export function pick(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) if (rec[k] !== undefined && rec[k] !== null) return rec[k];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const wanted = new Set(keys.map(norm));
  for (const [k, v] of Object.entries(rec)) if (wanted.has(norm(k)) && v !== undefined && v !== null) return v;
  return undefined;
}

export const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v && typeof v === "object" ? [v] : []);
