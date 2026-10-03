import { db } from "@/db/client";
import { loadCustomerOrder } from "@/server/orders/order-details";
import { buildOrderPdf } from "@/server/orders/order-pdf";
import { cleanOrderCode, orderIdFromCookie } from "@/server/orders/order-cookie";

/** Order details as a PDF (v1.11 §23). Only for a browser holding the order's private cookie. */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = cleanOrderCode((await params).code);
  const orderId = code ? await orderIdFromCookie(code) : null;
  const order = orderId ? loadCustomerOrder(db, orderId) : null;
  if (!order) {
    return new Response("Open your order page first (with the link from your email, or your order number and phone).", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  const bytes = await buildOrderPdf(order);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Caidea-${order.code}.pdf"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
