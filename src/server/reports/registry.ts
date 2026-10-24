import type { DB } from "@/db/connection";
import { MOVEMENT_LABEL } from "@/server/inventory/ledger";
import { toCsv, type CsvCell } from "@/lib/csv";
import { formatKarachi } from "@/lib/time";
import { formatMoney, paisa } from "@/lib/money";
import { COD_STATE_LABEL, cashierTotals, codReconciliation, poCostAnalysis, returnsImpact } from "./finance";
import { karachiDay, type ReportRange } from "./range";
import { marginPercent, salesByDay, soldLines } from "./sales";
import { brandVelocity, deadStock, reorderRows, turnover, variantStats } from "./stock";
import type { Card, Col, Cell, ReportOption, ReportParams, ReportResult, Row } from "./types";

void MOVEMENT_LABEL;

/** The reports (SPECIFICATION §29). Each turns database figures into one table + cards (+ a chart); the page and the CSV share it. */

export type ReportDef = {
  slug: string;
  title: string;
  blurb: string;
  /** false = shows the position as of now, so the date range is hidden. */
  usesRange: boolean;
  options?: ReportOption[];
  run: (db: DB, p: ReportParams) => ReportResult;
};

const fmtDay = (d: string) => new Intl.DateTimeFormat("en-PK", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(Date.parse(`${d}T00:00:00Z`));
export const periodText = (r: Pick<ReportRange, "from" | "to">) => (r.from === r.to ? fmtDay(r.from) : `${fmtDay(r.from)} – ${fmtDay(r.to)}`);
const asOf = (now: Date) => `Position as of ${formatKarachi(now.toISOString())}`;
const c = (key: string, label: string, kind: Col["kind"] = "text"): Col => ({ key, label, kind });
const pct = (n: number | null) => n;

const GRADE_NOTE = "Sales = goods sold after discounts (delivery and COD fees are shown apart). Orders that are cancelled, returned to us undelivered or whose payment failed are not counted.";

function sales(db: DB, { range }: ReportParams): ReportResult {
  const s = salesByDay(db, range);
  const t = s.total;
  return {
    slug: "sales", title: "Sales by day", period: periodText(range),
    description: "Goods sold each day, online against the counter, with cost of goods and gross margin.",
    cards: [
      { label: "Sales", value: t.sales, kind: "money", hint: `${t.onlineOrders + t.counterOrders} orders` },
      { label: "Online", value: t.onlineSales, kind: "money", hint: `${t.onlineOrders} orders` },
      { label: "Counter", value: t.counterSales, kind: "money", hint: `${t.counterOrders} sales` },
      { label: "Gross margin", value: t.margin, kind: "money", hint: t.sales > 0 ? `${marginPercent(t.margin, t.sales)}% of sales` : undefined },
    ],
    chart: { type: "daily", title: "Sales per day", days: s.days.map((d) => ({ day: d.day, online: d.onlineSales, counter: d.counterSales })) },
    columns: [c("day", "Date", "date"), c("onlineOrders", "Online orders", "int"), c("onlineSales", "Online sales", "money"), c("counterOrders", "Counter sales", "int"), c("counterSales", "Counter takings", "money"), c("sales", "Total sales", "money"), c("units", "Screens", "int"), c("cost", "Cost of goods", "money"), c("margin", "Gross margin", "money"), c("marginPct", "Margin %", "percent"), c("fees", "Delivery & COD fees", "money")],
    rows: s.days.map((d) => ({ ...d, marginPct: pct(marginPercent(d.margin, d.sales)) })),
    totals: { day: "Total", ...t, marginPct: marginPercent(t.margin, t.sales) },
    notes: [GRADE_NOTE, "Days are Karachi calendar days. Cost of goods is the cost saved on each order line when it was sold."],
  };
}

function margin(db: DB, { range }: ReportParams): ReportResult {
  const { lines } = soldLines(db, range);
  type Acc = { brand: string; grade: string; units: number; sales: number; cost: number };
  const by = new Map<string, Acc>();
  for (const l of lines) {
    const key = `${l.brand}\u0000${l.grade}`;
    const r = by.get(key) ?? { brand: l.brand, grade: l.grade, units: 0, sales: 0, cost: 0 };
    r.units += l.qty;
    r.sales += l.salesPaisa;
    r.cost += l.costPaisa;
    by.set(key, r);
  }
  const accs = [...by.values()].sort((a, b) => b.sales - b.cost - (a.sales - a.cost) || a.brand.localeCompare(b.brand) || a.grade.localeCompare(b.grade));
  const total = accs.reduce((s, r) => ({ units: s.units + r.units, sales: s.sales + r.sales, cost: s.cost + r.cost }), { units: 0, sales: 0, cost: 0 });
  const totalMargin = total.sales - total.cost;
  const rows: Row[] = accs.map((r) => ({ ...r, margin: r.sales - r.cost, marginPct: marginPercent(r.sales - r.cost, r.sales), share: totalMargin > 0 ? Math.round(((r.sales - r.cost) / totalMargin) * 1000) / 10 : null }));
  const brandTotals = new Map<string, number>();
  for (const r of accs) brandTotals.set(r.brand, (brandTotals.get(r.brand) ?? 0) + (r.sales - r.cost));
  const best = [...brandTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    slug: "margin", title: "Margin by brand and grade", period: periodText(range),
    description: "Where the profit comes from: margin on each brand and quality grade.",
    cards: [
      { label: "Sales", value: total.sales, kind: "money" },
      { label: "Cost of goods", value: total.cost, kind: "money" },
      { label: "Gross margin", value: totalMargin, kind: "money", hint: total.sales > 0 ? `${marginPercent(totalMargin, total.sales)}% of sales` : undefined },
      { label: "Best brand", value: best ? best[0] : null, kind: "text", hint: best ? formatMoney(paisa(best[1])) : undefined },
    ],
    chart: { type: "bars", title: "Gross margin by brand", unit: "money", items: [...brandTotals.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })) },
    columns: [c("brand", "Brand"), c("grade", "Grade"), c("units", "Screens", "int"), c("sales", "Sales", "money"), c("cost", "Cost of goods", "money"), c("margin", "Gross margin", "money"), c("marginPct", "Margin %", "percent"), c("share", "Share of margin %", "percent")],
    rows,
    totals: { brand: "Total", grade: null, units: total.units, sales: total.sales, cost: total.cost, margin: totalMargin, marginPct: marginPercent(totalMargin, total.sales), share: totalMargin > 0 ? 100 : null },
    notes: [GRADE_NOTE, "An order discount is shared out over its lines by value, so brand figures add up to the Sales by day total. Returns are shown on the Returns report."],
  };
}

function velocity(db: DB, { now }: ReportParams): ReportResult {
  const rows = brandVelocity(variantStats(db, now));
  const total = rows.reduce((s, r) => ({ units7: s.units7 + r.units7, units30: s.units30 + r.units30, units90: s.units90 + r.units90, stock: s.stock + r.stock, colours: s.colours + r.colours }), { units7: 0, units30: 0, units90: 0, stock: 0, colours: 0 });
  return {
    slug: "velocity", title: "Brand velocity", period: asOf(now),
    description: "How fast each brand sells: screens sold over 7, 30 and 90 days.",
    cards: [
      { label: "Sold in 7 days", value: total.units7, kind: "int" },
      { label: "Sold in 30 days", value: total.units30, kind: "int", hint: `${Math.round((total.units30 / 30) * 10) / 10} a day` },
      { label: "Sold in 90 days", value: total.units90, kind: "int" },
      { label: "In stock now", value: total.stock, kind: "int" },
    ],
    chart: { type: "bars", title: "Screens sold in 30 days", unit: "int", items: rows.map((r) => ({ label: r.brand, value: r.units30 })) },
    columns: [c("brand", "Brand"), c("colours", "Colours", "int"), c("stock", "In stock", "int"), c("units7", "Sold 7 days", "int"), c("units30", "Sold 30 days", "int"), c("units90", "Sold 90 days", "int"), c("perDay30", "Per day (30 days)", "decimal"), c("shareOf30", "Share of 30-day sales %", "percent")],
    rows: rows.map((r) => ({ ...r })),
    totals: { brand: "Total", colours: total.colours, stock: total.stock, units7: total.units7, units30: total.units30, units90: total.units90, perDay30: Math.round((total.units30 / 30) * 100) / 100, shareOf30: null },
    notes: ["Screens sold are net: online and counter sales minus screens that came back (customer returns and cancelled orders put back on sale). The windows end today (Karachi)."],
  };
}

const REORDER_LABEL = { REORDER: "Reorder now", LOW: "Low stock", OK: "OK", NO_SALES: "No sales in 30 days" } as const;

function reorder(db: DB, { now, options }: ReportParams): ReportResult {
  const all = reorderRows(db, variantStats(db, now));
  const rows = options.show === "all" ? all : all.filter((r) => r.status === "REORDER" || r.status === "LOW");
  return {
    slug: "reorder", title: "Days of cover and reorder", period: asOf(now),
    description: "How long the stock will last at the recent selling rate, and what to order.",
    cards: [
      { label: "Reorder now", value: all.filter((r) => r.status === "REORDER").length, kind: "int", hint: "cover is shorter than the supplier's lead time + 7 days" },
      { label: "Low stock", value: all.filter((r) => r.status === "LOW").length, kind: "int", hint: "at or below the alert level" },
      { label: "Suggested screens", value: all.reduce((s, r) => s + r.suggested, 0), kind: "int" },
    ],
    columns: [c("screen", "Screen"), c("sku", "Variant SKU"), c("stock", "In stock", "int"), c("onOrder", "On order", "int"), c("sold30", "Sold 30 days", "int"), c("perDay", "Per day", "decimal"), c("cover", "Days of cover", "decimal"), c("vendor", "Supplier"), c("lead", "Lead days", "int"), c("suggested", "Suggested order", "int"), c("status", "Status")],
    rows: rows.map((r) => ({ screen: `${r.brand} ${r.model} — ${r.color} (${r.grade})`, sku: r.sku, stock: r.stock, onOrder: r.onOrder, sold30: r.units30, perDay: r.perDay, cover: r.daysOfCover, vendor: r.vendor ?? "—", lead: r.leadDays, suggested: r.suggested || null, status: REORDER_LABEL[r.status] })),
    notes: ["Days of cover = in stock ÷ (screens sold in 30 days ÷ 30). Reorder now when cover is below the supplier's lead time + 7 days.", "Suggested order = enough for lead time + 7 days + 30 days after the delivery arrives, less what is in stock and already on order (at least 1).", "Supplier = the one on the newest purchase order for that colour, else one that lists the brand; with neither, 7 days is assumed."],
  };
}

function dead(db: DB, { now, options }: ReportParams): ReportResult {
  const days = Number(options.days) || 90;
  const rows = deadStock(db, variantStats(db, now), days, now);
  const value = rows.reduce((s, r) => s + r.valuePaisa, 0);
  return {
    slug: "dead-stock", title: "Dead stock", period: `${asOf(now)} · no sales in ${days} days`,
    description: `Screens on the shelf that have not sold in ${days} days — money sitting still.`,
    cards: [
      { label: "Colours with no sales", value: rows.length, kind: "int" },
      { label: "Screens", value: rows.reduce((s, r) => s + r.stock, 0), kind: "int" },
      { label: "Tied up at cost", value: value, kind: "money" },
    ],
    chart: { type: "bars", title: "Cost tied up, by brand", unit: "money", items: [...rows.reduce((m, r) => m.set(r.brand, (m.get(r.brand) ?? 0) + r.valuePaisa), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).map(([label, v]) => ({ label, value: v })) },
    columns: [c("screen", "Screen"), c("sku", "Variant SKU"), c("stock", "In stock", "int"), c("cost", "Cost each", "money"), c("value", "Cost tied up", "money"), c("lastSale", "Last sale", "date"), c("since", "Days since last sale", "int"), c("firstStocked", "First stocked", "date"), c("newStock", "New stock?")],
    rows: rows.map((r) => ({ screen: `${r.brand} ${r.model} — ${r.color} (${r.grade})`, sku: r.sku, stock: r.stock, cost: r.costPaisa, value: r.valuePaisa, lastSale: r.lastSaleAt, since: r.daysSinceSale, firstStocked: r.firstStockedAt, newStock: r.newStock ? "Yes — first stocked inside this period" : "" })),
    totals: { screen: "Total", sku: null, stock: rows.reduce((s, r) => s + r.stock, 0), cost: null, value, lastSale: null, since: null, firstStocked: null, newStock: null },
    notes: ["A colour is listed when it holds stock and its net sales over the period are zero (a sale that was cancelled or returned does not count).", "Cost is the current average cost of the screen. \"New stock\" colours may simply not have had time to sell."],
  };
}

function turnoverReport(db: DB, { range }: ReportParams): ReportResult {
  const t = turnover(db, range);
  const row = (r: (typeof t.rows)[number]): Row => ({ brand: r.brand, cogs: r.cogsPaisa, opening: r.openingPaisa, closing: r.closingPaisa, average: r.averagePaisa, turns: r.turns, annual: r.annualTurns, daysToSell: r.daysToSell });
  return {
    slug: "turnover", title: "Inventory turnover", period: periodText(range),
    description: "How many times the stock was sold and replaced, and how many days it takes to sell through.",
    cards: [
      { label: "Cost of goods sold", value: t.total.cogsPaisa, kind: "money" },
      { label: "Average stock value", value: t.total.averagePaisa, kind: "money", hint: "at cost" },
      { label: "Turns in period", value: t.total.turns, kind: "decimal" },
      { label: "Days to sell through", value: t.total.daysToSell, kind: "decimal" },
    ],
    chart: { type: "bars", title: "Cost of goods sold by brand", unit: "money", items: t.rows.map((r) => ({ label: r.brand, value: r.cogsPaisa })) },
    columns: [c("brand", "Brand"), c("cogs", "Cost of goods sold", "money"), c("opening", "Stock at start", "money"), c("closing", "Stock at end", "money"), c("average", "Average stock", "money"), c("turns", "Turns", "decimal"), c("annual", "Turns a year", "decimal"), c("daysToSell", "Days to sell through", "decimal")],
    rows: t.rows.map(row),
    totals: row(t.total),
    notes: ["Turnover = cost of goods sold ÷ average stock value, where average = (stock value at the start + at the end) ÷ 2. Stock on those two dates is rebuilt from the ledger and valued at each screen's current average cost.", "Turns a year scales the period to 365 days."],
  };
}

function cod(db: DB, { range, now, options }: ReportParams): ReportResult {
  const scope = options.scope === "open" ? "open" : "range";
  const r = codReconciliation(db, range, scope, now);
  return {
    slug: "cod", title: "COD reconciliation", period: scope === "open" ? "Every parcel still unsettled" : `Parcels booked ${periodText(range)}`,
    description: "Cash on delivery: what the couriers hold, what they owe, and what they have paid.",
    cards: [
      { label: "With the couriers", value: r.withCourier.paisa, kind: "money", hint: `${r.withCourier.n} parcels` },
      { label: "Delivered — owed to us", value: r.owed.paisa, kind: "money", hint: `${r.owed.n} parcels${r.owed.oldestDays !== null ? `, oldest ${r.owed.oldestDays} days` : ""}` },
      { label: "Paid to us", value: r.paidInRange.paisa, kind: "money", hint: `${r.paidInRange.n} parcels${r.averageDaysToPay !== null ? `, ${r.averageDaysToPay} days on average` : ""}` },
      { label: "Differences accepted", value: r.differencePaisa, kind: "money", hint: "paid minus the COD amount" },
    ],
    columns: [c("order", "Order"), c("courier", "Courier"), c("cn", "CN"), c("booked", "Booked", "date"), c("delivered", "Delivered", "date"), c("cod", "COD amount", "money"), c("paid", "Paid by courier", "money"), c("paidAt", "Paid on", "date"), c("diff", "Difference", "money"), c("days", "Days", "int"), c("state", "Where the money is")],
    rows: r.rows.map((x) => ({ order: x.order, courier: x.courier, cn: x.cn, booked: x.bookedAt, delivered: x.deliveredAt, cod: x.codPaisa, paid: x.remittedPaisa, paidAt: x.remittedAt, diff: x.differencePaisa, days: x.days, state: COD_STATE_LABEL[x.state] })),
    totals: { order: "Total", courier: null, cn: null, booked: null, delivered: null, cod: r.rows.reduce((s, x) => s + x.codPaisa, 0), paid: r.rows.reduce((s, x) => s + (x.remittedPaisa ?? 0), 0), paidAt: null, diff: r.differencePaisa, days: null, state: null },
    notes: ["Days = how long a delivered parcel's money has been owed, or how long the courier took to pay it.", "Upload the courier's payment report under COD remittance to settle parcels."],
  };
}

function cashiers(db: DB, { range }: ReportParams): ReportResult {
  const { rows, cashRefundsPaisa } = cashierTotals(db, range);
  const total = rows.reduce((s, r) => ({ sales: s.sales + r.sales, items: s.items + r.items, total: s.total + r.totalPaisa, cash: s.cash + r.cashPaisa, wholesale: s.wholesale + r.wholesaleSales, discount: s.discount + r.discountPaisa }), { sales: 0, items: 0, total: 0, cash: 0, wholesale: 0, discount: 0 });
  return {
    slug: "cashiers", title: "Cashier totals", period: periodText(range),
    description: "Counter sales per person over the period. For a single day's cash count use End of day.",
    cards: [
      { label: "Counter takings", value: total.total, kind: "money", hint: `${total.sales} sales` },
      { label: "Cash", value: total.cash, kind: "money" },
      { label: "Cash refunds paid", value: cashRefundsPaisa, kind: "money", hint: "taken out of the drawer by returns" },
      { label: "Ticket discounts", value: total.discount, kind: "money" },
    ],
    chart: { type: "bars", title: "Counter takings per person", unit: "money", items: rows.map((r) => ({ label: r.name, value: r.totalPaisa })) },
    columns: [c("name", "Person"), c("role", "Role"), c("days", "Days worked", "int"), c("sales", "Sales", "int"), c("items", "Screens", "int"), c("total", "Takings", "money"), c("cash", "Cash", "money"), c("nonCash", "Non-cash", "money"), c("avg", "Average sale", "money"), c("wholesale", "Wholesale sales", "int"), c("discount", "Discounts given", "money"), c("first", "First sale", "date"), c("last", "Last sale", "date")],
    rows: rows.map((r) => ({ name: r.name, role: r.role, days: r.days, sales: r.sales, items: r.items, total: r.totalPaisa, cash: r.cashPaisa, nonCash: r.nonCashPaisa, avg: r.averageTicketPaisa, wholesale: r.wholesaleSales, discount: r.discountPaisa, first: r.firstSaleAt, last: r.lastSaleAt })),
    totals: { name: "Total", role: null, days: null, sales: total.sales, items: total.items, total: total.total, cash: total.cash, nonCash: total.total - total.cash, avg: total.sales ? Math.round(total.total / total.sales) : null, wholesale: total.wholesale, discount: total.discount, first: null, last: null },
    notes: ["Takings are what customers paid for the counter sales, including any ticket discount already taken off. Only the owner records non-cash payments at the till."],
  };
}

function purchasing(db: DB, { range }: ReportParams): ReportResult {
  const { rows, totals } = poCostAnalysis(db, range);
  return {
    slug: "purchasing", title: "Purchase cost analysis", period: `Orders placed ${periodText(range)}`,
    description: "What each purchase order really cost once shipping, customs and other charges are added.",
    cards: [
      { label: "Goods ordered", value: totals.goodsPaisa, kind: "money", hint: `${totals.unitsOrdered} screens` },
      { label: "Shipping, customs, other", value: totals.extrasPaisa, kind: "money" },
      { label: "Landed total", value: totals.landedPaisa, kind: "money" },
      { label: "Extra over goods", value: totals.upliftPercent, kind: "percent" },
    ],
    chart: { type: "bars", title: "Landed cost per purchase order", unit: "money", items: rows.map((r) => ({ label: r.code, value: r.landedPaisa })) },
    columns: [c("code", "PO"), c("vendor", "Supplier"), c("status", "Status"), c("currency", "Currency"), c("orderedAt", "Ordered", "date"), c("receivedAt", "Received", "date"), c("ordered", "Ordered", "int"), c("received", "Received", "int"), c("goods", "Goods (PKR)", "money"), c("extras", "Shipping, customs, other", "money"), c("landed", "Landed total", "money"), c("uplift", "Extra %", "percent"), c("perUnit", "Landed per screen", "money"), c("days", "Days to receive", "int"), c("promised", "Supplier's lead days", "int")],
    rows: rows.map((r) => ({ code: r.code, vendor: r.vendor, status: r.status.replaceAll("_", " ").toLowerCase(), currency: r.currency, orderedAt: r.orderedAt, receivedAt: r.receivedAt, ordered: r.unitsOrdered, received: r.unitsReceived, goods: r.goodsPaisa, extras: r.extrasPaisa, landed: r.landedPaisa, uplift: r.upliftPercent, perUnit: r.landedPerUnitPaisa, days: r.daysToReceive, promised: r.promisedDays })),
    totals: { code: "Total (not drafts)", vendor: null, status: null, currency: null, orderedAt: null, receivedAt: null, ordered: totals.unitsOrdered, received: null, goods: totals.goodsPaisa, extras: totals.extrasPaisa, landed: totals.landedPaisa, uplift: totals.upliftPercent, perUnit: null, days: null, promised: null },
    notes: ["Goods value uses the quantity ordered and the exchange rate on the purchase order. Drafts are listed but not totalled; cancelled orders are left out."],
  };
}

const KIND_REASON: Record<string, string> = { DEAD_ON_ARRIVAL: "Dead on arrival", TOUCH_FAULT: "Touch fault", LINES_ON_DISPLAY: "Lines on display", WRONG_ITEM: "Wrong item", DAMAGED_IN_TRANSIT: "Damaged in transit", CHANGE_OF_MIND: "Changed mind" };

function returnsReport(db: DB, { range }: ReportParams): ReportResult {
  const r = returnsImpact(db, range);
  return {
    slug: "returns", title: "Returns, refunds and claims", period: `Returns decided ${periodText(range)}`,
    description: "What returns cost: goods value given back, stock recovered, replacements and supplier credit.",
    cards: [
      { label: "Refunds paid out", value: r.refundsPaidPaisa, kind: "money", hint: Object.entries(r.refundsPaidByMethod).map(([m, n]) => `${m.replaceAll("_", " ").toLowerCase()} ${formatMoney(paisa(n))}`).join(" · ") || undefined },
      { label: "Goods value given back", value: r.totals.reversedPaisa, kind: "money" },
      { label: "Supplier credit received", value: r.claimCreditsPaisa, kind: "money", hint: `${formatMoney(paisa(r.claimsOpenPaisa))} still claimed` },
      { label: "Net effect on margin", value: r.netWithCreditsPaisa, kind: "money" },
    ],
    columns: [c("code", "Return"), c("order", "Order"), c("decided", "Decided", "date"), c("reason", "Reason"), c("resolution", "Outcome"), c("reversed", "Goods value given back", "money"), c("recovered", "Cost back on shelf", "money"), c("replacement", "Replacement cost", "money"), c("net", "Effect on margin", "money"), c("writeOff", "Written off (cost)", "money"), c("claimed", "Sent to supplier (cost)", "money"), c("refund", "Refund", "money"), c("refundedAt", "Refund paid", "date"), c("method", "Paid by")],
    rows: r.rows.map((x) => ({ code: x.code, order: x.orderCode, decided: x.decidedAt, reason: KIND_REASON[x.reason] ?? x.reason, resolution: x.resolution.replaceAll("_", " ").toLowerCase(), reversed: x.reversedPaisa, recovered: x.recoveredPaisa, replacement: x.replacementPaisa, net: x.netPaisa, writeOff: x.writeOffPaisa, claimed: x.claimedPaisa, refund: x.refundPaisa, refundedAt: x.refundedAt, method: x.refundMethod ? x.refundMethod.replaceAll("_", " ").toLowerCase() : null })),
    totals: { code: "Total", order: null, decided: null, reason: null, resolution: null, reversed: r.totals.reversedPaisa, recovered: r.totals.recoveredPaisa, replacement: r.totals.replacementPaisa, net: r.totals.netPaisa, writeOff: r.totals.writeOffPaisa, claimed: r.totals.claimedPaisa, refund: r.rows.reduce((s, x) => s + x.refundPaisa, 0), refundedAt: null, method: null },
    notes: ["Effect on margin = goods value given back (refunds and store credit) + replacement cost − cost of screens put back on sale. Written-off and faulty screens keep their cost in cost of goods; supplier credit received in the period is added in the Net effect card.", "Refunds paid out counts the date the money was paid; the table lists returns by the date they were decided."],
  };
}

export const REPORTS: ReportDef[] = [
  { slug: "sales", title: "Sales by day", blurb: "Online against counter, with cost and margin.", usesRange: true, run: sales },
  { slug: "margin", title: "Margin by brand and grade", blurb: "Which brands and grades earn the profit.", usesRange: true, run: margin },
  { slug: "velocity", title: "Brand velocity", blurb: "Screens sold over 7, 30 and 90 days.", usesRange: false, run: velocity },
  { slug: "reorder", title: "Days of cover and reorder", blurb: "What to order, and how many.", usesRange: false, options: [{ name: "show", label: "Show", default: "reorder", choices: [{ value: "reorder", label: "Only what needs ordering" }, { value: "all", label: "Every colour" }] }], run: reorder },
  { slug: "turnover", title: "Inventory turnover", blurb: "How fast stock sells through.", usesRange: true, run: turnoverReport },
  { slug: "dead-stock", title: "Dead stock", blurb: "Stock that has not sold.", usesRange: false, options: [{ name: "days", label: "No sales in", default: "90", choices: [30, 60, 90, 180].map((n) => ({ value: String(n), label: `${n} days` })) }], run: dead },
  { slug: "cod", title: "COD reconciliation", blurb: "Cash the couriers hold or owe.", usesRange: true, options: [{ name: "scope", label: "Parcels", default: "range", choices: [{ value: "range", label: "Booked in the period" }, { value: "open", label: "Everything still unsettled" }] }], run: cod },
  { slug: "cashiers", title: "Cashier totals", blurb: "Counter takings per person.", usesRange: true, run: cashiers },
  { slug: "returns", title: "Returns, refunds and claims", blurb: "What returns cost the shop.", usesRange: true, run: returnsReport },
  { slug: "purchasing", title: "Purchase cost analysis", blurb: "Landed cost of each purchase order.", usesRange: true, run: purchasing },
];

export const reportBySlug = (slug: string) => REPORTS.find((r) => r.slug === slug);

/** Option values from the address, falling back to each option's default. */
export function parseOptions(def: ReportDef, sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of def.options ?? []) {
    const v = Array.isArray(sp[o.name]) ? sp[o.name]![0] : (sp[o.name] as string | undefined);
    out[o.name] = o.choices.some((ch) => ch.value === v) ? v! : o.default;
  }
  return out;
}

/** CSV: money columns in rupees (2 decimals), dates as Karachi date or date-time, a totals row, and the notes are left out. */
export function reportCsv(result: ReportResult): string {
  const cell = (col: Col, v: Cell): CsvCell => {
    if (v === null || v === undefined || v === "") return "";
    if (col.kind === "money" && typeof v === "number") return (v / 100).toFixed(2);
    if (col.kind === "date" && typeof v === "string") return v.length === 10 ? v : formatKarachi(v);
    return v;
  };
  const line = (row: Row) => result.columns.map((col) => cell(col, row[col.key] ?? null));
  return toCsv(result.columns.map((col) => col.label), [...result.rows.map(line), ...(result.totals ? [line(result.totals)] : [])]);
}

export function reportFileName(slug: string, range: ReportRange | null, now: Date): string {
  return `caidea-${slug}-${range ? `${range.from}_to_${range.to}` : karachiDay(now.getTime())}.csv`;
}

export type { Card };
