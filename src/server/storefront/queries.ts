import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deliveryZones } from "@/db/schema";
import type { Paisa } from "@/lib/money";

/** Delivery cities for the landing map and (later) checkout. Catalogue reads live in catalog.ts. */

export type DeliveryCity = {
  city: string;
  province: string;
  shippingFeePaisa: Paisa;
  etaMinDays: number;
  etaMaxDays: number;
  codAvailable: boolean;
  mapX: number;
  mapY: number;
  isHub: boolean;
};

export function getDeliveryCities(): DeliveryCity[] {
  return db
    .select({
      city: deliveryZones.city,
      province: deliveryZones.province,
      shippingFeePaisa: deliveryZones.shippingFeePaisa,
      etaMinDays: deliveryZones.etaMinDays,
      etaMaxDays: deliveryZones.etaMaxDays,
      codAvailable: deliveryZones.codAvailable,
      mapX: deliveryZones.mapX,
      mapY: deliveryZones.mapY,
      isHub: deliveryZones.isHub,
    })
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(asc(deliveryZones.sortOrder))
    .all()
    .map((z) => ({ ...z, shippingFeePaisa: z.shippingFeePaisa as Paisa }));
}
