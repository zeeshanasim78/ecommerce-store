import { formatMoney, paisa } from "@/lib/money";
import type { Chart } from "@/server/reports/types";

/**
 * Report charts drawn on the server as plain SVG / HTML: no chart library, no browser JavaScript (spec §12 budget).
 * Hover text comes from <title>. Every chart has the same figures in the table below it, so nothing depends on colour alone:
 * online is solid midnight, counter is a lighter midnight, and a legend names both.
 */

const compact = (paisaValue: number) => {
  const rs = Math.abs(paisaValue) / 100;
  const sign = paisaValue < 0 ? "−" : "";
  if (rs >= 1_000_000) return `${sign}Rs ${(rs / 1_000_000).toFixed(rs >= 10_000_000 ? 0 : 1)}M`;
  if (rs >= 1_000) return `${sign}Rs ${(rs / 1_000).toFixed(rs >= 10_000 ? 0 : 1)}k`;
  return `${sign}Rs ${Math.round(rs)}`;
};

/** A "nice" top value for the y axis (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v: number): number {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

const dayLabel = (d: string) => new Intl.DateTimeFormat("en-PK", { timeZone: "UTC", day: "numeric", month: "short" }).format(Date.parse(`${d}T00:00:00Z`));

export function DailyChart({ days, title }: { days: { day: string; online: number; counter: number }[]; title: string }) {
  const W = 720;
  const H = 240;
  const L = 56;
  const R = 8;
  const T = 12;
  const B = 28;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const top = niceMax(Math.max(...days.map((d) => d.online + d.counter), 0));
  const slot = plotW / Math.max(days.length, 1);
  const bar = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const every = Math.max(1, Math.ceil(days.length / 8));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const total = days.reduce((s, d) => s + d.online + d.counter, 0);

  return (
    <figure className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold">{title}</span>
        <span className="flex gap-4 text-sm text-midnight/75">
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-midnight" />Online</span>
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-midnight/35" />Counter</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${days.length} days, ${formatMoney(paisa(total))} in total. The same figures are in the table below.`} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="stroke-midnight/10" strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="fill-midnight/70" fontSize={11}>{compact(t)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = L + i * slot + (slot - bar) / 2;
          const hOnline = (d.online / top) * plotH;
          const hCounter = (d.counter / top) * plotH;
          const gap = hOnline > 0 && hCounter > 0 ? 2 : 0;
          return (
            <g key={d.day}>
              <title>{`${dayLabel(d.day)} — online ${formatMoney(paisa(d.online))}, counter ${formatMoney(paisa(d.counter))}`}</title>
              <rect x={L + i * slot} y={T} width={slot} height={plotH} className="fill-transparent" />
              {hOnline > 0 ? <rect x={x} y={T + plotH - hOnline} width={bar} height={hOnline} rx={Math.min(3, bar / 2)} className="fill-midnight" /> : null}
              {hCounter > 0 ? <rect x={x} y={T + plotH - hOnline - hCounter - gap} width={bar} height={hCounter} rx={Math.min(3, bar / 2)} className="fill-midnight/35" /> : null}
              {i % every === 0 ? <text x={x + bar / 2} y={H - 8} textAnchor="middle" className="fill-midnight/70" fontSize={11}>{dayLabel(d.day)}</text> : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function BarList({ items, title, unit }: { items: { label: string; value: number }[]; title: string; unit: "money" | "int" }) {
  const shown = items.slice(0, 12);
  const max = Math.max(...shown.map((i) => Math.abs(i.value)), 1);
  const fmt = (v: number) => (unit === "money" ? formatMoney(paisa(v)) : v.toLocaleString("en-PK"));
  return (
    <figure className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
      <figcaption className="mb-4 font-semibold">{title}</figcaption>
      {shown.length === 0 ? (
        <p className="text-midnight/70">Nothing to show for this period.</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={title}>
          {shown.map((i) => (
            <li key={i.label} className="grid grid-cols-[minmax(5rem,10rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate font-medium" title={i.label}>{i.label}</span>
              <span className="h-3 rounded-full bg-surface">
                <span className={`block h-3 rounded-full ${i.value < 0 ? "bg-terracotta" : "bg-midnight"}`} style={{ width: `${Math.max(2, (Math.abs(i.value) / max) * 100)}%` }} />
              </span>
              <span className="tabular font-semibold">{fmt(i.value)}</span>
            </li>
          ))}
        </ul>
      )}
      {items.length > shown.length ? <p className="mt-3 text-sm text-midnight/65">Top {shown.length} of {items.length} — the table lists all.</p> : null}
    </figure>
  );
}

export function ReportChart({ chart }: { chart: Chart }) {
  return chart.type === "daily" ? <DailyChart days={chart.days} title={chart.title} /> : <BarList items={chart.items} title={chart.title} unit={chart.unit} />;
}
