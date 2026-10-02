import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { getDeliveryCities } from "@/server/storefront/queries";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

export default function CartPage() {
  const phone = db.select({ value: settings.value }).from(settings).where(eq(settings.key, "store_phone")).get()?.value;
  const fees = getDeliveryCities().map((c) => c.shippingFeePaisa);
  return (
    <Container className="py-12 md:py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Your cart</h1>
      <CartView storePhone={typeof phone === "string" && !/^\+?9?2?0+$/.test(phone) ? phone : null} minDeliveryPaisa={fees.length ? Math.min(...fees) : null} />
    </Container>
  );
}
