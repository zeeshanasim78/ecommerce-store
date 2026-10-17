import { db } from "@/db/client";
import { CourierError, courierProvider, readCourierConfig } from "@/server/couriers";
import { requireStaff } from "@/server/dal";
import { loadSheetDetails } from "@/server/orders/fulfilment";

/** The courier's own load sheet PDF (PostEx), for a load sheet made here. OWNER/MANAGER. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff("orders");
  const { id } = await params;
  const d = /^[0-9a-f-]{36}$/i.test(id) ? loadSheetDetails(db, id) : null;
  if (!d || d.sheet.courier !== "POSTEX") return new Response("Not found", { status: 404 });
  if (!readCourierConfig("POSTEX").configured) return new Response("PostEx isn’t connected (no API token).", { status: 409 });
  const cns = d.parcels.map((p) => p.cn).filter((cn): cn is string => Boolean(cn));
  try {
    const r = await courierProvider("POSTEX").loadSheet!(cns);
    if (!r.file) return new Response("PostEx sent no PDF.", { status: 502 });
    return new Response(Buffer.from(r.file.pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${d.sheet.code}-postex.pdf"`, "cache-control": "no-store, private" } });
  } catch (e) {
    if (e instanceof CourierError) return new Response(e.message, { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } });
    throw e;
  }
}
