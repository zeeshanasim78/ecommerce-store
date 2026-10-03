import type { Metadata } from "next";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { formatPkMobile } from "@/lib/phone";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import { getDeliveryCities } from "@/server/storefront/queries";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

export default function CartPage() {
  const phone = getCheckoutSettings(db).storePhone;
  const fees = getDeliveryCities().map((c) => c.shippingFeePaisa);
  return (
    <Container className="py-12 md:py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Your cart</h1>
      <CartView storePhone={phone ? formatPkMobile(phone) : null} minDeliveryPaisa={fees.length ? Math.min(...fees) : null} />
    </Container>
  );
}
