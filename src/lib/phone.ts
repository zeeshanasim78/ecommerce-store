/**
 * Pakistani mobile numbers (spec §4.3: E.164, +92…). Accepts the ways people type them:
 * 0300 1234567, 03001234567, 300-1234567, +92 300 1234567, 0092 300 1234567.
 * Returns "+923001234567", or null if it isn't a mobile number.
 */
export function normalisePkMobile(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  const m = /^(?:\+92|0092|92|0)?(3\d{9})$/.exec(digits);
  return m ? `+92${m[1]}` : null;
}

/** "+923001234567" → "0300 1234567" for display. */
export function formatPkMobile(e164: string): string {
  const m = /^\+92(3\d{2})(\d{7})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]}` : e164;
}
