import { and, eq, inArray } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { deliveryZones, orderItems, orders } from "@/db/schema";
import { formatPkMobile } from "@/lib/phone";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import { COURIER_LABEL } from "./order-details";
import { activeShipment } from "./fulfilment";

/**
 * What goes on a shipping label and packing slip (M10 Phase B, Q73). Works for every online order
 * that is packed or with a courier — with a CN from an API booking, a pasted CN, or none yet
 * (own rider): then the order number is the barcode.
 */
export type LabelData = {
  orderId: string;
  code: string;
  placedAt: string;
  name: string;
  phone: string;
  address: string[];
  city: string;
  courier: string | null;
  cn: string | null;
  codPaisa: number;
  paid: boolean;
  pieces: number;
  weightGrams: number | null;
  notes: string | null;
  items: { qty: number; name: string; detail: string; sku: string }[];
};

export function loadLabels(db: DB, orderIds: string[]): { labels: LabelData[]; sender: { name: string; phone: string | null; city: string | null } } {
  const ids = [...new Set(orderIds)].slice(0, 100);
  const rows = ids.length
    ? db
        .select()
        .from(orders)
        .where(and(inArray(orders.id, ids), eq(orders.channel, "ONLINE"), inArray(orders.fulfillmentStatus, ["CONFIRMED", "PACKED", "BOOKED", "IN_TRANSIT"])))
        .all()
    : [];
  const s = getCheckoutSettings(db);
  const hub = db.select({ city: deliveryZones.city }).from(deliveryZones).where(eq(deliveryZones.isHub, true)).get();
  const labels = ids.flatMap((id) => {
    const o = rows.find((r) => r.id === id);
    if (!o) return [];
    const ship = activeShipment(db, o.id);
    const a = o.shippingAddress;
    const items = db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).all();
    const cod = ship ? ship.codAmountPaisa : o.paymentMethod === "COD" ? o.totalPaisa : 0;
    return [
      {
        orderId: o.id,
        code: o.code,
        placedAt: o.placedAt,
        name: o.guestName ?? a?.name ?? "",
        phone: o.guestPhone ? formatPkMobile(o.guestPhone) : "",
        address: a ? [a.line1, a.line2, a.area].filter((x): x is string => Boolean(x)) : [],
        city: [a?.city, a?.postalCode].filter(Boolean).join(" "),
        courier: ship ? (COURIER_LABEL[ship.courier] ?? ship.courier) : null,
        cn: ship?.cnNumber ?? null,
        codPaisa: cod,
        paid: o.paymentMethod !== "COD",
        pieces: ship?.pieces ?? 1,
        weightGrams: ship?.weightGrams ?? null,
        notes: o.notes,
        items: items.map((i) => ({
          qty: i.quantity,
          name: `${i.productSnapshot.brand} ${i.productSnapshot.model}`,
          detail: `${i.productSnapshot.qualityGrade} · ${i.productSnapshot.color}${i.productSnapshot.variantLabel ? ` (${i.productSnapshot.variantLabel})` : ""}`,
          sku: i.productSnapshot.sku,
        })),
      },
    ];
  });
  return { labels, sender: { name: s.storeName, phone: s.storePhone ? formatPkMobile(s.storePhone) : null, city: hub?.city ?? null } };
}
