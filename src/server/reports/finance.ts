import { sql } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { parseTimestamp } from "@/lib/time";
import { foreignToPaisa } from "@/server/purchasing/costing";
import { codOutstanding } from "@/server/orders/cod-remittance";
import { inRange, utc, type ReportRange } from "./range";

/** Money-side reports: returns impact, COD reconciliation, cashier totals, purchase cost analysis (SPECIFICATION §29). */

// ───────────────────────────── Returns impact ─────────────────────────────

export type ReturnImpactRow = {
  code: string;
  orderCode: string;
  reason: string;
  resolution: string;
  decidedAt: string;
  /** Goods value given back (item refund shares) — 0 for a replacement. */
  reversedPaisa: number;
  /** Cost of good units back on the shelf (REPAIR_RETURN). */
  recoveredPaisa: number;
  /** Cost of the replacement units sent out. */
  replacementPaisa: number;
  /** Cost of units written off (already inside cost of goods — shown for information). */
  writeOffPaisa: number;
  /** Cost of faulty units sent to the supplier (claimed back, see claims). */
  claimedPaisa: number;
  /** Total refund paid out/owed, including delivery charges when refunded. */
  refundPaisa: number;
  refundedAt: string | null;
  refundMethod: string | null;
  /** −reversed + recovered − replacement. */
  netPaisa: number;
};

export type ReturnsImpact = {
  rows: ReturnImpactRow[];
  refundsPaidPaisa: number;
  refundsPaidByMethod: Record<string, number>;
  claimCreditsPaisa: number;
  claimsOpenPaisa: number;
  totals: { reversedPaisa: number; recoveredPaisa: number; replacementPaisa: number; writeOffPaisa: number; claimedPaisa: number; netPaisa: number };
  /** Net effect on margin including supplier credits received in the range. */
  netWithCreditsPaisa: number;
};

/**
 * Returns decided (approved) in the range, and their effect on margin (Q93):
 * goods value reversed for refunds and store credit, cost recovered for units back on sale, cost of replacement units sent.
 * Written-off and faulty units keep their cost in cost of goods (the sale already counted it); supplier credits received
 * in the range win some of it back.
 */
export function returnsImpact(db: DB, range: ReportRange): ReturnsImpact {
  const raw = db.all<{
    id: string; code: string; orderCode: string; reason: string; resolution: string; decidedAt: string; refund: number; refundedAt: string | null; method: string | null;
    reversedShare: number; restock: number; writeOff: number; claimed: number; allCost: number;
  }>(sql`
    SELECT r.id, r.code, o.code AS orderCode, r.reason, r.resolution, r.decided_at AS decidedAt, r.refund_paisa AS refund, r.refunded_at AS refundedAt, r.refund_method AS method,
      coalesce(sum(ri.refund_paisa), 0) AS reversedShare,
      coalesce(sum(CASE WHEN ri.disposition = 'RESTOCK' THEN ri.quantity * oi.unit_cost_paisa END), 0) AS restock,
      coalesce(sum(CASE WHEN ri.disposition = 'WRITE_OFF' THEN ri.quantity * oi.unit_cost_paisa END), 0) AS writeOff,
      coalesce(sum(CASE WHEN ri.disposition = 'RETURN_TO_VENDOR' THEN ri.quantity * oi.unit_cost_paisa END), 0) AS claimed,
      coalesce(sum(ri.quantity * oi.unit_cost_paisa), 0) AS allCost
    FROM returns r JOIN orders o ON o.id = r.order_id
    LEFT JOIN return_items ri ON ri.return_id = r.id LEFT JOIN order_items oi ON oi.id = ri.order_item_id
    WHERE r.status IN ('APPROVED','CLOSED') AND r.decided_at IS NOT NULL AND ${inRange(sql`r.decided_at`, range)}
    GROUP BY r.id ORDER BY ${utc(sql`r.decided_at`)}, r.code`);

  const rows = raw.map<ReturnImpactRow>((r) => {
    const reversed = r.resolution === "REPLACEMENT" ? 0 : r.reversedShare;
    const replacement = r.resolution === "REPLACEMENT" ? r.allCost : 0;
    return { code: r.code, orderCode: r.orderCode, reason: r.reason, resolution: r.resolution, decidedAt: r.decidedAt, reversedPaisa: reversed, recoveredPaisa: r.restock, replacementPaisa: replacement, writeOffPaisa: r.writeOff, claimedPaisa: r.claimed, refundPaisa: r.resolution === "REFUND" ? r.refund : 0, refundedAt: r.refundedAt, refundMethod: r.method, netPaisa: -reversed + r.restock - replacement };
  });

  const paid = db.all<{ method: string; n: number }>(sql`SELECT refund_method AS method, sum(refund_paisa) AS n FROM returns WHERE resolution = 'REFUND' AND refunded_at IS NOT NULL AND ${inRange(sql`refunded_at`, range)} GROUP BY refund_method`);
  const byMethod: Record<string, number> = {};
  for (const p of paid) byMethod[p.method] = p.n;
  const credits = db.get<{ n: number }>(sql`SELECT coalesce(sum(credit_paisa), 0) AS n FROM vendor_claims WHERE status = 'CREDITED' AND resolved_at IS NOT NULL AND ${inRange(sql`resolved_at`, range)}`)?.n ?? 0;
  const open = db.get<{ n: number }>(sql`SELECT coalesce(sum(claim_paisa), 0) AS n FROM vendor_claims WHERE status IN ('OPEN','SENT')`)?.n ?? 0;

  const sum = (k: "reversedPaisa" | "recoveredPaisa" | "replacementPaisa" | "writeOffPaisa" | "claimedPaisa" | "netPaisa") => rows.reduce((s, r) => s + r[k], 0);
  const totals = { reversedPaisa: sum("reversedPaisa"), recoveredPaisa: sum("recoveredPaisa"), replacementPaisa: sum("replacementPaisa"), writeOffPaisa: sum("writeOffPaisa"), claimedPaisa: sum("claimedPaisa"), netPaisa: sum("netPaisa") };
  return { rows, refundsPaidPaisa: Object.values(byMethod).reduce((s, n) => s + n, 0), refundsPaidByMethod: byMethod, claimCreditsPaisa: credits, claimsOpenPaisa: open, totals, netWithCreditsPaisa: totals.netPaisa + credits };
}

// ───────────────────────────── COD reconciliation ─────────────────────────────

export type CodState = "WITH_COURIER" | "OWED" | "PAID" | "PAID_DIFFERENT" | "RETURNED";
export const COD_STATE_LABEL: Record<CodState, string> = { WITH_COURIER: "With the courier", OWED: "Delivered — courier owes us", PAID: "Paid", PAID_DIFFERENT: "Paid — amount differs", RETURNED: "Coming back / returned" };

export type CodRow = {
  order: string;
  courier: string;
  cn: string | null;
  bookedAt: string;
  deliveredAt: string | null;
  codPaisa: number;
  remittedPaisa: number | null;
  remittedAt: string | null;
  differencePaisa: number | null;
  /** Days the money has been owed (delivered, not paid) or took to arrive (paid). */
  days: number | null;
  state: CodState;
};

export type CodReport = {
  rows: CodRow[];
  withCourier: { n: number; paisa: number };
  owed: { n: number; paisa: number; oldestDays: number | null };
  paidInRange: { n: number; paisa: number };
  differencePaisa: number;
  averageDaysToPay: number | null;
  byCourier: { courier: string; owedPaisa: number; withPaisa: number }[];
};

/** COD parcels booked in the range (or every unsettled parcel with scope "open"), with where the money is. */
export function codReconciliation(db: DB, range: ReportRange, scope: "range" | "open", now: Date = new Date()): CodReport {
  const raw = db.all<{ order: string; courier: string; cn: string | null; booked: string; delivered: string | null; cod: number; remitted: number | null; remittedAt: string | null; status: string }>(sql`
    SELECT o.code AS "order", s.courier, s.cn_number AS cn, s.booked_at AS booked, s.delivered_at AS delivered, s.cod_amount_paisa AS cod,
           s.remitted_paisa AS remitted, s.remitted_at AS remittedAt, s.status
    FROM shipments s JOIN orders o ON o.id = s.order_id
    WHERE o.payment_method = 'COD' AND s.status <> 'CANCELLED'
      AND ${scope === "open" ? sql`s.remitted_at IS NULL AND s.status NOT IN ('RETURNED_TO_ORIGIN')` : inRange(sql`s.booked_at`, range)}
    ORDER BY ${utc(sql`s.booked_at`)}, o.code`);
  const ms = parseTimestamp;
  const nowMs = now.getTime();
  const rows = raw.map<CodRow>((r) => {
    let state: CodState;
    if (r.remittedAt) state = r.remitted === r.cod ? "PAID" : "PAID_DIFFERENT";
    else if (r.status === "DELIVERED") state = "OWED";
    else if (r.status === "RETURNED_TO_ORIGIN" || r.status === "RETURN_IN_PROGRESS") state = "RETURNED";
    else state = "WITH_COURIER";
    const days = r.delivered ? Math.max(0, Math.floor(((r.remittedAt ? ms(r.remittedAt) : nowMs) - ms(r.delivered)) / 86_400_000)) : null;
    return { order: r.order, courier: r.courier, cn: r.cn, bookedAt: r.booked, deliveredAt: r.delivered, codPaisa: r.cod, remittedPaisa: r.remitted, remittedAt: r.remittedAt, differencePaisa: r.remittedAt ? (r.remitted ?? 0) - r.cod : null, days: state === "WITH_COURIER" || state === "RETURNED" ? null : days, state };
  });

  const of = (...s: CodState[]) => rows.filter((r) => s.includes(r.state));
  const tot = (rs: CodRow[], f: (r: CodRow) => number) => rs.reduce((a, r) => a + f(r), 0);
  const paid = of("PAID", "PAID_DIFFERENT");
  const owed = of("OWED");
  const days = paid.map((r) => r.days).filter((d): d is number => d !== null);
  const couriers = new Set(rows.map((r) => r.courier));
  return {
    rows,
    withCourier: { n: of("WITH_COURIER").length, paisa: tot(of("WITH_COURIER"), (r) => r.codPaisa) },
    owed: { n: owed.length, paisa: tot(owed, (r) => r.codPaisa), oldestDays: owed.length ? Math.max(...owed.map((r) => r.days ?? 0)) : null },
    paidInRange: { n: paid.length, paisa: tot(paid, (r) => r.remittedPaisa ?? 0) },
    differencePaisa: tot(paid, (r) => r.differencePaisa ?? 0),
    averageDaysToPay: days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null,
    byCourier: [...couriers].sort().map((c) => ({ courier: c, owedPaisa: tot(owed.filter((r) => r.courier === c), (r) => r.codPaisa), withPaisa: tot(of("WITH_COURIER").filter((r) => r.courier === c), (r) => r.codPaisa) })),
  };
}

/** The dashboard's "COD owed" figure comes from the same source as the report's "owed now". */
export const codOwedNow = (db: DB) => codOutstanding(db).totalOwedPaisa;

// ───────────────────────────── Cashier totals ─────────────────────────────

export type CashierRow = {
  cashierId: string;
  name: string;
  role: string;
  days: number;
  sales: number;
  items: number;
  totalPaisa: number;
  cashPaisa: number;
  nonCashPaisa: number;
  wholesaleSales: number;
  discountPaisa: number;
  averageTicketPaisa: number;
  firstSaleAt: string;
  lastSaleAt: string;
};

/** Counter sales per cashier over the range (the End-of-day page, for many days). Total = what customers paid. */
export function cashierTotals(db: DB, range: ReportRange): { rows: CashierRow[]; cashRefundsPaisa: number } {
  const raw = db.all<Omit<CashierRow, "averageTicketPaisa" | "nonCashPaisa">>(sql`
    SELECT o.created_by AS cashierId, coalesce(u.name, '—') AS name, coalesce(u.role, '') AS role,
           count(DISTINCT date(${utc(sql`o.placed_at`)}, '+5 hours')) AS days, count(*) AS sales,
           coalesce(sum((SELECT sum(i.quantity) FROM order_items i WHERE i.order_id = o.id)), 0) AS items,
           sum(o.total_paisa) AS totalPaisa, coalesce(sum(CASE WHEN o.payment_method = 'CASH' THEN o.total_paisa END), 0) AS cashPaisa,
           coalesce(sum(CASE WHEN o.price_tier = 'WHOLESALE' THEN 1 END), 0) AS wholesaleSales, coalesce(sum(o.discount_paisa), 0) AS discountPaisa,
           min(o.placed_at) AS firstSaleAt, max(o.placed_at) AS lastSaleAt
    FROM orders o LEFT JOIN user u ON u.id = o.created_by
    WHERE o.channel = 'COUNTER' AND o.fulfillment_status <> 'CANCELLED' AND ${inRange(sql`o.placed_at`, range)}
    GROUP BY o.created_by ORDER BY totalPaisa DESC, name`);
  const refunds = db.get<{ n: number }>(sql`SELECT coalesce(sum(refund_paisa), 0) AS n FROM returns WHERE refund_method = 'CASH' AND refunded_at IS NOT NULL AND ${inRange(sql`refunded_at`, range)}`)?.n ?? 0;
  return { rows: raw.map((r) => ({ ...r, nonCashPaisa: r.totalPaisa - r.cashPaisa, averageTicketPaisa: Math.round(r.totalPaisa / r.sales) })), cashRefundsPaisa: refunds };
}

// ───────────────────────────── Purchase cost analysis ─────────────────────────────

export type PoCostRow = {
  code: string;
  vendor: string;
  status: string;
  currency: string;
  orderedAt: string | null;
  receivedAt: string | null;
  unitsOrdered: number;
  unitsReceived: number;
  goodsPaisa: number;
  extrasPaisa: number;
  landedPaisa: number;
  /** Shipping + customs + other as a share of goods value (%). */
  upliftPercent: number | null;
  landedPerUnitPaisa: number | null;
  daysToReceive: number | null;
  promisedDays: number;
};

/** Purchase orders ordered (or, for drafts, created) in the range, with landed-cost uplift (spec §7 "PO cost analysis"). */
export function poCostAnalysis(db: DB, range: ReportRange): { rows: PoCostRow[]; totals: { goodsPaisa: number; extrasPaisa: number; landedPaisa: number; unitsOrdered: number; upliftPercent: number | null } } {
  const pos = db.all<{ id: string; code: string; vendor: string; lead: number; status: string; currency: string; fx: number; orderedAt: string | null; receivedAt: string | null; created: string; extras: number }>(sql`
    SELECT p.id, p.code, v.name AS vendor, v.lead_time_days AS lead, p.status, p.currency, p.fx_rate_to_pkr AS fx, p.ordered_at AS orderedAt, p.received_at AS receivedAt,
           p.created_at AS created, (p.shipping_cost_paisa + p.customs_duty_paisa + p.other_landed_cost_paisa) AS extras
    FROM purchase_orders p JOIN vendors v ON v.id = p.vendor_id
    WHERE p.status <> 'CANCELLED' AND ${inRange(sql`coalesce(p.ordered_at, p.created_at)`, range)}
    ORDER BY ${utc(sql`coalesce(p.ordered_at, p.created_at)`)}, p.code`);
  const items = db.all<{ poId: string; ordered: number; received: number; unit: number }>(sql`SELECT po_id AS poId, qty_ordered AS ordered, qty_received AS received, unit_cost_foreign AS unit FROM purchase_order_items`);
  const byPo = new Map<string, typeof items>();
  for (const i of items) byPo.set(i.poId, [...(byPo.get(i.poId) ?? []), i]);
  const ms = parseTimestamp;

  const rows = pos.map<PoCostRow>((p) => {
    const lines = byPo.get(p.id) ?? [];
    const goods = lines.reduce((s, l) => s + foreignToPaisa(l.unit, p.fx) * l.ordered, 0);
    const units = lines.reduce((s, l) => s + l.ordered, 0);
    return {
      code: p.code, vendor: p.vendor, status: p.status, currency: p.currency, orderedAt: p.orderedAt, receivedAt: p.receivedAt,
      unitsOrdered: units, unitsReceived: lines.reduce((s, l) => s + l.received, 0), goodsPaisa: goods, extrasPaisa: p.extras, landedPaisa: goods + p.extras,
      upliftPercent: goods > 0 ? Math.round((p.extras / goods) * 1000) / 10 : null,
      landedPerUnitPaisa: units > 0 ? Math.round((goods + p.extras) / units) : null,
      daysToReceive: p.orderedAt && p.receivedAt ? Math.max(0, Math.round((ms(p.receivedAt) - ms(p.orderedAt)) / 86_400_000)) : null,
      promisedDays: p.lead,
    };
  });
  const live = rows.filter((r) => r.status !== "DRAFT");
  const goods = live.reduce((s, r) => s + r.goodsPaisa, 0);
  const extras = live.reduce((s, r) => s + r.extrasPaisa, 0);
  return { rows, totals: { goodsPaisa: goods, extrasPaisa: extras, landedPaisa: goods + extras, unitsOrdered: live.reduce((s, r) => s + r.unitsOrdered, 0), upliftPercent: goods > 0 ? Math.round((extras / goods) * 1000) / 10 : null } };
}
