import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deliveryZones } from "@/db/schema";
import { formatMoney, paisa } from "@/lib/money";
import { getCheckoutSettings } from "@/server/settings/store-settings";

/** Facts the policy, FAQ, About and Contact pages quote, read live so the pages never disagree with checkout. */
export type ShopFacts = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  whatsappUrl: string | null;
  salesEmail: string | null;
  codLimit: string;
  freeDeliveryWhenPrepaid: boolean;
  codPaused: boolean;
  etaMin: number | null;
  etaMax: number | null;
  cities: number;
};

export function getShopFacts(): ShopFacts {
  const s = getCheckoutSettings(db);
  const zones = db.select({ min: deliveryZones.etaMinDays, max: deliveryZones.etaMaxDays }).from(deliveryZones).where(eq(deliveryZones.isActive, true)).orderBy(asc(deliveryZones.sortOrder)).all();
  return {
    name: s.storeName,
    phone: s.storePhone,
    whatsapp: s.whatsapp,
    whatsappUrl: s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, "").replace(/^0/, "92")}` : null,
    salesEmail: s.salesEmail,
    codLimit: formatMoney(paisa(s.codMaxPaisa)),
    freeDeliveryWhenPrepaid: s.prepaidFreeDelivery,
    codPaused: s.codPaused,
    etaMin: zones.length ? Math.min(...zones.map((z) => z.min)) : null,
    etaMax: zones.length ? Math.max(...zones.map((z) => z.max)) : null,
    cities: zones.length,
  };
}

/** "2–4 working days" (or a general phrase when no delivery city is set up). */
export const etaText = (f: ShopFacts) => (f.etaMin !== null && f.etaMax !== null ? `${f.etaMin}–${f.etaMax} working days after dispatch` : "a few working days after dispatch");
