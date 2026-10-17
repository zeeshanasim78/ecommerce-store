import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, like, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { codRemittanceLines, codRemittances, orderItems, orders, payments, productVariants, products, shipments, user } from "@/db/schema";
import { COURIERS, type Courier, type RemittanceResult } from "@/db/schema/logistics";
import { CsvParseError, parseCsv } from "@/lib/csv";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { withStockTransaction } from "@/server/inventory/stock";
import { OrderActionError } from "./admin-orders";

/**
 * COD remittance (SPECIFICATION §9, §27, Q71): the courier pays the shop the cash it collected and
 * sends a payment report. Staff upload it as CSV; each row is matched to our shipment by courier + CN.
 *   upload → DRAFT with one line per row (MATCH / AMOUNT_DIFFERS / UNKNOWN_CN / …) → staff review
 *   → Confirm: MATCH rows, and differing / not-yet-delivered rows staff ticked with a reason, become
 *     COD_REMITTED (payment SUCCEEDED). Anything else is left as it was.
 * The same file (SHA-256) can't be uploaded twice for a courier.
 */

export const MAX_REMITTANCE_BYTES = 1024 * 1024;
export const MAX_REMITTANCE_ROWS = 5000;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** Header names couriers use for the consignment number, most specific first. */
const CN_HEADERS = ["cn", "cnno", "cnnumber", "consignmentno", "consignmentnumber", "consignment", "trackingnumber", "trackingno", "tracknumber", "trackno", "bookedpacketcn", "awb", "awbno", "airwaybill", "airwaybillno"];
/** COD collected (not the net after charges), most specific first. */
const AMOUNT_HEADERS = ["codamount", "collectedamount", "collectamount", "bookedpacketcollectamount", "codcollected", "invoicepayment", "invoiceamount", "cod", "amount", "orderamount"];

export type ParsedRemittance = { header: string[]; cnColumn: string; amountColumn: string; rows: { rowNo: number; cn: string; amountPaisa: number }[] };

/** Rupee text from a spreadsheet ("Rs 12,500", "12500.00", "12,500/-") → paisa. */
export function rupeesToPaisa(raw: string): number | null {
  const s = raw.replace(/rs\.?|pkr|\/-|,|\s/gi, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function parseRemittanceCsv(text: string, choose: { cnColumn?: string; amountColumn?: string } = {}): ParsedRemittance {
  if (text.length > MAX_REMITTANCE_BYTES) throw new CsvParseError("The file is larger than 1 MB — split it into smaller files.");
  const all = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  // The header is the first row (of the first 10) that has a CN-like column — some reports start with a title
  const pickCol = (header: string[], wanted: string | undefined, names: string[]) => {
    if (wanted) {
      const i = header.findIndex((h) => norm(h) === norm(wanted));
      return i;
    }
    for (const n of names) {
      const i = header.findIndex((h) => norm(h) === n);
      if (i >= 0) return i;
    }
    return -1;
  };
  let headerAt = -1;
  for (let i = 0; i < Math.min(all.length, 10); i++) if (pickCol(all[i]!, choose.cnColumn, CN_HEADERS) >= 0) {
    headerAt = i;
    break;
  }
  if (headerAt < 0) throw new CsvParseError(`No consignment-number column found. Name it “CN” (or pick the column below). First row: ${(all[0] ?? []).slice(0, 8).join(", ")}`);
  const header = all[headerAt]!.map((h) => h.trim());
  const cnIdx = pickCol(header, choose.cnColumn, CN_HEADERS);
  const amtIdx = pickCol(header, choose.amountColumn, AMOUNT_HEADERS);
  if (amtIdx < 0) throw new CsvParseError(`No COD amount column found. Name it “COD Amount” (or pick the column below). Columns: ${header.join(", ")}`);
  const body = all.slice(headerAt + 1);
  if (body.length > MAX_REMITTANCE_ROWS) throw new CsvParseError(`Up to ${MAX_REMITTANCE_ROWS.toLocaleString("en-PK")} rows per file.`);
  const rows: ParsedRemittance["rows"] = [];
  const errors: string[] = [];
  body.forEach((r, i) => {
    const rowNo = headerAt + i + 2; // spreadsheet row number
    const cn = (r[cnIdx] ?? "").trim().toUpperCase().replace(/^'/, "");
    const amtRaw = (r[amtIdx] ?? "").trim();
    if (!cn && !amtRaw) return;
    if (/^total/i.test(cn) || (!cn && /total/i.test(r.join(" ")))) return; // summary rows
    if (!/^[A-Z0-9-]{3,40}$/.test(cn)) return void errors.push(`Row ${rowNo}: “${cn.slice(0, 30)}” isn’t a CN`);
    const amount = rupeesToPaisa(amtRaw);
    if (amount === null) return void errors.push(`Row ${rowNo}: amount “${amtRaw.slice(0, 20)}” isn’t a number`);
    rows.push({ rowNo, cn, amountPaisa: amount });
  });
  if (errors.length) throw new CsvParseError(`Nothing was uploaded. Fix these rows: ${errors.slice(0, 8).join("; ")}${errors.length > 8 ? ` (+${errors.length - 8} more)` : ""}.`);
  if (!rows.length) throw new CsvParseError("The file has no CN rows.");
  return { header, cnColumn: header[cnIdx]!, amountColumn: header[amtIdx]!, rows };
}

function nextRemittanceCode(tx: Tx) {
  const last = tx.select({ code: codRemittances.code }).from(codRemittances).where(like(codRemittances.code, "COD-%")).orderBy(desc(codRemittances.code)).get();
  return `COD-${String(last ? Number(last.code.slice(4)) + 1 : 1).padStart(4, "0")}`;
}

/** Can staff accept this line with a reason? (A different amount, or a parcel we hadn't marked delivered yet.) */
export const acceptable = (l: { result: RemittanceResult; note: string | null }) => l.result === "AMOUNT_DIFFERS" || (l.result === "NOT_DELIVERED" && !l.note);

export function uploadRemittance(db: DB, input: { courier: string; fileName: string; text: string; reference?: string; cnColumn?: string; amountColumn?: string; actorId: string }, ctx: AuditContext) {
  const courier = input.courier as Courier;
  if (!(COURIERS as readonly string[]).includes(courier) || courier === "SELF") throw new OrderActionError("Choose the courier that sent the payment report.");
  const parsed = parseRemittanceCsv(input.text, { cnColumn: input.cnColumn || undefined, amountColumn: input.amountColumn || undefined });
  const sha = createHash("sha256").update(input.text).digest("hex");
  const reference =
    input.reference
      ?.replace(/[\u0000-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, 60) || null;
  const fileName = input.fileName.replace(/[^\w .()-]/g, "_").slice(0, 120) || "report.csv";
  return withStockTransaction(db, (tx) => {
    const same = tx
      .select()
      .from(codRemittances)
      .where(and(eq(codRemittances.courier, courier), eq(codRemittances.fileSha256, sha)))
      .get();
    if (same?.status === "CONFIRMED") throw new OrderActionError(`This file was already applied as ${same.code}.`);
    if (same) tx.delete(codRemittances).where(eq(codRemittances.id, same.id)).run(); // an unconfirmed upload of the same file is replaced
    const id = crypto.randomUUID();
    const code = same?.code ?? nextRemittanceCode(tx);
    tx.insert(codRemittances).values({ id, code, courier, reference, fileName, fileSha256: sha, rows: parsed.rows.length, createdBy: input.actorId }).run();
    const seen = new Set<string>();
    const counts: Partial<Record<RemittanceResult, number>> = {};
    for (const r of parsed.rows) {
      let result: RemittanceResult;
      let note: string | null = null;
      const ship = tx
        .select({ s: shipments, o: orders })
        .from(shipments)
        .innerJoin(orders, eq(orders.id, shipments.orderId))
        .where(and(eq(shipments.courier, courier), sql`upper(${shipments.cnNumber}) = ${r.cn}`))
        .orderBy(desc(sql`${shipments}.rowid`))
        .get();
      if (seen.has(r.cn)) result = "DUPLICATE_ROW";
      else if (!ship) result = "UNKNOWN_CN";
      else if (ship.o.paymentMethod !== "COD" || ship.s.codAmountPaisa === 0) result = "NOT_COD";
      else if (ship.s.remittanceId || ship.o.paymentStatus === "COD_REMITTED") result = "ALREADY_REMITTED";
      else if (ship.o.fulfillmentStatus !== "DELIVERED") {
        result = "NOT_DELIVERED";
        if (!["BOOKED", "IN_TRANSIT"].includes(ship.o.fulfillmentStatus) || ship.s.status === "CANCELLED") note = "Our records say this parcel was returned or cancelled — check with the courier.";
      } else result = r.amountPaisa === ship.s.codAmountPaisa ? "MATCH" : "AMOUNT_DIFFERS";
      seen.add(r.cn);
      counts[result] = (counts[result] ?? 0) + 1;
      tx.insert(codRemittanceLines)
        .values({ remittanceId: id, rowNo: r.rowNo, cn: r.cn, amountPaisa: r.amountPaisa, shipmentId: ship?.s.id ?? null, orderId: ship?.o.id ?? null, expectedPaisa: ship?.s.codAmountPaisa ?? null, result, note })
        .run();
    }
    writeAudit(tx, ctx, { actorId: input.actorId, action: "cod_remittance.uploaded", entity: "cod_remittances", entityId: id, after: { code, courier, fileName, rows: parsed.rows.length, columns: [parsed.cnColumn, parsed.amountColumn], counts } });
    return { id, code, counts, columns: { cn: parsed.cnColumn, amount: parsed.amountColumn } };
  });
}

/**
 * Applies a draft: MATCH lines, plus lines staff accepted with a reason. Each applied order becomes
 * COD_REMITTED (delivered first, if we hadn't recorded that yet). Re-checks every line, so a
 * shipment remitted meanwhile is skipped rather than counted twice.
 */
export function confirmRemittance(db: DB, remittanceId: string, input: { accepted: Record<string, string>; actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  return withStockTransaction(db, (tx) => {
    const rem = tx.select().from(codRemittances).where(eq(codRemittances.id, remittanceId)).get();
    if (!rem) throw new OrderActionError("Remittance not found.");
    if (rem.status !== "DRAFT") throw new OrderActionError(`${rem.code} is already ${rem.status === "CONFIRMED" ? "confirmed" : "discarded"}.`);
    const lines = tx.select().from(codRemittanceLines).where(eq(codRemittanceLines.remittanceId, rem.id)).orderBy(asc(codRemittanceLines.rowNo)).all();
    const problems: string[] = [];
    for (const [lineId, reason] of Object.entries(input.accepted)) {
      const l = lines.find((x) => x.id === lineId);
      if (!l || !acceptable(l)) problems.push("a ticked row can’t be accepted");
      else if (reason.trim().length < 3) problems.push(`row ${l.rowNo} (${l.cn}): write why you accept it`);
    }
    if (problems.length) throw new OrderActionError(`Nothing was applied: ${[...new Set(problems)].join("; ")}.`);
    let applied = 0;
    let appliedPaisa = 0;
    const skipped: string[] = [];
    for (const l of lines) {
      const reason = input.accepted[l.id]?.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 200);
      if (!(l.result === "MATCH" || (reason && acceptable(l))) || !l.shipmentId || !l.orderId) continue;
      const s = tx.select().from(shipments).where(eq(shipments.id, l.shipmentId)).get();
      const o = tx.select().from(orders).where(eq(orders.id, l.orderId)).get();
      if (!s || !o || s.remittanceId || o.paymentStatus === "COD_REMITTED" || !(o.fulfillmentStatus === "DELIVERED" || ["BOOKED", "IN_TRANSIT"].includes(o.fulfillmentStatus))) {
        skipped.push(l.cn);
        tx.update(codRemittanceLines).set({ note: "Skipped: changed since the upload (already remitted or returned)." }).where(eq(codRemittanceLines.id, l.id)).run();
        continue;
      }
      if (o.fulfillmentStatus !== "DELIVERED") {
        // The courier paid for it, so it was delivered — record that first (warranty starts now)
        tx.update(shipments).set({ status: "DELIVERED", deliveredAt: now.toISOString() }).where(eq(shipments.id, s.id)).run();
        for (const i of tx
          .select({ id: orderItems.id, days: products.warrantyDays })
          .from(orderItems)
          .innerJoin(productVariants, eq(productVariants.id, orderItems.variantId))
          .innerJoin(products, eq(products.id, productVariants.productId))
          .where(and(eq(orderItems.orderId, o.id), isNull(orderItems.warrantyUntil)))
          .all())
          tx.update(orderItems)
            .set({ warrantyUntil: i.days > 0 ? new Date(now.getTime() + i.days * 86_400_000).toISOString() : null })
            .where(eq(orderItems.id, i.id))
            .run();
      }
      tx.update(shipments).set({ remittanceId: rem.id, remittedPaisa: l.amountPaisa, remittedAt: now.toISOString() }).where(eq(shipments.id, s.id)).run();
      tx.update(orders).set({ fulfillmentStatus: "DELIVERED", paymentStatus: "COD_REMITTED", paidAt: now.toISOString() }).where(eq(orders.id, o.id)).run();
      tx.update(payments).set({ status: "SUCCEEDED", providerRef: `${rem.code}/${l.cn}`, verifiedBy: input.actorId, verifiedAt: now.toISOString() }).where(eq(payments.orderId, o.id)).run();
      tx.update(codRemittanceLines)
        .set({ applied: true, note: reason ? `Accepted: ${reason}` : l.note })
        .where(eq(codRemittanceLines.id, l.id))
        .run();
      writeAudit(tx, ctx, {
        actorId: input.actorId,
        action: "order.cod_remitted",
        entity: "orders",
        entityId: o.id,
        before: { paymentStatus: o.paymentStatus, fulfillmentStatus: o.fulfillmentStatus },
        after: { paymentStatus: "COD_REMITTED", remittance: rem.code, amountPaisa: l.amountPaisa, expectedPaisa: l.expectedPaisa, ...(reason ? { acceptedBecause: reason } : {}) },
      });
      applied += 1;
      appliedPaisa += l.amountPaisa;
    }
    tx.update(codRemittances).set({ status: "CONFIRMED", appliedCount: applied, appliedPaisa, confirmedBy: input.actorId, confirmedAt: now.toISOString() }).where(eq(codRemittances.id, rem.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "cod_remittance.confirmed", entity: "cod_remittances", entityId: rem.id, after: { code: rem.code, applied, appliedPaisa, skipped } });
    return { code: rem.code, applied, appliedPaisa, skipped };
  });
}

/** Throw away an upload that hasn't been confirmed (wrong file, wrong courier). */
export function discardRemittance(db: DB, remittanceId: string, input: { actorId: string }, ctx: AuditContext) {
  return withStockTransaction(db, (tx) => {
    const rem = tx.select().from(codRemittances).where(eq(codRemittances.id, remittanceId)).get();
    if (!rem) throw new OrderActionError("Remittance not found.");
    if (rem.status !== "DRAFT") throw new OrderActionError(`${rem.code} is confirmed and can’t be discarded.`);
    tx.delete(codRemittances).where(eq(codRemittances.id, rem.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "cod_remittance.discarded", entity: "cod_remittances", entityId: rem.id, after: { code: rem.code, fileName: rem.fileName } });
    return rem.code;
  });
}

export function remittanceDetails(db: DB, id: string) {
  const rem = db
    .select({ r: codRemittances, by: user.name })
    .from(codRemittances)
    .leftJoin(user, eq(user.id, codRemittances.createdBy))
    .where(eq(codRemittances.id, id))
    .get();
  if (!rem) return null;
  const lines = db
    .select({ l: codRemittanceLines, code: orders.code })
    .from(codRemittanceLines)
    .leftJoin(orders, eq(orders.id, codRemittanceLines.orderId))
    .where(eq(codRemittanceLines.remittanceId, id))
    .orderBy(asc(codRemittanceLines.rowNo))
    .all();
  return { ...rem.r, uploadedBy: rem.by, lines: lines.map((x) => ({ ...x.l, orderCode: x.code })) };
}

export function listRemittances(db: DB, limit = 30) {
  return db.select().from(codRemittances).orderBy(desc(codRemittances.createdAt), desc(codRemittances.code)).limit(limit).all();
}

/** COD the couriers owe the shop: delivered and not yet remitted, and still out with the courier. */
export function codOutstanding(db: DB) {
  const delivered = db
    .select({ orderId: orders.id, code: orders.code, courier: shipments.courier, cn: shipments.cnNumber, cod: shipments.codAmountPaisa, deliveredAt: shipments.deliveredAt })
    .from(orders)
    .innerJoin(shipments, and(eq(shipments.orderId, orders.id), eq(shipments.status, "DELIVERED")))
    .where(and(eq(orders.paymentMethod, "COD"), eq(orders.paymentStatus, "COD_COLLECTED")))
    .orderBy(asc(shipments.deliveredAt))
    .all();
  const withCourier = db
    .select({ courier: shipments.courier, n: sql<number>`count(*)`, cod: sql<number>`coalesce(sum(${shipments.codAmountPaisa}), 0)` })
    .from(orders)
    .innerJoin(shipments, and(eq(shipments.orderId, orders.id), sql`${shipments.status} NOT IN ('DELIVERED','RETURNED_TO_ORIGIN','CANCELLED')`))
    .where(and(eq(orders.paymentMethod, "COD"), inArray(orders.fulfillmentStatus, ["BOOKED", "IN_TRANSIT"])))
    .groupBy(shipments.courier)
    .all();
  const byCourier = new Map<string, { n: number; cod: number }>();
  for (const d of delivered) {
    const c = byCourier.get(d.courier) ?? { n: 0, cod: 0 };
    c.n += 1;
    c.cod += d.cod;
    byCourier.set(d.courier, c);
  }
  return { delivered, owed: [...byCourier.entries()].map(([courier, v]) => ({ courier, ...v })), withCourier, totalOwedPaisa: delivered.reduce((s, d) => s + d.cod, 0) };
}
