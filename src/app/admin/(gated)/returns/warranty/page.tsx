import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { warrantyLookup } from "@/server/returns/returns";

export const metadata = { title: "Warranty check" };
export const dynamic = "force-dynamic";

const BADGE = { ACTIVE: ["stock", "Covered"], EXPIRED: ["out", "Ended"], NONE: ["neutral", "No warranty"], NOT_STARTED: ["low", "Starts on delivery"] } as const;

/** Is this item still under warranty? Type the order code or the customer's mobile number. */
export default async function WarrantyPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff("returns");
  const q = ((await searchParams).q ?? "").trim();
  const results = q ? warrantyLookup(db, q) : [];

  return (
    <>
      <AdminHeader title="Warranty check" description="Type the order code from the receipt or the customer’s mobile number to see what is still covered. Warranty runs from the delivery date (online) or the sale (counter)." />
      <form className="mb-8 flex max-w-xl gap-2">
        <Input name="q" defaultValue={q} placeholder="CA-POS-261022-0004 or 0300 1234567" aria-label="Order code or mobile number" autoFocus required minLength={3} />
        <Button type="submit">Check</Button>
      </form>
      {q && results.length === 0 && <p className="rounded-bezel bg-white px-6 py-10 text-center text-midnight/60 ring-1 ring-midnight/8">No order matches “{q}”.</p>}
      <div className="flex flex-col gap-8">
        {results.map(({ order, boughtAt, lines }) => (
          <section key={order.id}>
            <h2 className="text-lg font-bold">
              <span className="tabular">{order.code}</span> <span className="font-normal text-midnight/65">· {order.customer}{order.phone ? ` · ${order.phone}` : ""} · {order.channel === "COUNTER" ? "bought" : "ordered"} {formatKarachi(boughtAt)}</span>
            </h2>
            <div className="mt-3">
              <Table>
                <THead>
                  <TR>
                    <TH>Item</TH>
                    <TH>Bought</TH>
                    <TH>Warranty</TH>
                    <TH>Until</TH>
                    <TH className="text-right">Returnable</TH>
                  </TR>
                </THead>
                <tbody>
                  {lines.map((l) => (
                    <TR key={l.orderItemId}>
                      <TD>
                        <p className="font-semibold">{l.description.split(" — ")[0]}</p>
                        <p className="text-sm text-midnight/60">{l.description.split(" — ")[1]}</p>
                      </TD>
                      <TD className="whitespace-nowrap">
                        {l.quantity} × {formatMoney(paisa(l.unitPricePaisa))}
                      </TD>
                      <TD>
                        <Badge tone={BADGE[l.status][0]}>{BADGE[l.status][1]}</Badge>
                      </TD>
                      <TD className="whitespace-nowrap">{l.warrantyUntil ? `${formatKarachi(l.warrantyUntil).split(",")[0]}${l.status === "ACTIVE" && l.daysLeft !== null ? ` (${l.daysLeft} day${l.daysLeft === 1 ? "" : "s"} left)` : ""}` : "—"}</TD>
                      <TD className="text-right">{l.remaining} of {l.quantity}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>
            <p className="mt-3 text-sm">
              {order.blocked ? (
                <span className="text-terracotta">{order.blocked}</span>
              ) : (
                <Link href={`/admin/returns/new?order=${encodeURIComponent(order.code)}`} className="font-semibold underline">
                  Start a return for this order
                </Link>
              )}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
