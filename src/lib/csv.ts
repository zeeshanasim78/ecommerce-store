/**
 * Small, dependency-free CSV reader/writer (RFC 4180) for product import/export and ledger export.
 *
 * Writing guards against spreadsheet formula injection (OWASP "CSV injection"): a text cell that
 * starts with = + - @ tab or carriage return is prefixed with ' so Excel shows it as text instead
 * of running it. Numbers are written as-is, so negative quantities stay numbers.
 */

export type CsvCell = string | number | boolean | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  let s = value;
  if (FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Rows → CSV text with CRLF line endings and a UTF-8 BOM so Excel reads "Rs" and Urdu names correctly. */
export function toCsv(header: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}

/** CSV text → rows of strings. Handles quoted fields, "" escapes, commas and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const input = text.startsWith("﻿") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i]!;
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      if (field.length > 0) throw new CsvParseError(`Line ${rows.length + 1}: a quote appears in the middle of a value`);
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
    } else {
      field += ch;
    }
    i += 1;
  }
  if (quoted) throw new CsvParseError("The file ends inside a quoted value");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop completely empty lines (e.g. a trailing blank line from Excel)
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Rows with a header → objects keyed by lower-case header name. Undoes the ' formula guard. */
export function csvRecords(text: string): { header: string[]; records: Record<string, string>[] } {
  const [head, ...body] = parseCsv(text);
  if (!head) return { header: [], records: [] };
  const header = head.map((h) => h.trim().toLowerCase());
  const records = body.map((r) => {
    const rec: Record<string, string> = {};
    header.forEach((h, i) => {
      let v = (r[i] ?? "").trim();
      if (v.startsWith("'") && FORMULA_START.test(v.slice(1))) v = v.slice(1);
      rec[h] = v;
    });
    return rec;
  });
  return { header, records };
}
