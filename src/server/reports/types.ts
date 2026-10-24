import type { ReportRange } from "./range";

/** One cell value. Money is integer paisa; the page formats it, the CSV writes rupees. */
export type Cell = string | number | null;
export type Row = Record<string, Cell>;
export type ColKind = "text" | "int" | "money" | "percent" | "decimal" | "date";
export type Col = { key: string; label: string; kind: ColKind };

export type Card = { label: string; value: Cell; kind: ColKind; hint?: string };

/** Data for the two chart shapes used on report pages (drawn by components/admin/charts.tsx). */
export type Chart =
  | { type: "daily"; title: string; days: { day: string; online: number; counter: number }[] }
  | { type: "bars"; title: string; unit: "money" | "int"; items: { label: string; value: number }[] };

export type ReportOption = { name: string; label: string; choices: { value: string; label: string }[]; default: string };

export type ReportResult = {
  slug: string;
  title: string;
  description: string;
  /** Shown under the title, e.g. "1 Oct – 30 Oct 2026" or "As of now". */
  period: string;
  cards: Card[];
  chart?: Chart;
  columns: Col[];
  rows: Row[];
  /** Totals line under the table (same keys as rows). */
  totals?: Row;
  notes: string[];
};

export type ReportParams = { range: ReportRange; options: Record<string, string>; now: Date };
