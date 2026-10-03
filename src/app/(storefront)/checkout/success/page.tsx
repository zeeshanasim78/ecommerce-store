import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/card";
import { OrderSummary } from "@/components/store/order-summary";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { formatMoney, paisa } from "@/lib/money";
import { loadCustomerOrder } from "@/server/orders/order-details";
import { cleanOrderCode, orderIdFromCookie } from "@/server/orders/order-cookie";
import { METHOD_LABEL, type CheckoutMethod } from "@/server/settings/store-settings";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

/**
 * Order confirmation (v1.11 §23). The browser that placed the order holds its private cookie, so it
 * sees the full order details, how to pay, and the PDF download. Anyone else with only the order
 * number sees the number and total — no name, phone or address (Q39).
 */
export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const code = cleanOrderCode((await searchParams).order ?? "");
  if (!code) notFound();
  const orderId = await orderIdFromCookie(code);
  const full = orderId ? loadCustomerOrder(db, orderId) : null;

  if (full) {
    return (
      <Container className="py-14">
        <p className="text-sm font-semibold tracking-wide text-terracotta uppercase">Order placed</p>
        <h1 className="mt-2 text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Thank you, {full.name.split(" ")[0]}!</h1>
        <p className="mt-4 max-w-3xl text-lg text-midnight/80">
          Your order number is <b className="tabular">{full.code}</b>.{" "}
          {full.email ? (
            <>
              We’ve emailed the details to <b className="break-all">{full.email}</b> (check the spam folder if you don’t see it).
            </>
          ) : null}
        </p>
        <OrderSummary o={full} />
        <div className="mt-8">
          <Link href="/store" className={buttonClasses("ghost")}>
            Keep shopping
          </Link>
        </div>
      </Container>
    );
  }

  const order = db
    .select({
      code: orders.code,
      total: orders.totalPaisa,
      method: orders.paymentMethod,
    })
    .from(orders)
    .where(and(eq(orders.code, code), eq(orders.channel, "ONLINE")))
    .get();
  if (!order) notFound();
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-sm font-semibold tracking-wide text-terracotta uppercase">Order</p>
      <h1 className="mt-2 text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Order {order.code}</h1>
      <p className="mt-4 text-lg text-midnight/80">
        Total <b className="tabular">{formatMoney(paisa(order.total))}</b> · {METHOD_LABEL[order.method as CheckoutMethod] ?? order.method}. To see the details, open your order with the phone number you ordered with.
      </p>
      <ButtonLink href={`/order/${order.code}`} className="mt-8">
        Open my order
      </ButtonLink>
    </Container>
  );
}
