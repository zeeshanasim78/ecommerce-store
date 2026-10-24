import type { DB } from "@/db/connection";
import { lastDays } from "./range";
import { marginPercent, salesByDay, type SalesSummary } from "./sales";
import { reorderRows, variantStats } from "./stock";

/** Dashboard figures for owners and managers (spec §7 Dashboard): today / 7 / 30 days, online vs counter, margin, reorder alerts. */
export type PeriodFigures = { key: "today" | "7d" | "30d"; label: string; sales: number; online: number; counter: number; orders: number; margin: number; marginPct: number | null };

export function dashboardFigures(db: DB, now: Date = new Date()) {
  const month = salesByDay(db, lastDays(30, now));
  const sum = (s: SalesSummary["days"]): Omit<PeriodFigures, "key" | "label"> => {
    const t = s.reduce((a, d) => ({ sales: a.sales + d.sales, online: a.online + d.onlineSales, counter: a.counter + d.counterSales, orders: a.orders + d.onlineOrders + d.counterOrders, margin: a.margin + d.margin }), { sales: 0, online: 0, counter: 0, orders: 0, margin: 0 });
    return { ...t, marginPct: marginPercent(t.margin, t.sales) };
  };
  // the 30-day run already holds every day, so today and 7 days are slices of it (one source of truth)
  const periods: PeriodFigures[] = [
    { key: "today", label: "Today", ...sum(month.days.slice(-1)) },
    { key: "7d", label: "Last 7 days", ...sum(month.days.slice(-7)) },
    { key: "30d", label: "Last 30 days", ...sum(month.days) },
  ];
  const reorder = reorderRows(db, variantStats(db, now));
  return {
    periods,
    chart: month.days.map((d) => ({ day: d.day, online: d.onlineSales, counter: d.counterSales })),
    reorderNow: reorder.filter((r) => r.status === "REORDER").length,
  };
}
