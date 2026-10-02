import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Notice, Section, Status, Textarea } from "@/components/admin/ui";
import { CURRENCY_LABEL, PO_STATUS_LABEL, PAYMENT_TERMS_LABEL, formatForeign } from "@/components/admin/purchasing-labels";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { VENDOR_CURRENCIES } from "@/db/schema/purchasing";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { minorToMajor } from "@/server/purchasing/costing";
import { addLine, cancelPurchaseOrder, closeShort, orderPo, receiveGoods, removeLine, savePoHeader, updateLine } from "../actions";
import { loadPurchaseOrder, orderableVariants } from "./load";

export const metadata = { title: "Purchase order" };

const rs = (n: number) => formatMoney(paisa(n));

export default async function PurchaseOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("purchasing");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const data = loadPurchaseOrder(id);
  if (!data) notFound();
  const { po, vendor, lines } = data;

  const isDraft = po.status === "DRAFT";
  const canReceive = po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED";
  const isOpen = isDraft || canReceive;
  const foreign = po.currency !== "PKR";
  const outstanding = lines.reduce((n, l) => n + l.remaining, 0);

  return (
    <>
      <AdminHeader
        title={`${po.code} · ${vendor.name}`}
        description={`${PO_STATUS_LABEL[po.status]} · ${po.currency}${foreign ? ` at Rs ${po.fxRateToPkr} per 1 ${po.currency}` : ""} · ${PAYMENT_TERMS_LABEL[vendor.paymentTerms]}`}
        actions={
          <>
            <Link href={`/admin/purchase-orders/${po.id}/print`} className={buttonClasses("outline")}>
              Print / PDF
            </Link>
            {isDraft ? (
              <form action={orderPo}>
                <input type="hidden" name="id" value={po.id} />
                <Button type="submit" disabled={lines.length === 0}>
                  Mark as ordered
                </Button>
              </form>
            ) : null}
          </>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <dl className="mb-8 grid gap-4 rounded-bezel bg-surface p-5 text-[0.9375rem] sm:grid-cols-4">
        <div>
          <dt className="text-sm text-midnight/65">Status</dt>
          <dd className="mt-1">
            <Status on={!isDraft && po.status !== "CANCELLED"} onLabel={PO_STATUS_LABEL[po.status]} offLabel={PO_STATUS_LABEL[po.status]} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-midnight/65">Goods</dt>
          <dd className="mt-1 font-semibold tabular">
            {formatForeign(data.goodsForeign, po.currency)}
            {foreign ? <span className="block text-sm font-normal text-midnight/70">≈ {rs(data.goodsPaisa)}</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-midnight/65">Shipping, customs, other</dt>
          <dd className="mt-1 font-semibold tabular">{rs(data.extrasPaisa)}</dd>
        </div>
        <div>
          <dt className="text-sm text-midnight/65">Landed total</dt>
          <dd className="mt-1 font-bold tabular">{rs(data.goodsPaisa + data.extrasPaisa)}</dd>
        </div>
        <div className="text-sm text-midnight/70 sm:col-span-4">
          Raised {formatKarachi(po.createdAt)} by {data.createdByName ?? "—"}
          {po.orderedAt ? ` · ordered ${formatKarachi(po.orderedAt)}` : ""}
          {po.expectedAt ? ` · expected ${po.expectedAt}` : ""}
          {po.receivedAt ? ` · completed ${formatKarachi(po.receivedAt)}` : ""}
        </div>
      </dl>

      <div className="flex flex-col gap-8">
        <Section
          title={canReceive ? "Receive goods" : "Lines"}
          description={
            isDraft
              ? "Add every screen and colour you’re ordering. Unit costs are in the vendor’s currency."
              : canReceive
                ? `Count what’s in the box and enter it under “Arriving now”. Stock goes up straight away and is recorded in the stock ledger under ${po.code}. ${outstanding} unit${outstanding === 1 ? "" : "s"} still expected.`
                : "Landed cost per unit includes this PO’s share of shipping, customs and other costs."
          }
        >
          {lines.length === 0 ? (
            <p className="text-midnight/70">No lines yet.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Screen</TH>
                  <TH className="text-right">Ordered</TH>
                  <TH className="text-right">Received</TH>
                  <TH className="text-right">Unit cost</TH>
                  <TH className="text-right">Landed / unit</TH>
                  {canReceive ? <TH className="text-right">Arriving now</TH> : null}
                  {isDraft ? <TH>Change</TH> : null}
                </tr>
              </THead>
              <tbody>
                {lines.map((l) => (
                  <TR key={l.line.id}>
                    <TD className="min-w-56">
                      <Link href={`/admin/products/${l.productId}`} className="font-semibold hover:underline">
                        {l.brand} {l.model}
                      </Link>
                      <span className="block text-sm text-midnight/70">
                        {l.grade} · {l.color}
                        {l.variantLabel ? ` (${l.variantLabel})` : ""}
                      </span>
                      <span className="block text-xs text-midnight/55 tabular">{l.variantSku}</span>
                    </TD>
                    <TD className="tabular text-right">{l.line.qtyOrdered}</TD>
                    <TD className={`tabular text-right ${l.remaining === 0 ? "font-semibold" : ""}`}>{l.line.qtyReceived}</TD>
                    <TD className="tabular text-right whitespace-nowrap">{formatForeign(l.line.unitCostForeign, po.currency)}</TD>
                    <TD className="tabular text-right whitespace-nowrap">
                      {rs(l.landedUnitPaisa)}
                      {l.line.landedUnitCostPaisa === null ? <span className="block text-xs text-midnight/55">estimate</span> : null}
                    </TD>
                    {canReceive ? (
                      <TD className="text-right">
                        <input type="hidden" name="lineId" value={l.line.id} form="receive" />
                        <input type="hidden" name={`before:${l.line.id}`} value={l.line.qtyReceived} form="receive" />
                        {l.remaining > 0 ? (
                          <Input
                            form="receive"
                            name={`qty:${l.line.id}`}
                            type="number"
                            min={0}
                            max={l.remaining}
                            step={1}
                            placeholder={`max ${l.remaining}`}
                            aria-label={`Units of ${l.model} ${l.color} arriving now`}
                            className="ml-auto h-10 w-28 px-4 text-right tabular"
                          />
                        ) : (
                          <span className="text-sm text-midnight/60">All in</span>
                        )}
                      </TD>
                    ) : null}
                    {isDraft ? (
                      <TD>
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={updateLine} className="flex items-center gap-2">
                            <input type="hidden" name="poId" value={po.id} />
                            <input type="hidden" name="lineId" value={l.line.id} />
                            <Input name="qtyOrdered" type="number" min={1} step={1} required defaultValue={l.line.qtyOrdered} aria-label="Quantity" className="h-9 w-20 px-3 text-sm tabular" />
                            <Input name="unitCost" inputMode="decimal" required defaultValue={minorToMajor(l.line.unitCostForeign)} aria-label={`Unit cost in ${po.currency}`} className="h-9 w-28 px-3 text-sm tabular" />
                            <button type="submit" className={buttonClasses("outline", "sm")}>
                              Save
                            </button>
                          </form>
                          <form action={removeLine}>
                            <input type="hidden" name="poId" value={po.id} />
                            <input type="hidden" name="id" value={l.line.id} />
                            <button type="submit" className={buttonClasses("ghost", "sm", "text-terracotta")}>
                              Remove
                            </button>
                          </form>
                        </div>
                      </TD>
                    ) : null}
                  </TR>
                ))}
              </tbody>
            </Table>
          )}

          {canReceive ? (
            <form id="receive" action={receiveGoods} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="id" value={po.id} />
              <Button type="submit">Receive into stock</Button>
              <p className="text-sm text-midnight/65">Leave a line blank if none of it arrived. You can receive the rest later.</p>
            </form>
          ) : null}

          {isDraft ? <AddLineForm poId={po.id} currency={po.currency} /> : null}
        </Section>

        <form action={savePoHeader}>
          <input type="hidden" name="id" value={po.id} />
          <Section title="Costs and details" description="Shipping, customs and other costs are shared across lines by value to give each screen its landed cost, which feeds the product’s average cost.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="currency" label="Currency" hint={isDraft ? "Copied from the vendor. Change it only if this invoice is different." : "Locked once ordered."}>
                <Select id="currency" name="currency" defaultValue={po.currency} disabled={!isDraft}>
                  {VENDOR_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {CURRENCY_LABEL[c]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="fxRateToPkr" label="Exchange rate (Rs for 1 unit)" hint="Ignored for PKR orders.">
                <Input id="fxRateToPkr" name="fxRateToPkr" inputMode="decimal" defaultValue={po.fxRateToPkr} disabled={!isDraft} className="tabular" />
              </Field>
              {(
                [
                  ["shipping", "Shipping (Rs)", po.shippingCostPaisa],
                  ["customs", "Customs duty (Rs)", po.customsDutyPaisa],
                  ["other", "Other costs (Rs)", po.otherLandedCostPaisa],
                ] as const
              ).map(([name, label, value]) => (
                <Field key={name} id={name} label={label} hint={data.anyReceived ? "Locked — goods have been received." : undefined}>
                  <Input id={name} name={name} inputMode="decimal" defaultValue={minorToMajor(value)} disabled={data.anyReceived || !isOpen} className="tabular" />
                </Field>
              ))}
              <Field id="expectedAt" label="Expected arrival">
                <Input id="expectedAt" name="expectedAt" type="date" defaultValue={po.expectedAt ?? ""} disabled={!isOpen} />
              </Field>
            </div>
            <Field id="notes" label="Notes">
              <Textarea id="notes" name="notes" maxLength={2000} defaultValue={po.notes ?? ""} disabled={!isOpen} />
            </Field>
            {isOpen ? (
              <div>
                <Button type="submit" variant="outline">
                  Save details
                </Button>
              </div>
            ) : null}
          </Section>
        </form>

        {data.movements.length > 0 ? (
          <Section title="Stock received on this PO" description="Rows in the stock ledger. They can’t be edited or deleted.">
            <ul className="flex flex-col gap-1 text-[0.9375rem]">
              {data.movements.map((m) => (
                <li key={m.id} className="tabular">
                  {formatKarachi(m.timestamp)} — +{m.qty} × {m.variantSku} by {m.operator ?? "—"}
                </li>
              ))}
            </ul>
            <div>
              <ButtonLink href={`/admin/stock-ledger?ref=${po.code}`} variant="outline" size="sm">
                Open in stock ledger
              </ButtonLink>
            </div>
          </Section>
        ) : null}

        {(po.status === "DRAFT" || po.status === "ORDERED") && !data.anyReceived ? (
          <ReasonForm action={cancelPurchaseOrder} id={po.id} title="Cancel this purchase order" button="Cancel PO" hint="For example: supplier out of stock, ordered elsewhere." />
        ) : null}
        {po.status === "PARTIALLY_RECEIVED" ? (
          <ReasonForm action={closeShort} id={po.id} title="Close with items missing" button="Close PO" hint="Use this when the supplier won’t send the rest. Received stock stays; the missing units stop being expected." />
        ) : null}
      </div>
    </>
  );
}

function AddLineForm({ poId, currency }: { poId: string; currency: string }) {
  const groups = orderableVariants();
  return (
    <form action={addLine} className="grid gap-4 rounded-bezel-sm border border-dashed border-midnight/25 p-5 md:grid-cols-[2fr_0.6fr_0.8fr_auto] md:items-end">
      <input type="hidden" name="poId" value={poId} />
      <Field id="variantId" label="Screen and colour">
        <Select id="variantId" name="variantId" required defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {[...groups].map(([group, variants]) => (
            <optgroup key={group} label={group}>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.color}
                  {v.label ? ` (${v.label})` : ""} — {v.sku}, {v.stock} in stock
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>
      <Field id="qtyOrdered" label="Quantity">
        <Input id="qtyOrdered" name="qtyOrdered" type="number" min={1} max={100000} step={1} required className="tabular" />
      </Field>
      <Field id="unitCost" label={`Unit cost (${currency})`}>
        <Input id="unitCost" name="unitCost" inputMode="decimal" required placeholder="42.50" className="tabular" />
      </Field>
      <Button type="submit" variant="outline">
        Add line
      </Button>
    </form>
  );
}

function ReasonForm({ action, id, title, button, hint }: { action: (fd: FormData) => Promise<void>; id: string; title: string; button: string; hint: string }) {
  return (
    <Section title={title}>
      <details>
        <summary className={buttonClasses("outline", "md", "w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>{button}…</summary>
        <form action={action} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <Field id={`reason-${button}`} label="Reason" hint={hint}>
            <Input id={`reason-${button}`} name="reason" required maxLength={300} />
          </Field>
          <div>
            <button type="submit" className={buttonClasses("urgent")}>
              {button}
            </button>
          </div>
        </form>
      </details>
    </Section>
  );
}
