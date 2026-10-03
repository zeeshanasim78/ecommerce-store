import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { AdminHeader, Notice, Section, Textarea } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { adminAuditLog, user } from "@/db/schema";
import { COURIERS } from "@/db/schema/logistics";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { orderEmailLog } from "@/server/notify/order-emails";
import { COURIER_LABEL, loadCustomerOrder, orderPayment } from "@/server/orders/order-details";
import { MANUAL_METHODS } from "@/server/settings/store-settings";
import { cancelAction, confirmPaymentAction, dispatchAction, proofReceivedAction, resendEmailAction } from "../actions";

export const metadata = { title: "Online order" };
export const dynamic = "force-dynamic";

const rs = (n: number) => formatMoney(paisa(n));
const ACTION_LABEL: Record<string, string> = {
  "order.proof_received": "Payment proof received",
  "order.payment_confirmed": "Payment confirmed",
  "order.dispatched": "Dispatched",
  "order.cancelled": "Cancelled",
};
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

  const manual = MANUAL_METHODS.includes(o.method);
  const canProof = manual && o.paymentStatus === "UNPAID" && !o.cancelled;
  const canConfirm = manual && (o.paymentStatus === "UNPAID" || o.paymentStatus === "PENDING_VERIFICATION") && !o.cancelled;
  const canDispatch = ["CONFIRMED", "PACKED"].includes(o.fulfillmentStatus) && (o.method === "COD" || o.paymentStatus === "PAID");
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
        <div className="flex flex-col gap-8">
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

          {canDispatch ? (
            <Section title="Dispatch" description="After handing the parcel to the courier. The customer gets an email with the courier and tracking number.">
              <form action={dispatchAction} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="orderId" value={o.id} />
                <Field id="courier" label="Courier">
                  <Select id="courier" name="courier" defaultValue="LEOPARDS">
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
                  <Button type="submit">Mark dispatched and email the customer</Button>
                </div>
              </form>
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
