import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { AdminHeader, Notice, Section, Textarea } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { adminAuditLog, codRemittances, deliveryZones, orderItems, orders, user } from "@/db/schema";
import { API_COURIERS, COURIERS } from "@/db/schema/logistics";
import { buttonClasses } from "@/components/ui/button";
import { readCourierConfig } from "@/server/couriers";
import { DEFAULT_WEIGHT_GRAMS, activeShipment } from "@/server/orders/fulfilment";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { orderEmailLog } from "@/server/notify/order-emails";
import { COURIER_LABEL, loadCustomerOrder, orderPayment } from "@/server/orders/order-details";
import { REASON_LABEL, STATUS_LABEL as RETURN_STATUS_LABEL, returnsForOrder } from "@/server/returns/returns";
import { MANUAL_METHODS } from "@/server/settings/store-settings";
import { bookAction, cancelAction, cancelBookingAction, confirmPaymentAction, deliveredAction, dispatchAction, inTransitAction, packAction, proofReceivedAction, receiveReturnAction, refreshTrackingAction, resendEmailAction } from "../actions";

export const metadata = { title: "Online order" };
export const dynamic = "force-dynamic";

const rs = (n: number) => formatMoney(paisa(n));
const ACTION_LABEL: Record<string, string> = {
  "order.proof_received": "Payment proof received",
  "order.payment_confirmed": "Payment confirmed",
  "order.dispatched": "Dispatched",
  "order.cancelled": "Cancelled",
  // v1.15 (M10 Phase B)
  "order.packed": "Packed",
  "order.booked": "Booked with the courier",
  "order.booking_failed": "Courier booking failed",
  "order.booking_cancelled": "Courier booking cancelled",
  "order.in_transit": "On the way",
  "order.delivered": "Delivered",
  "order.returned_to_origin": "Parcel returned to the shop",
  "order.cod_remitted": "COD paid to the shop by the courier",
};
const SHIPMENT_LABEL: Record<string, string> = {
  BOOKED: "Booked — waiting for pickup",
  PICKED_UP: "Picked up by the courier",
  IN_TRANSIT: "On the way",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  RETURN_IN_PROGRESS: "Coming back to the shop",
  RETURNED_TO_ORIGIN: "Returned to the shop",
};
/** Short note from the audit "after" JSON, for the history list. */
function historyNote(after: unknown): string | null {
  if (!after || typeof after !== "object") return null;
  const a = after as Record<string, unknown>;
  if (typeof a.cn === "string") return `${COURIER_LABEL[String(a.courier)] ?? a.courier ?? ""} ${a.cn}`.trim();
  if (typeof a.error === "string") return a.error;
  if (typeof a.courierSays === "string") return `Courier: ${a.courierSays}`;
  if (typeof a.remittance === "string") return `${a.remittance}${typeof a.acceptedBecause === "string" ? ` — ${a.acceptedBecause}` : ""}`;
  if (typeof a.restocked === "number") return `${a.restocked} back on sale${a.keptOff ? `, ${a.keptOff} kept off` : ""}${typeof a.note === "string" ? ` — ${a.note}` : ""}`;
  if (typeof a.reason === "string") return a.reason;
  return null;
}
const EMAIL_LABEL: Record<string, string> = {
  ORDER_PLACED: "Order details",
  SALES_COPY: "Sales copy",
  PAYMENT_CONFIRMED: "Payment confirmed",
  DISPATCHED: "Dispatched",
  CANCELLED: "Cancelled",
};

export default async function OrderAdminPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("orders");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const o = loadCustomerOrder(db, id);
  if (!o) notFound();
  const pay = orderPayment(db, id);
  const emails = orderEmailLog(db, id);
  const orderReturns = returnsForOrder(db, id);
  const history = db
    .select({
      action: adminAuditLog.action,
      at: adminAuditLog.createdAt,
      after: adminAuditLog.after,
      who: user.name,
    })
    .from(adminAuditLog)
    .leftJoin(user, eq(user.id, adminAuditLog.actorId))
    .where(and(eq(adminAuditLog.entity, "orders"), eq(adminAuditLog.entityId, id)))
    .orderBy(desc(adminAuditLog.createdAt), desc(sql`${adminAuditLog}.rowid`))
    .all();

  // v1.15 (M10 Phase B): packing, courier, delivery, returns
  const row = db.select().from(orders).where(eq(orders.id, id)).get()!;
  const ship = activeShipment(db, id);
  const zone = row.cityId ? db.select().from(deliveryZones).where(eq(deliveryZones.id, row.cityId)).get() : undefined;
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();
  const configs = API_COURIERS.map((c) => readCourierConfig(c));
  const connected = configs.filter((c) => c.configured);
  const defaultCourier = connected.find((c) => c.courier === zone?.defaultCourier)?.courier ?? connected[0]?.courier;
  const remittance = ship?.remittanceId ? db.select({ code: codRemittances.code, id: codRemittances.id }).from(codRemittances).where(eq(codRemittances.id, ship.remittanceId)).get() : undefined;
  const payable = o.method === "COD" || o.paymentStatus === "PAID";
  const canPack = o.fulfillmentStatus === "CONFIRMED" && payable;
  const canBook = o.fulfillmentStatus === "PACKED" && payable;
  const withCourier = o.fulfillmentStatus === "BOOKED" || o.fulfillmentStatus === "IN_TRANSIT";
  const apiShipment = ship && (API_COURIERS as readonly string[]).includes(ship.courier);
  const labelsHref = `/admin/orders/labels?ids=${id}`;

  const manual = MANUAL_METHODS.includes(o.method);
  const canProof = manual && o.paymentStatus === "UNPAID" && !o.cancelled;
  const canConfirm = manual && (o.paymentStatus === "UNPAID" || o.paymentStatus === "PENDING_VERIFICATION") && !o.cancelled;
  const canCancel = ["NEW", "CONFIRMED", "PACKED"].includes(o.fulfillmentStatus);
  const paid = o.paymentStatus === "PAID";

  return (
    <>
      <AdminHeader
        title={`Order ${o.code}`}
        description={`Placed ${formatKarachi(o.placedAt)} · ${o.methodLabel} · ${rs(o.totalPaisa)}`}
        actions={
          <ButtonLink href="/admin/orders" variant="outline">
            All orders
          </ButtonLink>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <div className="grid items-start gap-8 xl:grid-cols-[1fr_26rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Section title="Status">
            <div className="flex flex-wrap gap-2">
              <Badge tone={o.cancelled ? "out" : "stock"}>{o.statusLabel}</Badge>
              <Badge>{o.paymentStatus === "PENDING_VERIFICATION" ? "Proof received — check the money" : o.paymentLabel}</Badge>
            </div>
            {o.payDeadline ? <p className="text-[0.9375rem]">Cancelled automatically if not paid by {formatKarachi(o.payDeadline)} — record the proof to stop that.</p> : null}
            {o.cancelled ? <p className="text-[0.9375rem]">Cancelled: {o.cancelReason}</p> : null}
            {o.shipment ? (
              <p className="text-[0.9375rem]">
                {o.shipment.courier}
                {o.shipment.cn ? ` · CN ${o.shipment.cn}` : ""} · {formatKarachi(o.shipment.bookedAt)}
                {ship ? ` · ${SHIPMENT_LABEL[ship.status] ?? ship.status}` : ""}
              </p>
            ) : null}
            {pay ? (
              <dl className="grid gap-x-6 gap-y-1 text-[0.9375rem] sm:grid-cols-[10rem_1fr]">
                <dt className="text-midnight/65">Payment record</dt>
                <dd>
                  {pay.provider} · {pay.status} · {rs(pay.amountPaisa)}
                </dd>
                {pay.manualReference ? (
                  <>
                    <dt className="text-midnight/65">Transaction ID</dt>
                    <dd className="tabular">{pay.manualReference}</dd>
                  </>
                ) : null}
                {pay.payerMsisdn ? (
                  <>
                    <dt className="text-midnight/65">Paid from</dt>
                    <dd className="tabular">{pay.payerMsisdn}</dd>
                  </>
                ) : null}
                {pay.verifiedAt ? (
                  <>
                    <dt className="text-midnight/65">Confirmed</dt>
                    <dd>{formatKarachi(pay.verifiedAt)}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
          </Section>

          {canProof || canConfirm ? (
            <Section title="Payment" description="The customer pays into the shop’s account with the order number in the remarks and sends a screenshot by WhatsApp, a call or email.">
              {canProof ? (
                <form action={proofReceivedAction} className="grid gap-4 rounded-bezel-sm bg-surface p-5 sm:grid-cols-2">
                  <input type="hidden" name="orderId" value={o.id} />
                  <p className="font-semibold sm:col-span-2">1. Screenshot received (stops the {o.waitHours}-hour cancellation)</p>
                  <Field id="via" label="Received by">
                    <Select id="via" name="via" defaultValue="WHATSAPP">
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="CALL">Phone call</option>
                      <option value="EMAIL">Email</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </Field>
                  <Field id="ref1" label="Transaction ID / reference (optional)">
                    <Input id="ref1" name="reference" maxLength={30} className="tabular uppercase" autoComplete="off" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="outline">
                      Record payment proof
                    </Button>
                  </div>
                </form>
              ) : null}
              {canConfirm ? (
                <form action={confirmPaymentAction} className="grid gap-4 rounded-bezel-sm bg-surface p-5 sm:grid-cols-2">
                  <input type="hidden" name="orderId" value={o.id} />
                  <p className="font-semibold sm:col-span-2">2. Money is in the account — confirm and email the customer</p>
                  <Field id="ref2" label="Transaction ID / reference (optional)">
                    <Input id="ref2" name="reference" maxLength={30} defaultValue={pay?.manualReference ?? ""} className="tabular uppercase" autoComplete="off" />
                  </Field>
                  <label className="flex items-start gap-3 text-[0.9375rem] sm:col-span-2">
                    <input type="checkbox" name="checked" required className="mt-1 size-5 accent-midnight" />I checked the bank / wallet statement and {rs(o.totalPaisa)} for {o.code} has arrived.
                  </label>
                  <div className="sm:col-span-2">
                    <Button type="submit">Confirm payment</Button>
                  </div>
                </form>
              ) : null}
            </Section>
          ) : null}

          {canPack ? (
            <Section title="1. Pack" description="Pack the screen in foam, seal the box and stick the label on. Packing slips list every item to tick off.">
              <div className="flex flex-wrap gap-3">
                <form action={packAction}>
                  <input type="hidden" name="orderId" value={o.id} />
                  <Button type="submit">Mark packed</Button>
                </form>
                <a href={`${labelsHref}&what=slip`} className={buttonClasses("outline")}>
                  Print packing slip
                </a>
              </div>
            </Section>
          ) : null}

          {canBook ? (
            <Section title="2. Book the courier" description={`Packed. Book through the courier’s system, or paste the CN if you booked on its portal. The customer is emailed the courier and tracking number.${o.method === "COD" ? ` The courier collects ${rs(o.totalPaisa)}.` : " Paid in advance: the courier collects nothing."}`}>
              {connected.length ? (
                <form action={bookAction} className="grid gap-4 rounded-bezel-sm bg-surface p-5 sm:grid-cols-[1.6fr_1fr_0.7fr]">
                  <input type="hidden" name="orderId" value={o.id} />
                  <Field id="book-courier" label="Courier">
                    <Select id="book-courier" name="courier" defaultValue={defaultCourier}>
                      {configs.map((c) => (
                        <option key={c.courier} value={c.courier} disabled={!c.configured}>
                          {c.label.replace(" Courier", "")}
                          {c.configured ? (c.mode === "live" ? "" : ` (${c.mode})`) : " — not connected"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="weight" label="Weight (grams)">
                    <Input id="weight" name="weight" type="number" inputMode="numeric" min={50} max={30000} step={50} defaultValue={DEFAULT_WEIGHT_GRAMS} className="tabular" />
                  </Field>
                  <Field id="pieces" label="Pieces">
                    <Input id="pieces" name="pieces" type="number" inputMode="numeric" min={1} max={20} defaultValue={1} className="tabular" />
                  </Field>
                  <div className="sm:col-span-3">
                    <Button type="submit">Book with courier</Button>
                  </div>
                </form>
              ) : (
                <p className="text-[0.9375rem] text-midnight/75">
                  No courier is connected yet (API keys go in the environment file — see{" "}
                  <Link href="/admin/orders/couriers" className="underline">
                    Couriers
                  </Link>
                  ). Book on the courier’s portal and paste the CN below.
                </p>
              )}
              <details open={!connected.length} className="rounded-bezel-sm ring-1 ring-midnight/10">
                <summary className="cursor-pointer px-5 py-3 font-semibold">Booked on the courier’s portal or with our own rider? Enter the CN</summary>
                <div className="px-5 pb-5">
              <form action={dispatchAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="orderId" value={o.id} />
                  <Field id="courier" label="Courier">
                    <Select id="courier" name="courier" defaultValue={zone?.defaultCourier ?? "LEOPARDS"}>
                      {COURIERS.map((c) => (
                        <option key={c} value={c}>
                          {COURIER_LABEL[c] ?? c}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="cn" label="Tracking (CN) number">
                    <Input id="cn" name="cn" maxLength={30} className="tabular uppercase" autoComplete="off" />
                  </Field>
                  {o.method === "COD" ? <p className="text-sm text-midnight/70 sm:col-span-2">Cash on delivery: the courier collects {rs(o.totalPaisa)}.</p> : null}
                  <div className="sm:col-span-2">
                    <Button type="submit" variant={canBook && connected.length ? "outline" : "primary"}>
                      Mark dispatched and email the customer
                    </Button>
                  </div>
                </form>
                </div>
              </details>
              <div>
                <a href={labelsHref} className={buttonClasses("outline", "sm")}>
                  Print label + packing slip
                </a>
              </div>
            </Section>
          ) : null}

          {canPack ? (
            <details className="rounded-bezel bg-white px-6 py-4 ring-1 ring-midnight/8">
              <summary className="cursor-pointer font-semibold">Already booked and handed over? Dispatch with a CN without packing first</summary>
              <div className="pt-4">
              <form action={dispatchAction} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="orderId" value={o.id} />
                <Field id="courier" label="Courier">
                  <Select id="courier" name="courier" defaultValue={zone?.defaultCourier ?? "LEOPARDS"}>
                    {COURIERS.map((c) => (
                      <option key={c} value={c}>
                        {COURIER_LABEL[c] ?? c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="cn" label="Tracking (CN) number">
                  <Input id="cn" name="cn" maxLength={30} className="tabular uppercase" autoComplete="off" />
                </Field>
                {o.method === "COD" ? <p className="text-sm text-midnight/70 sm:col-span-2">Cash on delivery: the courier collects {rs(o.totalPaisa)}.</p> : null}
                <div className="sm:col-span-2">
                  <Button type="submit" variant={canBook && connected.length ? "outline" : "primary"}>
                    Mark dispatched and email the customer
                  </Button>
                </div>
              </form>
              </div>
            </details>
          ) : null}

          {withCourier && ship ? (
            <Section title="3. With the courier" description={o.method === "COD" ? `The courier collects ${rs(o.totalPaisa)} on delivery.` : "Paid in advance — the courier collects nothing."}>
              <dl className="grid gap-x-6 gap-y-1 text-[0.9375rem] sm:grid-cols-[10rem_1fr]">
                <dt className="text-midnight/65">Courier</dt>
                <dd>
                  {COURIER_LABEL[ship.courier] ?? ship.courier} · {ship.bookedVia === "API" ? "booked through its system" : "CN entered by hand"}
                </dd>
                <dt className="text-midnight/65">CN</dt>
                <dd className="tabular font-semibold">{ship.cnNumber ?? "—"}</dd>
                <dt className="text-midnight/65">Status</dt>
                <dd>
                  {SHIPMENT_LABEL[ship.status] ?? ship.status}
                  {ship.lastTrackingEvent ? <span className="text-midnight/65"> · courier says “{ship.lastTrackingEvent}”</span> : null}
                  {ship.trackingCheckedAt ? <span className="block text-sm text-midnight/55">checked {formatKarachi(ship.trackingCheckedAt)}</span> : null}
                </dd>
                {ship.loadsheetId ? (
                  <>
                    <dt className="text-midnight/65">Load sheet</dt>
                    <dd>
                      <Link href={`/admin/orders/load-sheets/${ship.loadsheetId}`} className="underline">
                        Open
                      </Link>
                    </dd>
                  </>
                ) : null}
              </dl>
              {ship.status === "RETURN_IN_PROGRESS" ? <Notice tone="error">The courier says this parcel is coming back. When it arrives, check it and use “Receive returned parcel”.</Notice> : null}
              <div className="flex flex-wrap gap-3">
                <a href={labelsHref} className={buttonClasses("outline", "sm")}>
                  Print label
                </a>
                {apiShipment && ship.bookedVia === "API" && (ship.labelUrl || ship.courier === "POSTEX") ? (
                  <a href={`/admin/orders/${o.id}/courier-label`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
                    Courier’s own label
                  </a>
                ) : null}
                {apiShipment ? (
                  <form action={refreshTrackingAction}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Refresh tracking
                    </Button>
                  </form>
                ) : null}
                {o.fulfillmentStatus === "BOOKED" ? (
                  <form action={inTransitAction}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Courier collected it — on the way
                    </Button>
                  </form>
                ) : null}
                <form action={deliveredAction}>
                  <input type="hidden" name="orderId" value={o.id} />
                  <Button type="submit" size="sm">
                    Mark delivered
                  </Button>
                </form>
              </div>

              {ship.status === "BOOKED" && o.fulfillmentStatus === "BOOKED" ? (
                <details>
                  <summary className="cursor-pointer font-semibold text-terracotta">Cancel this booking…</summary>
                  <form action={cancelBookingAction} className="mt-3 flex flex-col gap-3">
                    <input type="hidden" name="orderId" value={o.id} />
                    <p className="text-[0.9375rem]">
                      Only before the courier picks the parcel up. {ship.bookedVia === "API" ? "The booking is cancelled in the courier’s system too." : "This CN was entered by hand — also cancel it on the courier’s portal."} The order goes back to Packed, so you can book again or cancel the order.
                    </p>
                    <div>
                      <button type="submit" className="inline-flex h-11 items-center rounded-full bg-terracotta px-5 font-semibold text-white">
                        Cancel booking {ship.cnNumber}
                      </button>
                    </div>
                  </form>
                </details>
              ) : null}

              <details open={ship.status === "RETURN_IN_PROGRESS"}>
                <summary className="cursor-pointer font-semibold">Receive returned parcel…</summary>
                <form action={receiveReturnAction} className="mt-3 flex flex-col gap-4 rounded-bezel-sm bg-surface p-5">
                  <input type="hidden" name="orderId" value={o.id} />
                  <p className="text-[0.9375rem]">Only when the parcel is back in the shop and you have checked it. Items in good condition go back on sale; damaged ones stay off sale.</p>
                  {items.map((i) => (
                    <Field key={i.id} id={`restock_${i.id}`} label={`${i.productSnapshot.brand} ${i.productSnapshot.model} · ${i.productSnapshot.color} — back on sale (of ${i.quantity})`}>
                      <Input id={`restock_${i.id}`} name={`restock_${i.id}`} type="number" min={0} max={i.quantity} defaultValue={i.quantity} className="tabular max-w-32" />
                    </Field>
                  ))}
                  <Field id="rto-note" label="Note (required if anything stays off sale)">
                    <Textarea id="rto-note" name="note" maxLength={300} />
                  </Field>
                  {paid ? (
                    <label className="flex items-start gap-3 text-[0.9375rem] font-medium text-terracotta">
                      <input type="checkbox" name="refund" required className="mt-1 size-5 accent-midnight" />
                      This order was paid in advance — I will refund {rs(o.totalPaisa)} to the customer.
                    </label>
                  ) : null}
                  <div>
                    <Button type="submit" variant="outline">
                      Receive returned parcel
                    </Button>
                  </div>
                </form>
              </details>
            </Section>
          ) : null}

          {o.fulfillmentStatus === "DELIVERED" ? (
            <Section title="Delivered">
              <p className="text-[0.9375rem]">
                {ship?.deliveredAt ? `Delivered ${formatKarachi(ship.deliveredAt)}` : "Delivered"}
                {ship ? ` · ${COURIER_LABEL[ship.courier] ?? ship.courier}${ship.cnNumber ? ` CN ${ship.cnNumber}` : ""}` : ""}. Warranty runs from the delivery date.
              </p>
              {o.method === "COD" ? (
                <p className="text-[0.9375rem]">
                  {o.paymentStatus === "COD_REMITTED" ? (
                    <>
                      The courier paid the shop {ship?.remittedPaisa != null ? rs(ship.remittedPaisa) : ""}
                      {remittance ? (
                        <>
                          {" "}
                          (
                          <Link href={`/admin/orders/remittance/${remittance.id}`} className="underline">
                            {remittance.code}
                          </Link>
                          )
                        </>
                      ) : null}
                      .
                    </>
                  ) : (
                    <>
                      The courier collected {rs(o.totalPaisa)} and still owes it to the shop —{" "}
                      <Link href="/admin/orders/remittance" className="underline">
                        upload the COD payment report
                      </Link>{" "}
                      when it arrives.
                    </>
                  )}
                </p>
              ) : null}
            </Section>
          ) : null}

          {o.fulfillmentStatus === "RETURNED_TO_ORIGIN" ? (
            <Section title="Returned to the shop">
              <p className="text-[0.9375rem]">The courier brought this parcel back{ship?.rtoAt ? ` (received ${formatKarachi(ship.rtoAt)})` : ""}. See the history for what went back on sale.</p>
            </Section>
          ) : null}

          {canCancel ? (
            <Section title="Cancel order" description="Puts the stock back on sale and gives back any coupon use.">
              <details>
                <summary className="cursor-pointer font-semibold text-terracotta">Cancel this order…</summary>
                <form action={cancelAction} className="mt-4 flex flex-col gap-4">
                  <input type="hidden" name="orderId" value={o.id} />
                  <Field id="reason" label="Reason (the customer sees this)">
                    <Textarea id="reason" name="reason" required minLength={3} maxLength={200} />
                  </Field>
                  {paid ? (
                    <label className="flex items-start gap-3 text-[0.9375rem] font-medium text-terracotta">
                      <input type="checkbox" name="refund" required className="mt-1 size-5 accent-midnight" />
                      This order is paid — I will refund {rs(o.totalPaisa)} to the customer.
                    </label>
                  ) : null}
                  <label className="flex items-start gap-3 text-[0.9375rem]">
                    <input type="checkbox" name="notify" defaultChecked className="mt-1 size-5 accent-midnight" />
                    Email the customer
                  </label>
                  <div>
                    <button type="submit" className="inline-flex h-11 items-center rounded-full bg-terracotta px-5 font-semibold text-white">
                      Cancel order
                    </button>
                  </div>
                </form>
              </details>
            </Section>
          ) : null}

          {o.statusLabel === "Delivered" || orderReturns.length > 0 ? (
            <Section title="Returns & warranty" description="A faulty or unwanted item that reached the customer. (A parcel that came back to the shop is handled above, not here.)">
              {orderReturns.length > 0 ? (
                <ul className="flex flex-col gap-1 text-[0.9375rem]">
                  {orderReturns.map((r) => (
                    <li key={r.id}>
                      <Link href={`/admin/returns/${r.id}`} className="font-semibold underline">
                        {r.code}
                      </Link>{" "}
                      · {REASON_LABEL[r.reason]} · {RETURN_STATUS_LABEL[r.status]}
                    </li>
                  ))}
                </ul>
              ) : null}
              {o.statusLabel === "Delivered" ? (
                <div>
                  <ButtonLink href={`/admin/returns/new?order=${encodeURIComponent(o.code)}`} variant="outline" size="sm">
                    Start a return
                  </ButtonLink>
                </div>
              ) : null}
            </Section>
          ) : null}

          <Section title="History">
            {history.length === 0 ? (
              <p className="text-midnight/65">No staff actions yet.</p>
            ) : (
              <ol className="flex flex-col gap-3 text-[0.9375rem]">
                {history.map((h, i) => (
                  <li key={i} className="flex flex-wrap gap-x-3">
                    <span className="font-semibold">{ACTION_LABEL[h.action] ?? h.action}</span>
                    <span className="text-midnight/65">
                      {formatKarachi(h.at)} · {h.who ?? "system"}
                    </span>
                    {historyNote(h.after) ? <span className="w-full text-sm text-midnight/70">{historyNote(h.after)}</span> : null}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-8">
          <Section title="Customer">
            <dl className="grid gap-1 text-[0.9375rem]">
              <dt className="sr-only">Name</dt>
              <dd className="font-semibold">{o.name}</dd>
              <dt className="sr-only">Phone</dt>
              <dd className="tabular">{o.phone}</dd>
              <dt className="sr-only">Email</dt>
              <dd className="break-all">{o.email ?? "—"}</dd>
              <dt className="sr-only">Address</dt>
              <dd>{o.address}</dd>
              {o.notes ? (
                <>
                  <dt className="mt-2 text-midnight/65">Notes</dt>
                  <dd>{o.notes}</dd>
                </>
              ) : null}
            </dl>
          </Section>

          <Section title="Items">
            <ul className="flex flex-col gap-3 text-[0.9375rem]">
              {o.items.map((i) => (
                <li key={i.name + i.detail} className="flex justify-between gap-3">
                  <span>
                    {i.qty} × {i.name}
                    <span className="block text-sm text-midnight/65">{i.detail}</span>
                  </span>
                  <span className="font-semibold tabular whitespace-nowrap">{rs(i.linePaisa)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-midnight/10 pt-3 text-lg font-bold">
              <span>Total</span> <span className="tabular">{rs(o.totalPaisa)}</span>
            </p>
          </Section>

          <Section title="Emails" description="Every email about this order. Sent through the shop’s Gmail.">
            {emails.length === 0 ? (
              <p className="text-midnight/65">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {emails.map((e) => (
                  <li key={e.id}>
                    <span className="font-semibold">{EMAIL_LABEL[e.kind] ?? e.kind}</span> → <span className="break-all">{e.recipient}</span>{" "}
                    <span className={e.status === "SENT" ? "text-midnight/65" : "font-semibold text-terracotta"}>{e.status === "SENT" ? "sent" : e.status === "SKIPPED" ? "not sent" : "failed"}</span>
                    <span className="block text-midnight/55">
                      {formatKarachi(e.createdAt)}
                      {e.status !== "SENT" && e.detail ? ` · ${e.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {o.email ? (
              <form action={resendEmailAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="orderId" value={o.id} />
                <Field id="kind" label="Send again">
                  <Select id="kind" name="kind" defaultValue="ORDER_PLACED">
                    <option value="ORDER_PLACED">Order details</option>
                    {paid ? <option value="PAYMENT_CONFIRMED">Payment confirmed</option> : null}
                    {o.shipment ? <option value="DISPATCHED">Dispatched</option> : null}
                  </Select>
                </Field>
                <Button type="submit" variant="outline">
                  Send
                </Button>
              </form>
            ) : null}
          </Section>
          <p className="text-sm text-midnight/60">
            Customer view:{" "}
            <Link href={`/order/${o.code}`} className="underline">
              /order/{o.code}
            </Link>{" "}
            (needs their phone number or email link).
          </p>
        </div>
      </div>
    </>
  );
}
