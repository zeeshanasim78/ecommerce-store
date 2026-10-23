import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, isNull } from "drizzle-orm";
import { AdminHeader, Notice, Section, Textarea } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { vendors } from "@/db/schema";
import { DISPOSITIONS, ITEM_CONDITIONS, REFUND_METHODS } from "@/db/schema/returns";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { CONDITION_LABEL, DELIVERY_REFUND_REASONS, DISPOSITION_LABEL, REASON_LABEL, REFUND_METHOD_LABEL, STATUS_LABEL, returnDetails, type ItemCondition, type ReturnReason, type ReturnStatus } from "@/server/returns/returns";
import { approveReturnAction, closeReturnAction, inspectReturnAction, receiveReturnAction, recordRefundAction, rejectReturnAction } from "../actions";

export const metadata = { title: "Return" };
export const dynamic = "force-dynamic";

const rs = (n: number) => formatMoney(paisa(n));
const TONE: Record<ReturnStatus, "low" | "stock" | "out" | "neutral" | "grade"> = { REQUESTED: "low", RECEIVED: "low", INSPECTING: "low", APPROVED: "grade", REJECTED: "out", CLOSED: "neutral" };
const ACTION_LABEL: Record<string, string> = {
  "return.created": "Return opened",
  "return.received": "Item received",
  "return.inspected": "Inspected",
  "return.approved": "Approved",
  "return.rejected": "Rejected",
  "return.refunded": "Refund paid — closed",
  "return.closed": "Closed",
};
const DEFAULT_DISPOSITION: Record<ItemCondition, string> = { RESELLABLE: "RESTOCK", DEFECTIVE: "RETURN_TO_VENDOR", PHYSICALLY_DAMAGED: "WRITE_OFF" };

function note(after: unknown): string | null {
  if (!after || typeof after !== "object") return null;
  const a = after as Record<string, unknown>;
  if (typeof a.notes === "string") return a.notes;
  if (typeof a.note === "string") return a.note;
  if (typeof a.method === "string") return `${REFUND_METHOD_LABEL[a.method as keyof typeof REFUND_METHOD_LABEL] ?? a.method}${typeof a.reference === "string" ? ` · ${a.reference}` : ""}`;
  if (typeof a.resolution === "string") return String(a.resolution).toLowerCase().replace("_", " ");
  return null;
}

export default async function ReturnPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("returns");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const d = returnDetails(db, id);
  if (!d) notFound();
  const { ret, order } = d;
  const reason = ret.reason as ReturnReason;
  const vendorList = db.select({ id: vendors.id, name: vendors.name }).from(vendors).where(isNull(vendors.archivedAt)).orderBy(asc(vendors.name)).all();
  const canDelivery = DELIVERY_REFUND_REASONS.includes(reason) && d.maxRefundWithDeliveryPaisa > d.maxRefundPaisa;
  const inspected = d.items.every((i) => i.condition);
  const damaged = d.items.some((i) => i.condition === "PHYSICALLY_DAMAGED") && reason !== "DAMAGED_IN_TRANSIT";
  const needsOverride = !ret.withinWarranty || damaged || (reason === "CHANGE_OF_MIND" && d.items.some((i) => i.condition !== "RESELLABLE"));

  return (
    <>
      <AdminHeader
        title={ret.code}
        description={`${REASON_LABEL[reason]} · ${d.orderCustomer} · opened ${formatKarachi(ret.createdAt)}${d.createdByName ? ` by ${d.createdByName}` : ""}`}
        actions={
          <>
            <Badge tone={TONE[ret.status]} className="h-9 px-4 text-sm">
              {STATUS_LABEL[ret.status]}
            </Badge>
            <Link href="/admin/returns" className="inline-flex h-9 items-center rounded-full border border-midnight/20 px-4 text-sm font-semibold hover:border-midnight/45">
              All returns
            </Link>
          </>
        }
      />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <div className="flex flex-col gap-8">
        <Section title="The return">
          <dl className="grid gap-x-8 gap-y-4 text-[0.9375rem] sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-midnight/60">Order</dt>
              <dd>
                {order.channel === "ONLINE" ? (
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold tabular underline">
                    {order.code}
                  </Link>
                ) : (
                  <span className="font-semibold tabular">{order.code}</span>
                )}{" "}
                · {order.channel === "COUNTER" ? "counter sale" : "online"} · paid {rs(order.totalPaisa)} ({order.paymentStatus.toLowerCase().replace(/_/g, " ")})
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-midnight/60">Warranty</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <Badge tone={ret.withinWarranty ? "stock" : "out"}>{ret.withinWarranty ? "Covered" : "Outside warranty"}</Badge>
                <span className="text-midnight/75">{d.warrantyText}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-midnight/60">What the customer says</dt>
              <dd>{ret.description}</dd>
            </div>
            {ret.inspectionNotes ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-midnight/60">Inspection{d.inspectedByName ? ` by ${d.inspectedByName}` : ""}</dt>
                <dd>{ret.inspectionNotes}</dd>
              </div>
            ) : null}
            {ret.decisionNotes ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-midnight/60">{ret.status === "REJECTED" || (ret.status === "CLOSED" && ret.resolution === "REJECTED") ? "Why it was rejected" : "Decision note"}</dt>
                <dd>{ret.decisionNotes}</dd>
              </div>
            ) : null}
            {ret.overrideReason ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-midnight/60">Approved anyway{d.decidedByName ? ` by ${d.decidedByName}` : ""} because</dt>
                <dd>{ret.overrideReason}</dd>
              </div>
            ) : null}
          </dl>
          <Table>
            <THead>
              <TR>
                <TH>Item</TH>
                <TH className="text-right">Units</TH>
                <TH>Condition</TH>
                <TH>What happened to it</TH>
                <TH className="text-right">Paid for it</TH>
              </TR>
            </THead>
            <tbody>
              {d.items.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <p className="font-semibold">{i.description.split(" — ")[0]}</p>
                    <p className="text-sm text-midnight/60">{i.description.split(" — ")[1]} · {i.sku}</p>
                  </TD>
                  <TD className="tabular text-right">{i.quantity}</TD>
                  <TD>{i.condition ? CONDITION_LABEL[i.condition] : <span className="text-midnight/50">Not inspected</span>}</TD>
                  <TD>
                    {i.disposition ? DISPOSITION_LABEL[i.disposition] : <span className="text-midnight/50">—</span>}
                    {i.vendorName ? <p className="text-sm text-midnight/60">Claim to {i.vendorName}{i.claim ? ` · ${CLAIM[i.claim.status] ?? i.claim.status}` : ""}</p> : null}
                  </TD>
                  <TD className="tabular text-right whitespace-nowrap">{rs(i.refundPaisa)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
          {ret.resolution && ret.resolution !== "REJECTED" ? (
            <p className="text-[0.9375rem]">
              <strong>{ret.resolution === "REFUND" ? "Refund" : ret.resolution === "REPLACEMENT" ? "Replacement" : "Store credit"}</strong>
              {ret.refundPaisa ? ` of ${rs(ret.refundPaisa)}${ret.refundIncludesDelivery ? " (includes delivery charges)" : ""}` : ""}
              {ret.refundedAt ? ` — paid ${formatKarachi(ret.refundedAt)} by ${d.refundedByName ?? "staff"} (${REFUND_METHOD_LABEL[ret.refundMethod ?? "OTHER"]}${ret.refundReference ? `, ${ret.refundReference}` : ""})` : ""}
            </p>
          ) : null}
        </Section>

        {ret.status === "REQUESTED" && (
          <Section title="Step 1 — the item arrives" description="Press this when the item is physically here.">
            <form action={receiveReturnAction}>
              <input type="hidden" name="id" value={ret.id} />
              <Button type="submit">Item received</Button>
            </form>
          </Section>
        )}

        {(ret.status === "RECEIVED" || ret.status === "INSPECTING") && (
          <Section title={ret.status === "RECEIVED" ? "Step 2 — inspect the item" : "Inspection (you can still change it)"} description="Test the item and record its condition. Good items can go back on sale; faulty ones are claimed from the supplier; physically damaged ones are written off.">
            <form action={inspectReturnAction} className="flex flex-col gap-5">
              <input type="hidden" name="id" value={ret.id} />
              {d.items.map((i) => (
                <Field key={i.id} id={`cond-${i.id}`} label={`${i.quantity} × ${i.description.split(" — ")[0]} — condition`}>
                  <Select id={`cond-${i.id}`} name={`cond_${i.id}`} required defaultValue={i.condition ?? ""}>
                    <option value="" disabled>
                      Choose…
                    </option>
                    {ITEM_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {CONDITION_LABEL[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
              <Field id="notes" label="What did the inspection find?">
                <Textarea id="notes" name="notes" required minLength={3} maxLength={500} defaultValue={ret.inspectionNotes ?? ""} placeholder="e.g. Tested on a known-good phone: touch dead in the lower third. No cracks, no pressure marks." />
              </Field>
              <div>
                <Button type="submit">Save inspection</Button>
              </div>
            </form>
          </Section>
        )}

        {ret.status === "INSPECTING" && inspected && (
          <Section title="Step 3 — decide" description="Approving does the stock work in one go: good items go back on sale, faulty ones become a supplier claim, damaged ones are written off.">
            <form action={approveReturnAction} className="flex flex-col gap-6">
              <input type="hidden" name="id" value={ret.id} />
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-sm font-semibold">What does the customer get?</legend>
                {[
                  ["REFUND", "Refund the money"],
                  ["REPLACEMENT", "Replace the item (a unit leaves stock)"],
                  ["STORE_CREDIT", "Store credit"],
                ].map(([v, label], idx) => (
                  <label key={v} className="flex items-center gap-3 text-[0.9375rem]">
                    <input type="radio" name="resolution" value={v} defaultChecked={idx === 0} required className="size-5 accent-midnight" />
                    {label}
                  </label>
                ))}
              </fieldset>

              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">What happens to each returned unit?</p>
                {d.items.map((i) => (
                  <div key={i.id} className="grid gap-3 rounded-bezel-sm bg-surface p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <div>
                      <p className="font-semibold">
                        {i.quantity} × {i.description.split(" — ")[0]}
                      </p>
                      <p className="text-sm text-midnight/65">{i.condition ? CONDITION_LABEL[i.condition] : ""}</p>
                    </div>
                    <Field id={`disp-${i.id}`} label="Action">
                      <Select id={`disp-${i.id}`} name={`disp_${i.id}`} defaultValue={i.condition ? DEFAULT_DISPOSITION[i.condition] : "WRITE_OFF"}>
                        {DISPOSITIONS.map((x) => (
                          <option key={x} value={x}>
                            {DISPOSITION_LABEL[x]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field id={`vendor-${i.id}`} label="Supplier (for a claim)">
                      <Select id={`vendor-${i.id}`} name={`vendor_${i.id}`} defaultValue={i.suggestedVendor?.id ?? ""}>
                        <option value="">{i.suggestedVendor ? "—" : "Choose…"}</option>
                        {vendorList.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                            {v.id === i.suggestedVendor?.id ? " (last supplier)" : ""}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="amount" label="Amount to give back (Rs)" hint={`Up to ${rs(d.maxRefundPaisa)} for the items${canDelivery ? `, ${rs(d.maxRefundWithDeliveryPaisa)} with delivery charges` : ""}. Leave empty for the full amount. Not used for a replacement.`}>
                  <Input id="amount" name="amount" inputMode="decimal" placeholder={(d.maxRefundPaisa / 100).toString()} />
                </Field>
                {canDelivery ? (
                  <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
                    <input type="checkbox" name="includeDelivery" className="size-5 accent-midnight" />
                    Also give back the delivery charges ({rs(d.deliveryChargesPaisa)})
                  </label>
                ) : null}
              </div>
              <Field id="decisionNotes" label="Note (needed if you give back less than the full amount)">
                <Input id="decisionNotes" name="decisionNotes" maxLength={300} />
              </Field>
              <Field
                id="overrideReason"
                label={needsOverride ? "Why approve this anyway? (required)" : "Why approve this anyway? (not needed here)"}
                hint={needsOverride ? [!ret.withinWarranty ? "It is outside warranty." : "", damaged ? "An item is physically damaged." : "", reason === "CHANGE_OF_MIND" && d.items.some((i) => i.condition !== "RESELLABLE") ? "The item isn’t resellable." : ""].filter(Boolean).join(" ") : undefined}
              >
                <Input id="overrideReason" name="overrideReason" maxLength={300} required={needsOverride} />
              </Field>
              <div>
                <Button type="submit">Approve the return</Button>
              </div>
            </form>
          </Section>
        )}

        {(ret.status === "REQUESTED" || ret.status === "RECEIVED" || ret.status === "INSPECTING") && (
          <Section title="Reject instead" description="Nothing changes in stock. The customer gets the item back.">
            <form action={rejectReturnAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={ret.id} />
              <div className="min-w-72 flex-1">
                <Field id="reject-notes" label="Reason (the customer may ask)">
                  <Input id="reject-notes" name="notes" required minLength={3} maxLength={300} placeholder="e.g. Cracked glass — customer damage, not covered" />
                </Field>
              </div>
              <Button type="submit" variant="outline">
                Reject the return
              </Button>
            </form>
          </Section>
        )}

        {ret.status === "APPROVED" && ret.resolution === "REFUND" && (
          <Section title="Step 4 — pay the refund" description={`Pay ${rs(ret.refundPaisa)} back to the customer, then record how. Recording it closes the return${order.channel === "COUNTER" ? "; cash refunds show on the End of day page" : ""}.`}>
            <form action={recordRefundAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="id" value={ret.id} />
              <Field id="method" label="Paid by">
                <Select id="method" name="method" required defaultValue={order.channel === "COUNTER" ? "CASH" : "BANK_TRANSFER"}>
                  {REFUND_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {REFUND_METHOD_LABEL[m]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="reference" label="Transaction ID (not needed for cash)">
                <Input id="reference" name="reference" maxLength={40} />
              </Field>
              <div>
                <Button type="submit">Refund paid — close</Button>
              </div>
            </form>
          </Section>
        )}

        {((ret.status === "APPROVED" && ret.resolution !== "REFUND") || ret.status === "REJECTED") && (
          <Section title="Finish" description={ret.status === "REJECTED" ? "Hand the item back to the customer, then close the return." : ret.resolution === "REPLACEMENT" ? "Close the return once the replacement has been handed over." : "Write the voucher or credit note you gave, then close the return."}>
            <form action={closeReturnAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={ret.id} />
              <div className="min-w-72 flex-1">
                <Field id="close-note" label={ret.resolution === "STORE_CREDIT" ? "Store-credit note / voucher number" : "Note (optional)"}>
                  <Input id="close-note" name="note" maxLength={300} required={ret.resolution === "STORE_CREDIT"} />
                </Field>
              </div>
              <Button type="submit">Close the return</Button>
            </form>
          </Section>
        )}

        <Section title="History">
          <ol className="flex flex-col gap-2 text-[0.9375rem]">
            {d.history.map((h, idx) => (
              <li key={idx} className="flex flex-wrap gap-x-3">
                <span className="w-40 shrink-0 text-midnight/60">{formatKarachi(h.at)}</span>
                <span className="font-semibold">{ACTION_LABEL[h.action] ?? h.action}</span>
                <span className="text-midnight/70">{h.by ?? "System"}{note(h.after) ? ` — ${note(h.after)}` : ""}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </>
  );
}

const CLAIM: Record<string, string> = { OPEN: "to send", SENT: "sent", CREDITED: "credited", REJECTED: "rejected" };
