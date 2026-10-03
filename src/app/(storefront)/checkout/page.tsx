import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { formatPkMobile } from "@/lib/phone";
import { deliveryZones } from "@/db/schema";
import { availableMethods, getCheckoutSettings, METHOD_LABEL, payToLines } from "@/server/settings/store-settings";
import { CheckoutForm, type CheckoutCity, type CheckoutMethodView } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic"; // a fresh idempotency key on every visit (spec §6.3 step 2)

export default function CheckoutPage() {
  const s = getCheckoutSettings(db);
  const cities: CheckoutCity[] = db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.city))
    .all()
    .map((z) => ({ id: z.id, city: z.city, province: z.province, feePaisa: z.shippingFeePaisa, codFeePaisa: z.codFeePaisa, cod: z.codAvailable, etaMin: z.etaMinDays, etaMax: z.etaMaxDays }));

  const methods: CheckoutMethodView[] = availableMethods(s).map((m) => ({ id: m, label: METHOD_LABEL[m], payTo: payToLines(s, m) }));

  return (
    <Container className="py-12 md:py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Checkout</h1>
      <CheckoutForm
        idempotencyKey={crypto.randomUUID()}
        cities={cities}
        methods={methods}
        codMaxPaisa={s.codMaxPaisa}
        waitHours={Math.round(s.manualTtlMinutes / 60)}
        storePhone={s.storePhone ? formatPkMobile(s.storePhone) : null}
        whatsapp={s.whatsapp ? formatPkMobile(s.whatsapp) : null}
        salesEmail={s.salesEmail}
        codPaused={s.codPaused}
        codPauseMessage={s.codPauseMessage}
        prepaidFreeDelivery={s.prepaidFreeDelivery}
      />
    </Container>
  );
}
