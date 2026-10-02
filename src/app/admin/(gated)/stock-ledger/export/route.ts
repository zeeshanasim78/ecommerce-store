import { db } from "@/db/client";
import { toCsv } from "@/lib/csv";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { MOVEMENT_LABEL, listLedger, parseLedgerFilters, referenceLabel } from "@/server/inventory/ledger";

/** CSV download of the ledger with the page's filters (spec §7). A read-only GET, so a route handler. */
export async function GET(request: Request) {
  await requireStaff("ledger");
  const filters = parseLedgerFilters(Object.fromEntries(new URL(request.url).searchParams));
  const rows = listLedger(db, filters, { limit: 100_000, offset: 0 });
  const csv = toCsv(
    ["time_karachi", "time_utc", "brand", "model", "grade", "variant_sku", "colour", "movement", "type_code", "change", "stock_before", "stock_after", "unit_cost_pkr", "reference", "reference_type", "done_by", "notes"],
    rows.map((r) => [
      formatKarachi(r.timestamp),
      r.timestamp,
      r.brand,
      r.model,
      r.grade,
      r.variantSku,
      r.color,
      MOVEMENT_LABEL[r.type],
      r.type,
      r.quantity,
      r.previousStock,
      r.newStock,
      r.unitCostPaisa === null ? null : r.unitCostPaisa / 100,
      referenceLabel(r),
      r.referenceType,
      r.operatorName ?? r.operatorId,
      r.notes,
    ]),
  );
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caidea-stock-ledger-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
