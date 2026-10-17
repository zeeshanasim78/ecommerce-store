import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { CourierError, courierProvider, isApiCourier, readCourierConfig } from "@/server/couriers";
import { requireStaff } from "@/server/dal";
import { activeShipment } from "@/server/orders/fulfilment";

/**
 * The courier's own label / airway bill for an order booked through its API (Q73).
 * Leopards gives a slip link at booking (stored as label_url); PostEx's airway bill is fetched
 * with the API token, so it is passed through here rather than linked.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff("orders");
  const { id } = await params;
  const ship = /^[0-9a-f-]{36}$/i.test(id) ? activeShipment(db, id) : undefined;
  if (!ship?.cnNumber || !isApiCourier(ship.courier)) return new Response("Not found", { status: 404 });
  if (ship.labelUrl && /^https:\/\//.test(ship.labelUrl)) redirect(ship.labelUrl);
  if (ship.courier !== "POSTEX") return new Response("This courier gave no label link — print our label instead.", { status: 404 });
  if (!readCourierConfig("POSTEX").configured) return new Response("PostEx isn’t connected (no API token).", { status: 409 });
  try {
    const f = await courierProvider("POSTEX").labelPdf!([ship.cnNumber]);
    return new Response(Buffer.from(f.pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${f.fileName}"`, "cache-control": "no-store, private" } });
  } catch (e) {
    if (e instanceof CourierError) return new Response(e.message, { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } });
    throw e;
  }
}
