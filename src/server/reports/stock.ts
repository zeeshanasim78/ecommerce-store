import { sql } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { toPaisa } from "@/lib/money";
import { parseTimestamp } from "@/lib/time";
import { soldLines } from "./sales";
import { lastDays, utc, type ReportRange } from "./range";

/**
 * Stock-position reports: velocity, days of cover and reorder suggestions, dead stock, turnover
 * (SPECIFICATION §6.6, §29). Units sold are NET (Q90): online and counter sales minus units that came back
 * (customer returns restocked and cancelled / undelivered orders restocked), so a cancelled order is not demand.
 */

const NET_TYPES = sql`('STORE_SALE','COUNTER_POS','REPAIR_RETURN','ORDER_CANCEL_RESTOCK')`;
const SALE_TYPES = sql`('STORE_SALE','COUNTER_POS')`;

/** Reorder rule constants (Q91). */
export const SAFETY_DAYS = 7;
export const COVER_TARGET_DAYS = 30;

export type VariantStat = {
  variantId: string;
  productId: string;
  brand: string;
  model: string;
  grade: string;
  color: string;
  sku: string;
  stock: number;
  threshold: number;
  costPaisa: number;
  units7: number;
  units30: number;
  units90: number;
  lastSaleAt: string | null;
  firstStockedAt: string | null;
};

/** Every live (not archived) colour with its stock and net units sold over 7 / 30 / 90 days ending today. */
export function variantStats(db: DB, now: Date = new Date()): VariantStat[] {
  const w7 = lastDays(7, now);
  const w30 = lastDays(30, now);
  const w90 = lastDays(90, now);
  const rows = db.all<{ variantId: string; productId: string; brand: string; model: string; grade: string; color: string; sku: string; stock: number; threshold: number; cost: number; u7: number; u30: number; u90: number; lastSale: string | null; firstStocked: string | null }>(sql`
    SELECT v.id AS variantId, p.id AS productId, p.brand, p.model, p.quality_grade AS grade, v.color, v.variant_sku AS sku,
           v.current_stock AS stock, p.low_stock_threshold AS threshold, p.cost_price AS cost,
           coalesce((SELECT -sum(l.quantity_changed) FROM stock_ledger l WHERE l.variant_id = v.id AND l.transaction_type IN ${NET_TYPES} AND ${utc(sql`l.timestamp`)} >= ${w7.start} AND ${utc(sql`l.timestamp`)} < ${w7.end}), 0) AS u7,
           coalesce((SELECT -sum(l.quantity_changed) FROM stock_ledger l WHERE l.variant_id = v.id AND l.transaction_type IN ${NET_TYPES} AND ${utc(sql`l.timestamp`)} >= ${w30.start} AND ${utc(sql`l.timestamp`)} < ${w30.end}), 0) AS u30,
           coalesce((SELECT -sum(l.quantity_changed) FROM stock_ledger l WHERE l.variant_id = v.id AND l.transaction_type IN ${NET_TYPES} AND ${utc(sql`l.timestamp`)} >= ${w90.start} AND ${utc(sql`l.timestamp`)} < ${w90.end}), 0) AS u90,
           (SELECT max(${utc(sql`l.timestamp`)}) FROM stock_ledger l WHERE l.variant_id = v.id AND l.transaction_type IN ${SALE_TYPES}) AS lastSale,
           (SELECT min(${utc(sql`l.timestamp`)}) FROM stock_ledger l WHERE l.variant_id = v.id AND l.transaction_type IN ('OPENING_BALANCE','INBOUND_PO')) AS firstStocked
    FROM product_variants v JOIN products p ON p.id = v.product_id
    WHERE v.archived_at IS NULL AND p.archived_at IS NULL
    ORDER BY p.brand, p.model, v.color`);
  return rows.map((r) => ({
    variantId: r.variantId,
    productId: r.productId,
    brand: r.brand,
    model: r.model,
    grade: r.grade,
    color: r.color,
    sku: r.sku,
    stock: r.stock,
    threshold: r.threshold,
    costPaisa: toPaisa(r.cost),
    units7: r.u7,
    units30: r.u30,
    units90: r.u90,
    lastSaleAt: r.lastSale,
    firstStockedAt: r.firstStocked,
  }));
}

export type BrandVelocity = { brand: string; colours: number; stock: number; units7: number; units30: number; units90: number; perDay30: number; shareOf30: number };

export function brandVelocity(stats: VariantStat[]): BrandVelocity[] {
  const by = new Map<string, BrandVelocity>();
  for (const s of stats) {
    const b = by.get(s.brand) ?? { brand: s.brand, colours: 0, stock: 0, units7: 0, units30: 0, units90: 0, perDay30: 0, shareOf30: 0 };
    b.colours += 1;
    b.stock += s.stock;
    b.units7 += s.units7;
    b.units30 += s.units30;
    b.units90 += s.units90;
    by.set(s.brand, b);
  }
  const all = [...by.values()];
  const total30 = all.reduce((s, b) => s + Math.max(0, b.units30), 0);
  for (const b of all) {
    b.perDay30 = Math.round((b.units30 / 30) * 100) / 100;
    b.shareOf30 = total30 > 0 ? Math.round((Math.max(0, b.units30) / total30) * 1000) / 10 : 0;
  }
  return all.sort((a, b) => b.units30 - a.units30 || a.brand.localeCompare(b.brand));
}

// ───────────────────────────── Reorder ─────────────────────────────

export type ReorderStatus = "REORDER" | "LOW" | "OK" | "NO_SALES";
export type ReorderRow = VariantStat & {
  perDay: number;
  /** null when nothing sold in 30 days (cover can't be worked out). */
  daysOfCover: number | null;
  vendor: string | null;
  leadDays: number;
  leadSource: "PO" | "BRAND" | "DEFAULT";
  onOrder: number;
  triggerDays: number;
  suggested: number;
  status: ReorderStatus;
};

export const DEFAULT_LEAD_DAYS = 7;

/**
 * Days of cover = stock ÷ (net units sold in 30 days ÷ 30). Reorder when cover < supplier lead time + 7 days (§6.6).
 * Lead time: the supplier of the newest purchase order for that colour, else a supplier that lists the brand, else 7.
 * Suggested quantity (Q91): enough to last lead time + 7 safety days + 30 days after arrival, less stock and open orders.
 */
export function reorderRows(db: DB, stats: VariantStat[]): ReorderRow[] {
  const po = db.all<{ variantId: string; vendor: string; lead: number }>(sql`
    SELECT i.variant_id AS variantId, v.name AS vendor, v.lead_time_days AS lead
    FROM purchase_order_items i JOIN purchase_orders p ON p.id = i.po_id JOIN vendors v ON v.id = p.vendor_id
    WHERE p.status <> 'CANCELLED' ORDER BY p.created_at DESC, p.code DESC`);
  const newest = new Map<string, { vendor: string; lead: number }>();
  for (const r of po) if (!newest.has(r.variantId)) newest.set(r.variantId, { vendor: r.vendor, lead: r.lead });
  const onOrder = new Map(
    db.all<{ variantId: string; n: number }>(sql`SELECT i.variant_id AS variantId, sum(i.qty_ordered - i.qty_received) AS n FROM purchase_order_items i JOIN purchase_orders p ON p.id = i.po_id WHERE p.status IN ('ORDERED','PARTIALLY_RECEIVED') GROUP BY i.variant_id`).map((r) => [r.variantId, r.n]),
  );
  const vendors = db.all<{ name: string; lead: number; brands: string | null }>(sql`SELECT name, lead_time_days AS lead, brands_supplied AS brands FROM vendors WHERE archived_at IS NULL ORDER BY name`);
  const brandVendor = (brand: string) =>
    vendors.find((v) => {
      try {
        return (JSON.parse(v.brands ?? "[]") as string[]).some((b) => b.toLowerCase() === brand.toLowerCase());
      } catch {
        return false;
      }
    });

  const rows = stats.map<ReorderRow>((s) => {
    const fromPo = newest.get(s.variantId);
    const fromBrand = fromPo ? undefined : brandVendor(s.brand);
    const lead = fromPo?.lead ?? fromBrand?.lead ?? DEFAULT_LEAD_DAYS;
    const perDay = Math.max(0, s.units30) / 30;
    const cover = perDay > 0 ? Math.round((s.stock / perDay) * 10) / 10 : null;
    const trigger = lead + SAFETY_DAYS;
    const open = onOrder.get(s.variantId) ?? 0;
    let status: ReorderStatus;
    if (cover !== null && cover < trigger) status = "REORDER";
    else if (s.stock <= s.threshold) status = "LOW";
    else status = cover === null ? "NO_SALES" : "OK";
    const need = Math.ceil(perDay * (lead + SAFETY_DAYS + COVER_TARGET_DAYS)) - s.stock - open;
    const suggested = status === "REORDER" ? Math.max(1, need) : 0;
    return { ...s, perDay: Math.round(perDay * 100) / 100, daysOfCover: cover, vendor: fromPo?.vendor ?? fromBrand?.name ?? null, leadDays: lead, leadSource: fromPo ? "PO" : fromBrand ? "BRAND" : "DEFAULT", onOrder: open, triggerDays: trigger, suggested, status };
  });
  const rank: Record<ReorderStatus, number> = { REORDER: 0, LOW: 1, OK: 2, NO_SALES: 3 };
  return rows.sort((a, b) => rank[a.status] - rank[b.status] || (a.daysOfCover ?? 1e9) - (b.daysOfCover ?? 1e9) || a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
}

// ───────────────────────────── Dead stock ─────────────────────────────

export type DeadRow = VariantStat & { daysSinceSale: number | null; valuePaisa: number; newStock: boolean };

/** Net units sold per colour over the last `days` days. */
export function netUnits(db: DB, days: number, now: Date = new Date()): Map<string, number> {
  const w = lastDays(days, now);
  return new Map(
    db
      .all<{ id: string; n: number }>(sql`SELECT variant_id AS id, -sum(quantity_changed) AS n FROM stock_ledger WHERE transaction_type IN ${NET_TYPES} AND ${utc(sql`timestamp`)} >= ${w.start} AND ${utc(sql`timestamp`)} < ${w.end} GROUP BY variant_id`)
      .map((r) => [r.id, r.n]),
  );
}

/**
 * Colours holding stock with no net sales in the last `days` days (default 90, §6.6). `newStock` marks colours first
 * stocked inside the window — they may simply not have had time to sell (Q92: listed, not hidden).
 */
export function deadStock(db: DB, stats: VariantStat[], days: number, now: Date = new Date()): DeadRow[] {
  const w = lastDays(days, now);
  const sold = netUnits(db, days, now);
  const ms = parseTimestamp;
  return stats
    .filter((s) => s.stock > 0 && (sold.get(s.variantId) ?? 0) <= 0)
    .map((s) => ({
      ...s,
      daysSinceSale: s.lastSaleAt ? Math.floor((now.getTime() - ms(s.lastSaleAt)) / 86_400_000) : null,
      valuePaisa: s.stock * s.costPaisa,
      newStock: s.firstStockedAt ? ms(s.firstStockedAt) >= ms(w.start) : false,
    }))
    .sort((a, b) => b.valuePaisa - a.valuePaisa || a.brand.localeCompare(b.brand));
}

// ───────────────────────────── Turnover ─────────────────────────────

export type TurnoverRow = { brand: string; cogsPaisa: number; openingPaisa: number; closingPaisa: number; averagePaisa: number; turns: number | null; annualTurns: number | null; daysToSell: number | null };

/**
 * Inventory turnover = cost of goods sold in the range ÷ average inventory value (§6.6).
 * Average = (value at the start + value at the end) ÷ 2, each rebuilt from the ledger (stock then × current average cost).
 */
export function turnover(db: DB, range: ReportRange): { rows: TurnoverRow[]; total: TurnoverRow } {
  const at = (t: string) =>
    new Map(
      db.all<{ brand: string; value: number }>(sql`
        SELECT p.brand AS brand, sum(s.qty * p.cost_price) AS value
        FROM (SELECT variant_id, sum(quantity_changed) AS qty FROM stock_ledger WHERE ${utc(sql`timestamp`)} < ${t} GROUP BY variant_id) s
        JOIN product_variants v ON v.id = s.variant_id JOIN products p ON p.id = v.product_id GROUP BY p.brand`).map((r) => [r.brand, toPaisa(r.value)]),
    );
  const open = at(range.start);
  const close = at(range.end);
  const cogs = new Map<string, number>();
  for (const l of soldLines(db, range).lines) cogs.set(l.brand, (cogs.get(l.brand) ?? 0) + l.costPaisa);
  const brands = new Set([...open.keys(), ...close.keys(), ...cogs.keys()]);
  const make = (brand: string, c: number, o: number, e: number): TurnoverRow => {
    const avg = Math.round((o + e) / 2);
    const turns = avg > 0 ? Math.round((c / avg) * 100) / 100 : null;
    return { brand, cogsPaisa: c, openingPaisa: o, closingPaisa: e, averagePaisa: avg, turns, annualTurns: turns === null ? null : Math.round(turns * (365 / range.days) * 100) / 100, daysToSell: c > 0 ? Math.round((avg / c) * range.days * 10) / 10 : null };
  };
  const rows = [...brands].map((b) => make(b, cogs.get(b) ?? 0, open.get(b) ?? 0, close.get(b) ?? 0)).sort((a, b) => b.cogsPaisa - a.cogsPaisa || a.brand.localeCompare(b.brand));
  const sum = (k: "cogsPaisa" | "openingPaisa" | "closingPaisa") => rows.reduce((s, r) => s + r[k], 0);
  return { rows, total: make("All brands", sum("cogsPaisa"), sum("openingPaisa"), sum("closingPaisa")) };
}
