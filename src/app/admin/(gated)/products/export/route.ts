import { db } from "@/db/client";
import { requireStaff } from "@/server/dal";
import { exportProductsCsv } from "@/server/catalog/product-csv";

/** Product CSV download (spec §7) — one row per colour; edit it in a spreadsheet and import it back. */
export async function GET() {
  await requireStaff("catalog");
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return new Response(exportProductsCsv(db), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caidea-products-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
