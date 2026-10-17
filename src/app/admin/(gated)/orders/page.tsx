import Link from "next/link";
import { SelectAll } from "@/components/admin/select-all";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { cn } from "@/lib/cn";
import { FULFILLMENT_LABEL, PAYMENT_LABEL } from "@/lib/order-labels";
import { formatMoney, paisa } from "@/lib/money";
import { formatPkMobile } from "@/lib/phone";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { eq } from "drizzle-orm";
import { settings } from "@/db/schema";
import { API_COURIERS } from "@/db/schema/logistics";
import { readCourierConfig } from "@/server/couriers";
import { ORDER_FILTERS, listOrders, orderCounts, type OrderFilter } from "@/server/orders/admin-orders";
import { DEFAULT_WEIGHT_GRAMS } from "@/server/orders/fulfilment";
import { COURIER_LABEL } from "@/server/orders/order-details";
import { bulkAction } from "./actions";
import { METHOD_LABEL, type CheckoutMethod } from "@/server/settings/store-settings";

export const metadata = { title: "Online orders" };
export const dynamic = "force-dynamic";

/** Online orders (M10 Phase A v1.11 §23; Phase B v1.15 §27: pack, book, track, deliver, returns). OWNER and MANAGER. */
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
  const couriers = API_COURIERS.map((c) => readCourierConfig(c));
  const lastSync = db.select().from(settings).where(eq(settings.key, "tracking_sync_last")).get()?.value as { at?: string; checked?: number; updated?: number } | undefined;
  const bulk = filter !== "cancelled" && filter !== "payment" && filter !== "returned";

  return (
    <>
      <AdminHeader
        title="Online orders"
        description="Check payments, pack, book the courier, track and close website orders. Every action is recorded in the audit log."
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/orders/remittance" variant="outline" size="sm">
              COD remittance
            </ButtonLink>
            <ButtonLink href="/admin/orders/load-sheets" variant="outline" size="sm">
              Load sheets
            </ButtonLink>
            <ButtonLink href="/admin/orders/couriers" variant="outline" size="sm">
              Couriers
            </ButtonLink>
          </div>
        }
      />
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
        <form action={bulkAction}>
          <input type="hidden" name="f" value={filter} />
          {bulk ? (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-bezel bg-white px-5 py-4 ring-1 ring-midnight/8">
              <span className="w-full text-sm font-semibold text-midnight/70">With the ticked orders:</span>
              {filter === "pack" || filter === "action" || filter === "all" ? (
                <Button type="submit" name="op" value="pack" size="sm">
                  Mark packed + print labels
                </Button>
              ) : null}
              {filter === "book" ? (
                <>
                  {couriers.map((c) => (
                    <Button key={c.courier} type="submit" name="op" value={`book_${c.courier}`} size="sm" disabled={!c.configured} title={c.configured ? undefined : `${c.label} isn’t connected — add its API keys to the environment file`}>
                      Book with {c.label.replace(" Courier", "")}
                      {c.configured && c.mode !== "live" ? ` (${c.mode})` : ""}
                    </Button>
                  ))}
                  <label className="flex items-center gap-2 text-sm">
                    Weight each
                    <Input name="weight" type="number" min={50} max={30000} step={50} defaultValue={DEFAULT_WEIGHT_GRAMS} className="tabular h-9 w-24" aria-label="Weight in grams" /> g
                  </label>
                </>
              ) : null}
              {filter === "courier" ? (
                <>
                  <Button type="submit" name="op" value="loadsheet" size="sm">
                    Make load sheet
                  </Button>
                  <Button type="submit" name="op" value="track" variant="outline" size="sm">
                    Refresh tracking
                  </Button>
                </>
              ) : null}
              <Button type="submit" name="op" value="labels" variant="outline" size="sm">
                Print labels
              </Button>
              <Button type="submit" name="op" value="slips" variant="outline" size="sm">
                Print packing slips
              </Button>
              {filter === "courier" && lastSync?.at ? <span className="ml-auto text-sm text-midnight/60">Tracking last checked {formatKarachi(lastSync.at)}</span> : null}
            </div>
          ) : null}
          <Table>
            <THead>
              <tr>
                {bulk ? (
                  <TH className="w-10">
                    <SelectAll name="ids" />
                  </TH>
                ) : null}
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
                  {bulk ? (
                    <TD>
                      <input type="checkbox" name="ids" value={r.id} aria-label={`Tick ${r.code}`} className="size-5 accent-midnight" />
                    </TD>
                  ) : null}
                  <TD>
                    <Link href={`/admin/orders/${r.id}`} className="font-semibold tabular underline-offset-4 hover:underline">
                      {r.code}
                    </Link>
                    <span className="block text-sm text-midnight/60">{formatKarachi(r.placedAt)}</span>
                  </TD>
                  <TD>
                    {r.name}
                    <span className="block text-sm text-midnight/60 tabular">
                      {r.phone ? formatPkMobile(r.phone) : ""}
                      {r.city ? ` · ${r.city}` : ""}
                    </span>
                  </TD>
                  <TD>
                    {METHOD_LABEL[r.method as CheckoutMethod] ?? r.method}
                    <span className={cn("block text-sm", r.paymentStatus === "PENDING_VERIFICATION" ? "font-semibold text-terracotta" : "text-midnight/60")}>
                      {r.paymentStatus === "PENDING_VERIFICATION" ? "Proof received — check it" : r.paymentStatus === "COD_COLLECTED" ? "Courier owes the cash" : r.paymentStatus === "COD_REMITTED" ? "Cash received from courier" : (PAYMENT_LABEL[r.paymentStatus] ?? r.paymentStatus)}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={r.fulfillmentStatus === "CANCELLED" || r.shipmentStatus === "RETURN_IN_PROGRESS" ? "out" : "neutral"}>{r.shipmentStatus === "RETURN_IN_PROGRESS" ? "Coming back" : (FULFILLMENT_LABEL[r.fulfillmentStatus] ?? r.fulfillmentStatus)}</Badge>
                    {r.cn ? (
                      <span className="mt-1 block text-sm text-midnight/60 tabular">
                        {COURIER_LABEL[r.courier ?? ""] ?? r.courier} {r.cn}
                      </span>
                    ) : null}
                    {r.tracking && ["BOOKED", "IN_TRANSIT"].includes(r.fulfillmentStatus) ? <span className="block text-sm text-midnight/55">“{r.tracking}”</span> : null}
                  </TD>
                  <TD className="text-right font-semibold tabular">{formatMoney(paisa(r.total))}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </form>
      )}
    </>
  );
}
