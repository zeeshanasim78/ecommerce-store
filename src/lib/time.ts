/**
 * Pakistan Standard Time is UTC+05:00 all year (no daylight saving), so admin
 * date-time inputs convert to and from UTC with a fixed offset. Stored values are UTC ISO strings.
 */
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** "2026-10-02T14:30" (Karachi wall-clock, from <input type="datetime-local">) → UTC ISO string. */
export function karachiInputToIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const ms = Date.parse(`${local}:00+05:00`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/** UTC ISO string → "2026-10-02T14:30" for a datetime-local input's value. */
export function isoToKarachiInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Date(ms + PKT_OFFSET_MS).toISOString().slice(0, 16);
}

const displayFormat = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Milliseconds for an ISO string or a SQLite CURRENT_TIMESTAMP value ("2026-10-02 09:30:00",
 * which is UTC but carries no zone — Date.parse would read it as server-local time).
 */
export function parseTimestamp(value: string): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value) ? `${value.replace(" ", "T")}Z` : value);
}

/** "2 Oct 2026, 2:30 pm" in Karachi time. Accepts ISO strings and SQLite timestamps. */
export function formatKarachi(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = parseTimestamp(iso);
  return Number.isNaN(ms) ? "—" : displayFormat.format(ms);
}
