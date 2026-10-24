import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { cn } from "@/lib/cn";
import { RANGE_PRESETS, type ReportRange } from "@/server/reports/range";
import type { ReportDef } from "@/server/reports/registry";
import type { Cell, Col, ReportResult } from "@/server/reports/types";
import { ReportChart } from "./charts";

export function formatCell(col: Pick<Col, "kind">, v: Cell): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return col.kind === "date" ? (v.length === 10 ? new Intl.DateTimeFormat("en-PK", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(Date.parse(`${v}T00:00:00Z`)) : formatKarachi(v)) : v;
  switch (col.kind) {
    case "money":
      return formatMoney(paisa(Math.round(v)));
    case "percent":
      return `${v}%`;
    case "decimal":
      return v.toLocaleString("en-PK", { maximumFractionDigits: 2 });
    default:
      return v.toLocaleString("en-PK");
  }
}

/** The filter bar above a report: period buttons, dates, and the report's own options. Plain GET form, no JavaScript. */
export function ReportFilters({ def, range, options, query }: { def: ReportDef; range: ReportRange; options: Record<string, string>; query: string }) {
  return (
    <form className="mb-6 flex flex-wrap items-end gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8" role="search" aria-label="Report period">
      {def.usesRange ? (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick periods">
            {RANGE_PRESETS.filter((p) => p.key !== "custom").map((p) => (
              <Link key={p.key} href={`/admin/reports/${def.slug}?range=${p.key}${query}`} aria-current={range.preset === p.key ? "true" : undefined} className={cn(buttonClasses(range.preset === p.key ? "primary" : "outline", "sm"))}>
                {p.label}
              </Link>
            ))}
          </div>
          <Field id="from" label="From">
            <Input id="from" name="from" type="date" defaultValue={range.from} />
          </Field>
          <Field id="to" label="To">
            <Input id="to" name="to" type="date" defaultValue={range.to} />
          </Field>
        </>
      ) : null}
      {(def.options ?? []).map((o) => (
        <Field key={o.name} id={o.name} label={o.label}>
          <Select id={o.name} name={o.name} defaultValue={options[o.name]}>
            {o.choices.map((ch) => (
              <option key={ch.value} value={ch.value}>
                {ch.label}
              </option>
            ))}
          </Select>
        </Field>
      ))}
      {def.usesRange || (def.options ?? []).length ? <Button type="submit">Show</Button> : null}
    </form>
  );
}

export function ReportBody({ result }: { result: ReportResult }) {
  const numeric = (k: Col["kind"]) => k !== "text" && k !== "date";
  return (
    <>
      {result.cards.length ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {result.cards.map((card) => (
            <div key={card.label} className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
              <p className="text-sm font-medium text-midnight/70">{card.label}</p>
              <p className="tabular mt-1 font-display text-2xl font-bold">{formatCell(card, card.value)}</p>
              {card.hint ? <p className="mt-1 text-sm text-midnight/65">{card.hint}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {result.chart ? <div className="mb-6"><ReportChart chart={result.chart} /></div> : null}
      {result.rows.length === 0 ? (
        <p className="rounded-bezel bg-white p-6 text-midnight/75 ring-1 ring-midnight/8">Nothing to show for this period.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              {result.columns.map((col) => (
                <TH key={col.key} className={numeric(col.kind) ? "text-right" : undefined}>{col.label}</TH>
              ))}
            </tr>
          </THead>
          <tbody>
            {result.rows.map((row, i) => (
              <TR key={i}>
                {result.columns.map((col) => (
                  <TD key={col.key} className={cn(numeric(col.kind) ? "tabular whitespace-nowrap text-right" : "", typeof row[col.key] === "number" && (row[col.key] as number) < 0 && col.kind === "money" ? "text-terracotta" : "")}>{formatCell(col, row[col.key] ?? null)}</TD>
                ))}
              </TR>
            ))}
            {result.totals ? (
              <TR className="bg-surface font-semibold">
                {result.columns.map((col) => (
                  <TD key={col.key} className={numeric(col.kind) ? "tabular whitespace-nowrap text-right" : ""}>{formatCell(col, result.totals![col.key] ?? null)}</TD>
                ))}
              </TR>
            ) : null}
          </tbody>
        </Table>
      )}
      {result.notes.length ? (
        <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-midnight/70">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
