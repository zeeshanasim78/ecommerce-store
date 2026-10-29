import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { AutoRefresh } from "@/components/store/auto-refresh";
import { Button, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { formatMoney, paisa } from "@/lib/money";
import { sendOrderEmail } from "@/server/notify/order-emails";
import { cleanOrderCode, orderIdFromCookie } from "@/server/orders/order-cookie";
import { liveGatewayDeps } from "@/server/payments";
import { reconcilePayment } from "@/server/payments/online";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { payOnlineAction } from "../../order/actions";

export const metadata: Metadata = { title: "Your payment", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/**
 * Where the payment gateway sends the customer's browser back to (v1.19, M14, SPECIFICATION §31).
 * This page only SHOWS the result. It never marks anything paid from the address it was opened with:
 * if the order is still unpaid it asks the gateway directly (server to server) and reports what the
 * order says afterwards. Only the browser that placed the order (its private cookie) can trigger that check.
 */
export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ order?: string; cancelled?: string }> }) {
  const sp = await searchParams;
  const code = cleanOrderCode(sp.order ?? "");
  if (!code) notFound();
  const orderId = await orderIdFromCookie(code);

  if (!orderId) {
    return (
      <Container className="max-w-3xl py-14">
        <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Thank you</h1>
        <p className="mt-4 text-lg text-midnight/80">If you paid, the payment company confirms it to us directly — we’ll email you as soon as it arrives. To see your order, open it with the order number and the phone number you ordered with.</p>
        <Link href={`/order/${code}`} className={buttonClasses("primary", "md", "mt-8")}>
          Open my order
        </Link>
      </Container>
    );
  }

  let order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) notFound();
  const pay = db.select().from(payments).where(and(eq(payments.orderId, orderId), eq(payments.provider, "AGGREGATOR"))).get();
  if (order.paymentStatus === "UNPAID" && order.fulfillmentStatus !== "CANCELLED" && pay?.providerRef) {
    const ip = clientIp(await headers());
    if (rateLimit(`return:${ip}`, 40, 60_000).ok) {
      const r = await reconcilePayment(db, liveGatewayDeps(), pay.id, new Date(), { minAgeSeconds: 3 });
      if (r.kind === "CHECKED" && r.outcome.kind === "PAID") after(() => void sendOrderEmail(db, { orderId, kind: "PAYMENT_CONFIRMED" }));
      order = db.select().from(orders).where(eq(orders.id, orderId)).get() ?? order;
    }
  }
  const pay2 = db.select().from(payments).where(and(eq(payments.orderId, orderId), eq(payments.provider, "AGGREGATOR"))).get();
  const paid = order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED" || order.paymentStatus === "PARTIALLY_REFUNDED";
  const cancelled = order.fulfillmentStatus === "CANCELLED";
  const failed = pay2?.status === "FAILED" && !paid && !cancelled;
  const cameBack = sp.cancelled === "1";
  const waiting = !paid && !cancelled && !failed && !cameBack;
  const total = formatMoney(paisa(order.totalPaisa));

  return (
    <Container className="max-w-3xl py-14">
      {waiting ? <AutoRefresh /> : null}
      <p className="text-sm font-semibold tracking-wide text-terracotta uppercase">Order {order.code}</p>
      <h1 className="mt-2 text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">
        {paid ? "Payment received" : cancelled ? "Order cancelled" : failed ? "Payment didn’t go through" : cameBack ? "Payment not finished" : "Confirming your payment…"}
      </h1>
      <p role="status" className="mt-4 text-lg text-midnight/80">
        {paid
          ? `Thank you! We have your payment of ${total}. We’ve emailed you a confirmation and will start packing your order.`
          : cancelled
            ? "This order was cancelled because the payment wasn’t completed in time. If you were charged, we’ll refund it — please call us with your order number."
            : failed
              ? "The payment company told us the payment wasn’t completed, and no money was taken for this order. You can try again."
              : cameBack
                ? `You left the payment page before paying. Your order is saved for a short while — you can finish paying ${total} now.`
                : "The payment company is confirming your payment with us. This page updates by itself — please don’t close it. If you already paid, you’ll get an email as soon as it’s confirmed."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {!paid && !cancelled && (failed || cameBack) ? (
          <form action={payOnlineAction}>
            <input type="hidden" name="code" value={order.code} />
            <Button type="submit" size="lg">
              Pay online now · {total}
            </Button>
          </form>
        ) : null}
        <Link href={`/order/${order.code}`} className={buttonClasses(paid ? "primary" : "outline", "lg")}>
          View my order
        </Link>
      </div>
    </Container>
  );
}
