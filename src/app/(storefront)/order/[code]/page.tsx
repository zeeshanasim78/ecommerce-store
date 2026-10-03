import type { Metadata } from "next";
import { Container } from "@/components/ui/card";
import { OrderSummary } from "@/components/store/order-summary";
import { db } from "@/db/client";
import { loadCustomerOrder } from "@/server/orders/order-details";
import { cleanOrderCode, orderIdFromCookie } from "@/server/orders/order-cookie";
import { TrackOrder } from "../track-order";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * The order number is in the address. Full details (and the PDF) only for a browser holding the
 * order's private cookie (set at checkout, by the email link, or after the phone check) — v1.11 §23.
 */
export default async function OrderPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ link?: string }> }) {
  const { code } = await params;
  const clean =
    cleanOrderCode(code) ??
    decodeURIComponent(code)
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 40);
  const orderId = cleanOrderCode(code) ? await orderIdFromCookie(clean) : null;
  const order = orderId ? loadCustomerOrder(db, orderId) : null;
  const expired = (await searchParams).link === "expired";

  return (
    <Container className="py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Order {clean}</h1>
      {order ? (
        <OrderSummary o={order} />
      ) : (
        <>
          <p className="mt-3 max-w-2xl text-lg text-midnight/75">{expired ? "That link has expired or isn’t valid any more. " : ""}To keep your details private, enter the phone number you ordered with.</p>
          <TrackOrder initialCode={clean} />
        </>
      )}
    </Container>
  );
}
