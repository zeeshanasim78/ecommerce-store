import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { deliveryLabel, paymentSteps, type CustomerOrder } from "@/server/orders/order-details";
import { TidForm } from "./tid-form";

const rs = (n: number) => formatMoney(paisa(n));

/**
 * Full order details for the customer (v1.11 §23): shown after checkout and on /order/CODE once
 * the browser holds the order's private cookie. Includes the PDF download and, for prepaid orders,
 * how to pay and where to send the screenshot.
 */
export function OrderSummary({ o }: { o: CustomerOrder }) {
  const wa = o.contact.whatsapp?.replace(/\D/g, "").replace(/^0/, "92");
  const waText = `Assalam o Alaikum, I have paid ${rs(o.totalPaisa)} for order ${o.code}. Payment slip attached. Transaction ID: `;
  const steps = paymentSteps(o);

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-6">
        <section className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8 sm:p-8" aria-labelledby="status-heading">
          <h2 id="status-heading" className="sr-only">
            Order status
          </h2>
          <p className="text-sm text-midnight/65">
            Order <b className="tabular">{o.code}</b> · placed {formatKarachi(o.placedAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={o.cancelled ? "out" : "stock"}>{o.statusLabel}</Badge>
            {!o.cancelled ? <Badge>{o.paymentLabel}</Badge> : null}
            <Badge tone="grade">{o.methodLabel}</Badge>
          </div>
          {o.cancelled ? (
            <p className="mt-4 text-midnight/75">
              This order was cancelled
              {o.cancelReason ? `: ${o.cancelReason}` : ""}. If you think that’s a mistake, please contact us with the order number.
            </p>
          ) : null}
          {o.shipment ? (
            <p className="mt-4 text-[0.9375rem]">
              Sent with <b>{o.shipment.courier}</b>
              {o.shipment.cn ? (
                <>
                  {" "}
                  · tracking number <b className="tabular">{o.shipment.cn}</b>
                </>
              ) : null}
              .
            </p>
          ) : null}
          {o.eta ? <p className="mt-2 text-[0.9375rem] text-midnight/75">Delivery: {o.eta}.</p> : null}
          {o.method === "COD" && !o.cancelled ? <p className="mt-4 rounded-bezel-sm bg-surface px-5 py-4">Please keep {rs(o.totalPaisa)} in cash ready for the courier. We’ll call or WhatsApp you to confirm before we send it.</p> : null}
        </section>

        {o.awaitingPayment ? (
          <section className="rounded-bezel bg-white p-6 ring-2 ring-terracotta/40 sm:p-8" aria-labelledby="pay-heading">
            <h2 id="pay-heading" className="font-sans text-xl font-semibold">
              {o.paymentStatus === "UNPAID" ? `Order placed — waiting for your payment of ${rs(o.totalPaisa)}` : "We’re checking your payment"}
            </h2>
            <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-[0.9375rem]">
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {o.payDeadline ? (
              <p className="mt-3 font-semibold">
                Please pay by <span className="tabular">{formatKarachi(o.payDeadline)}</span>.
              </p>
            ) : null}

            {o.paymentStatus === "UNPAID" ? (
              <>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Accounts you can pay into">
                  {o.payTo.map((p, i) => (
                    <li key={p.method} className={`rounded-bezel-sm px-5 py-4 ${i === 0 ? "bg-midnight text-canvas" : "bg-surface"}`}>
                      <p className="font-semibold">
                        {p.method}
                        {i === 0 ? <span className="ml-2 text-sm font-normal opacity-75">(your choice)</span> : null}
                      </p>
                      <ul className="mt-1 text-[0.9375rem] break-words tabular select-all">
                        {p.lines.map((l) => {
                          const at = l.indexOf(": ");
                          return (
                            <li key={l}>
                              {at > 0 ? l.slice(0, at + 2) : ""}
                              <span className={(at > 0 ? l.slice(at + 2) : l).length > 16 ? "break-all" : "whitespace-nowrap"}>{at > 0 ? l.slice(at + 2) : l}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-bezel-sm bg-amber/15 px-5 py-3 text-[0.9375rem] font-medium">
                  In the transfer’s remarks write: <b className="tabular select-all">{o.code}</b>
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {wa ? (
                    <a href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
                      Send payment slip on WhatsApp
                    </a>
                  ) : null}
                  {o.contact.phone ? (
                    <a href={`tel:${o.contact.phone.replace(/[^+\d]/g, "")}`} className={buttonClasses("outline")}>
                      Call {o.contact.phone}
                    </a>
                  ) : null}
                  {o.contact.email ? (
                    <a href={`mailto:${o.contact.email}?subject=${encodeURIComponent(`Payment for order ${o.code}`)}&body=${encodeURIComponent(`${waText}\n`)}`} className={buttonClasses("outline")}>
                      Email {o.contact.email}
                    </a>
                  ) : null}
                </div>
                <details className="mt-6">
                  <summary className="cursor-pointer text-[0.9375rem] font-semibold underline underline-offset-4">Or type the transaction ID here</summary>
                  <div className="mt-4">
                    <TidForm code={o.code} bank={o.method === "BANK_TRANSFER"} />
                  </div>
                </details>
              </>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8 sm:p-8" aria-labelledby="deliver-heading">
          <h2 id="deliver-heading" className="font-sans text-lg font-semibold">
            Delivery details
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-[0.9375rem] sm:grid-cols-[8rem_1fr]">
            <dt className="text-midnight/65">Name</dt>
            <dd>{o.name}</dd>
            <dt className="text-midnight/65">Phone</dt>
            <dd className="tabular">{o.phone}</dd>
            {o.email ? (
              <>
                <dt className="text-midnight/65">Email</dt>
                <dd className="break-all">{o.email}</dd>
              </>
            ) : null}
            <dt className="text-midnight/65">Address</dt>
            <dd>{o.address}</dd>
            {o.notes ? (
              <>
                <dt className="text-midnight/65">Notes</dt>
                <dd>{o.notes}</dd>
              </>
            ) : null}
          </dl>
        </section>
      </div>

      <aside className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8 lg:sticky lg:top-6" aria-label="Items and total">
        <h2 className="font-sans text-lg font-semibold">Items</h2>
        <ul className="mt-4 flex flex-col gap-3 text-[0.9375rem]">
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
        <dl className="mt-5 flex flex-col gap-2 border-t border-midnight/10 pt-4 text-[0.9375rem]">
          <Row label="Subtotal" value={rs(o.subtotalPaisa)} />
          {o.discountPaisa ? <Row label="Discount" value={`−${rs(o.discountPaisa)}`} /> : null}
          <Row label="Delivery" value={deliveryLabel(o)} />
          {o.codFeePaisa ? <Row label="Cash on delivery fee" value={rs(o.codFeePaisa)} /> : null}
          <div className="mt-2 flex justify-between border-t border-midnight/10 pt-3 text-lg">
            <dt className="font-semibold">Total</dt>
            <dd className="font-bold tabular">{rs(o.totalPaisa)}</dd>
          </div>
        </dl>
        <a href={`/order/${o.code}/pdf`} download className={buttonClasses("primary", "lg", "mt-6 w-full")}>
          Download PDF
        </a>
        <p className="mt-3 text-sm text-midnight/65">Your order details are private to this browser and the link in your email.</p>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
