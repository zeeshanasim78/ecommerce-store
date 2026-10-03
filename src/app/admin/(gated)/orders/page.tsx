import Link from "next/link";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { cn } from "@/lib/cn";
import { FULFILLMENT_LABEL, PAYMENT_LABEL } from "@/lib/order-labels";
import { formatMoney, paisa } from "@/lib/money";
import { formatPkMobile } from "@/lib/phone";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { ORDER_FILTERS, listOrders, orderCounts, type OrderFilter } from "@/server/orders/admin-orders";
import { METHOD_LABEL, type CheckoutMethod } from "@/server/settings/store-settings";

export const metadata = { title: "Online orders" };
export const dynamic = "force-dynamic";

/** Online orders (M10 Phase A, v1.11 §23). OWNER and MANAGER. */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    f?: string;
    q?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  await requireStaff("orders");
  const sp = await searchParams;
  const filter: OrderFilter = sp.f && sp.f in ORDER_FILTERS ? (sp.f as OrderFilter) : "action";
  const q = (sp.q ?? "").slice(0, 40);
  const rows = listOrders(db, { filter, q });
  const counts = orderCounts(db);

  return (
    <>
      <AdminHeader title="Online orders" description="Check payments, dispatch and cancel website orders. Every action is recorded in the audit log, and the customer is emailed." />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <nav aria-label="Order filters" className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(ORDER_FILTERS) as OrderFilter[]).map((f) => (
          <Link
            key={f}
            href={`/admin/orders?f=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={f === filter ? "page" : undefined}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold ring-1", f === filter ? "bg-midnight text-canvas ring-midnight" : "bg-white ring-midnight/15 hover:ring-midnight/40")}
          >
            {ORDER_FILTERS[f]} <span className="tabular opacity-70">{counts[f]}</span>
          </Link>
        ))}
      </nav>
      <form className="mb-6 flex max-w-lg gap-3">
        <input type="hidden" name="f" value={filter} />
        <Input name="q" defaultValue={q} placeholder="Order number, phone or name" aria-label="Search orders" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-midnight/70">No orders here.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>Payment</TH>
              <TH>Status</TH>
              <TH className="text-right">Total</TH>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>
                  <Link href={`/admin/orders/${r.id}`} className="font-semibold tabular underline-offset-4 hover:underline">
                    {r.code}
                  </Link>
                  <span className="block text-sm text-midnight/60">{formatKarachi(r.placedAt)}</span>
                </TD>
                <TD>
                  {r.name}
                  <span className="block text-sm text-midnight/60 tabular">{r.phone ? formatPkMobile(r.phone) : ""}</span>
                </TD>
                <TD>
                  {METHOD_LABEL[r.method as CheckoutMethod] ?? r.method}
                  <span className={cn("block text-sm", r.paymentStatus === "PENDING_VERIFICATION" ? "font-semibold text-terracotta" : "text-midnight/60")}>
                    {r.paymentStatus === "PENDING_VERIFICATION" ? "Proof received — check it" : (PAYMENT_LABEL[r.paymentStatus] ?? r.paymentStatus)}
                  </span>
                </TD>
                <TD>
                  <Badge tone={r.fulfillmentStatus === "CANCELLED" ? "out" : "neutral"}>{FULFILLMENT_LABEL[r.fulfillmentStatus] ?? r.fulfillmentStatus}</Badge>
                </TD>
                <TD className="text-right font-semibold tabular">{formatMoney(paisa(r.total))}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
