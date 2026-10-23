import Link from "next/link";
import { AdminHeader, Notice, Section, Textarea } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { RETURN_REASONS } from "@/db/schema/returns";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { CHANGE_OF_MIND_DAYS, REASON_LABEL, findOrders, orderForReturn } from "@/server/returns/returns";
import { createReturnAction } from "../actions";

export const metadata = { title: "New return" };
export const dynamic = "force-dynamic";

/** Step 1: find the order by its code or the customer's mobile. Step 2: choose the items and why. */
export default async function NewReturnPage({ searchParams }: { searchParams: Promise<{ order?: string; id?: string; error?: string }> }) {
  await requireStaff("returns");
  const sp = await searchParams;
  const q = (sp.order ?? "").trim();
  const matches = q ? findOrders(db, q) : [];
  const exact = sp.id ? matches.find((m) => m.id === sp.id) : matches.length === 1 ? matches[0] : matches.find((m) => m.code === q.toUpperCase());
  const info = exact ? orderForReturn(db, exact.id) : null;

  return (
    <>
      <AdminHeader title="New return" description="Find the order the item was bought on — type its code (CA-ORD-… or CA-POS-… from the receipt) or the customer’s mobile number." />
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <form className="mb-8 flex max-w-xl gap-2">
        <Input name="order" defaultValue={q} placeholder="CA-POS-261022-0004 or 0300 1234567" aria-label="Order code or mobile number" autoFocus required minLength={3} />
        <Button type="submit">Find</Button>
      </form>

      {q && matches.length === 0 && <Notice tone="error">No order matches “{q}”.</Notice>}

      {matches.length > 1 && !info && (
        <ul className="mb-8 flex max-w-2xl flex-col gap-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link href={`?order=${encodeURIComponent(q)}&id=${m.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-bezel-sm bg-white px-5 py-3 ring-1 ring-midnight/8 hover:ring-midnight/30">
                <span>
                  <span className="font-semibold tabular">{m.code}</span> · {m.customer} · {formatKarachi(m.placedAt)}
                </span>
                <span className="flex items-center gap-2">
                  {m.blocked ? <Badge tone="out">Can’t return</Badge> : null}
                  <span className="tabular">{formatMoney(paisa(m.totalPaisa))}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {info && exact && (
        <>
          <Section title={`${info.order.code} · ${info.order.channel === "COUNTER" ? "Counter sale" : "Online order"}`} description={`${exact.customer}${exact.phone ? ` · ${exact.phone}` : ""} · ${info.order.channel === "COUNTER" ? "sold" : "delivered"} ${formatKarachi(info.purchasedAt)} · paid ${formatMoney(paisa(info.order.totalPaisa))}`}>
            {info.blocked ? (
              <Notice tone="error">{info.blocked}</Notice>
            ) : (
              <form action={createReturnAction} className="flex flex-col gap-6">
                <input type="hidden" name="orderId" value={info.order.id} />
                <input type="hidden" name="orderCode" value={info.order.code} />
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-1 text-sm font-semibold">How many of each item are coming back?</legend>
                  {info.lines.map((l) => (
                    <div key={l.orderItemId} className="flex flex-wrap items-center justify-between gap-3 rounded-bezel-sm bg-surface px-5 py-3">
                      <div className="max-w-xl">
                        <p className="font-semibold">{l.description}</p>
                        <p className="text-sm text-midnight/65">
                          {l.sku} · bought {l.quantity} × {formatMoney(paisa(l.unitPricePaisa))}
                          {l.alreadyReturned ? ` · ${l.alreadyReturned} already in a return` : ""}
                        </p>
                        <p className="text-sm">
                          {l.warrantyUntil ? (
                            <span className={l.warrantyActive ? "text-midnight/75" : "font-semibold text-terracotta"}>
                              Warranty {l.warrantyActive ? "until" : "ended"} {formatKarachi(l.warrantyUntil).split(",")[0]}
                            </span>
                          ) : (
                            <span className="text-midnight/65">No warranty on this item</span>
                          )}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        Returning
                        <Input type="number" name={`qty_${l.orderItemId}`} min={0} max={l.remaining} defaultValue={info.lines.length === 1 && l.remaining > 0 ? 1 : 0} disabled={l.remaining === 0} className="h-10 w-20 text-center" />
                        <span className="font-normal text-midnight/60">of {l.remaining}</span>
                      </label>
                    </div>
                  ))}
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="reason" label="Why is it coming back?" hint={`“Changed their mind” is accepted for ${CHANGE_OF_MIND_DAYS} days; faults need an active warranty.`}>
                    <Select id="reason" name="reason" required defaultValue="">
                      <option value="" disabled>
                        Choose…
                      </option>
                      {RETURN_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {REASON_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
                    <input type="checkbox" name="received" defaultChecked={info.order.channel === "COUNTER"} className="size-5 accent-midnight" />
                    The item is here with us now
                  </label>
                </div>
                <Field id="description" label="What is wrong? (in your words)">
                  <Textarea id="description" name="description" required minLength={3} maxLength={500} placeholder="e.g. Touch stops working on the lower half after 2 days" />
                </Field>
                <div>
                  <Button type="submit">Open the return</Button>
                </div>
              </form>
            )}
          </Section>
        </>
      )}
    </>
  );
}
