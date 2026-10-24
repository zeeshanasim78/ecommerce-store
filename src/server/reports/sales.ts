import { sql } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { dayOf, eachDay, inRange, type ReportRange } from "./range";

/**
 * The one definition of "a sale" for every report (SPECIFICATION §29.1).
 *
 * Counted: any order placed in the range that is not CANCELLED or RETURNED_TO_ORIGIN and whose
 * payment has not FAILED — online or counter. An order that is later refunded in part or in full
 * through a return stays a sale; the refund is shown by the Returns report, not hidden here.
 *
 * Sales = goods sold after discounts = subtotal − discount. Delivery and COD fees are shown apart.
 * Cost of goods = quantity × the unit cost saved on the order line when it was sold.
 */
export const COUNTED_ORDER = sql`o.fulfillment_status NOT IN ('CANCELLED','RETURNED_TO_ORIGIN') AND o.payment_status <> 'FAILED'`;

export type SoldLine = {
  orderId: string;
  channel: "ONLINE" | "COUNTER";
  day: string;
  createdBy: string | null;
  variantId: string;
  brand: string;
  model: string;
  grade: string;
  qty: number;
  /** Line value after this line's share of the order discount (exact: shares add up to the discount). */
  salesPaisa: number;
  costPaisa: number;
};

type Raw = { orderId: string; channel: "ONLINE" | "COUNTER"; day: string; createdBy: string | null; subtotal: number; discount: number; variantId: string; brand: string; model: string; grade: string; qty: number; lineTotal: number; unitCost: number; fee: number };

/** Every sold order line in the range, with the order discount shared out exactly (largest remainder). */
export function soldLines(db: DB, range: Pick<ReportRange, "start" | "end">): { lines: SoldLine[]; fees: Map<string, { day: string; channel: "ONLINE" | "COUNTER"; orderId: string; fee: number }> } {
  const raw = db.all<Raw>(sql`
    SELECT o.id AS orderId, o.channel AS channel, ${dayOf(sql`o.placed_at`)} AS day, o.created_by AS createdBy,
           o.subtotal_paisa AS subtotal, o.discount_paisa AS discount, (o.shipping_fee_paisa + o.cod_fee_paisa) AS fee,
           oi.variant_id AS variantId, oi.quantity AS qty, oi.line_total_paisa AS lineTotal, oi.unit_cost_paisa AS unitCost,
           json_extract(oi.product_snapshot, '$.brand') AS brand, json_extract(oi.product_snapshot, '$.model') AS model,
           json_extract(oi.product_snapshot, '$.qualityGrade') AS grade
    FROM orders o JOIN order_items oi ON oi.order_id = o.id
    WHERE ${COUNTED_ORDER} AND ${inRange(sql`o.placed_at`, range)}
    ORDER BY o.placed_at, o.id, oi.rowid`);

  const lines: SoldLine[] = [];
  const fees = new Map<string, { day: string; channel: "ONLINE" | "COUNTER"; orderId: string; fee: number }>();
  let i = 0;
  while (i < raw.length) {
    let j = i;
    while (j < raw.length && raw[j]!.orderId === raw[i]!.orderId) j++;
    const group = raw.slice(i, j);
    const head = group[0]!;
    fees.set(head.orderId, { day: head.day, channel: head.channel, orderId: head.orderId, fee: head.fee });
    // share the discount by line value, largest remainder so the shares add up to the discount
    const total = group.reduce((s, r) => s + r.lineTotal, 0);
    const shares = group.map((r) => (total > 0 ? Math.floor((head.discount * r.lineTotal) / total) : 0));
    let left = head.discount - shares.reduce((s, x) => s + x, 0);
    const order = group.map((r, k) => ({ k, rem: total > 0 ? (head.discount * r.lineTotal) % total : 0 })).sort((a, b) => b.rem - a.rem || a.k - b.k);
    for (const { k } of order) {
      if (left <= 0) break;
      shares[k]! += 1;
      left -= 1;
    }
    group.forEach((r, k) =>
      lines.push({ orderId: r.orderId, channel: r.channel, day: r.day, createdBy: r.createdBy, variantId: r.variantId, brand: r.brand, model: r.model, grade: r.grade, qty: r.qty, salesPaisa: r.lineTotal - shares[k]!, costPaisa: r.qty * r.unitCost }),
    );
    i = j;
  }
  return { lines, fees };
}

export type DayRow = {
  day: string;
  onlineOrders: number;
  onlineSales: number;
  counterOrders: number;
  counterSales: number;
  sales: number;
  units: number;
  cost: number;
  margin: number;
  fees: number;
};

export type SalesSummary = { days: DayRow[]; total: Omit<DayRow, "day"> };

const emptyDay = (day: string): DayRow => ({ day, onlineOrders: 0, onlineSales: 0, counterOrders: 0, counterSales: 0, sales: 0, units: 0, cost: 0, margin: 0, fees: 0 });

/** Sales per Karachi day, online vs counter, with cost and margin. Days without sales are included as zeros. */
export function salesByDay(db: DB, range: ReportRange): SalesSummary {
  const { lines, fees } = soldLines(db, range);
  const byDay = new Map(eachDay(range).map((d) => [d, emptyDay(d)]));
  for (const f of fees.values()) {
    const d = byDay.get(f.day);
    if (!d) continue;
    if (f.channel === "ONLINE") d.onlineOrders += 1;
    else d.counterOrders += 1;
    d.fees += f.fee;
  }
  for (const l of lines) {
    const d = byDay.get(l.day);
    if (!d) continue;
    if (l.channel === "ONLINE") d.onlineSales += l.salesPaisa;
    else d.counterSales += l.salesPaisa;
    d.sales += l.salesPaisa;
    d.units += l.qty;
    d.cost += l.costPaisa;
  }
  const days = [...byDay.values()];
  const total = emptyDay("");
  for (const d of days) {
    d.margin = d.sales - d.cost;
    for (const k of ["onlineOrders", "onlineSales", "counterOrders", "counterSales", "sales", "units", "cost", "margin", "fees"] as const) total[k] += d[k];
  }
  const { day: _day, ...rest } = total;
  void _day;
  return { days, total: rest };
}

export const marginPercent = (margin: number, sales: number) => (sales > 0 ? Math.round((margin / sales) * 1000) / 10 : null);
