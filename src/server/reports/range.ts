import { sql, type SQL, type AnyColumn } from "drizzle-orm";

/**
 * Date ranges and SQL date helpers for reports (SPECIFICATION §29).
 * Everything is a Karachi calendar day (UTC+05:00, no daylight saving). Stored timestamps come in two
 * spellings — SQLite "2026-10-02 09:30:00" and ISO "2026-10-02T09:30:00.000Z" — both UTC; `utc()` makes
 * them comparable.
 */

export const MAX_RANGE_DAYS = 366;
const DAY = 86_400_000;
const PKT = 5 * 3_600_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const sqliteUtc = (ms: number) => new Date(ms).toISOString().replace("T", " ").slice(0, 19);
export const karachiDay = (ms: number) => new Date(ms + PKT).toISOString().slice(0, 10);
const dayStartMs = (day: string) => Date.parse(`${day}T00:00:00+05:00`);
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

export type ReportRange = {
  /** Karachi dates, inclusive. */
  from: string;
  to: string;
  /** UTC bounds comparable with `utc(column)`: start inclusive, end exclusive. */
  start: string;
  end: string;
  days: number;
  preset: string;
};

export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Pick dates" },
] as const;

export function makeRange(from: string, to: string, preset = "custom"): ReportRange {
  if (!DATE.test(from) || !DATE.test(to) || Number.isNaN(dayStartMs(from)) || Number.isNaN(dayStartMs(to))) throw new RangeError("Choose valid dates.");
  if (from > to) [from, to] = [to, from];
  const days = Math.round((dayStartMs(to) - dayStartMs(from)) / DAY) + 1;
  if (days > MAX_RANGE_DAYS) {
    from = addDays(to, -(MAX_RANGE_DAYS - 1));
    return makeRange(from, to, preset);
  }
  return { from, to, start: sqliteUtc(dayStartMs(from)), end: sqliteUtc(dayStartMs(to) + DAY), days, preset };
}

/** Reads ?range=7d or ?from=&to= from the address; anything malformed falls back to the last 30 days. */
export function parseRange(sp: Record<string, string | string[] | undefined>, now: Date = new Date()): ReportRange {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const today = karachiDay(now.getTime());
  const preset = one("range");
  if (preset === "today") return makeRange(today, today, "today");
  if (preset === "7d") return makeRange(addDays(today, -6), today, "7d");
  if (preset === "90d") return makeRange(addDays(today, -89), today, "90d");
  if (preset === "month") return makeRange(`${today.slice(0, 8)}01`, today, "month");
  const from = one("from");
  const to = one("to");
  if (from && to && DATE.test(from) && DATE.test(to)) {
    try {
      return makeRange(from, to, "custom");
    } catch {
      /* fall through */
    }
  }
  return makeRange(addDays(today, -29), today, "30d");
}

/** Range for "the N days up to now": window ends at the end of today. */
export function lastDays(n: number, now: Date = new Date()): ReportRange {
  const today = karachiDay(now.getTime());
  return makeRange(addDays(today, -(n - 1)), today, `${n}d`);
}

/** Every Karachi date in the range, oldest first. */
export function eachDay(r: Pick<ReportRange, "from" | "days">): string[] {
  return Array.from({ length: r.days }, (_, i) => addDays(r.from, i));
}

/** A stored timestamp (either spelling) as "YYYY-MM-DD HH:MM:SS" UTC. */
export const utc = (col: AnyColumn | SQL): SQL => sql`replace(substr(${col}, 1, 19), 'T', ' ')`;
/** The Karachi calendar date of a stored timestamp. */
export const dayOf = (col: AnyColumn | SQL): SQL => sql`date(${utc(col)}, '+5 hours')`;
/** col is inside the range. */
export const inRange = (col: AnyColumn | SQL, r: Pick<ReportRange, "start" | "end">): SQL => sql`${utc(col)} >= ${r.start} AND ${utc(col)} < ${r.end}`;

/** Query string for links that keep the range. */
export function rangeQuery(r: ReportRange): string {
  return r.preset !== "custom" && r.preset !== "30d" ? `range=${r.preset}` : `from=${r.from}&to=${r.to}`;
}
