import Link from "next/link";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { CLAIM_STATUS_LABEL, claimTotals, listClaims, type ClaimStatus } from "@/server/returns/vendor-claims";
import { updateClaimAction } from "../actions";

export const metadata = { title: "Supplier claims" };
export const dynamic = "force-dynamic";

const TONE: Record<ClaimStatus, "low" | "grade" | "stock" | "out"> = { OPEN: "low", SENT: "grade", CREDITED: "stock", REJECTED: "out" };
const FILTERS = [
  { key: "", label: "All" },
  { key: "OPEN", label: "To send" },
  { key: "SENT", label: "Sent" },
  { key: "CREDITED", label: "Credited" },
  { key: "REJECTED", label: "Rejected" },
] as const;

/** Faulty units that went back to the supplier instead of back on sale (spec §4.12). */
export default async function ClaimsPage({ searchParams }: { searchParams: Promise<{ status?: string; vendor?: string; saved?: string; error?: string }> }) {
  await requireStaff("returns");
  const sp = await searchParams;
  const status = sp.status ?? "";
  const claims = listClaims(db, { status, vendorId: sp.vendor });
  const t = claimTotals(db, sp.vendor);

  return (
    <>
      <AdminHeader title="Supplier claims" description="Faulty units are kept off sale. Send each one back to its supplier, then record the credit they give." />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      <dl className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
          <dt className="text-sm font-semibold text-midnight/65">Owed by suppliers</dt>
          <dd className="mt-1 text-2xl font-bold tracking-[-0.02em]">{formatMoney(paisa(t.owedPaisa))}</dd>
          <p className="mt-1 text-sm text-midnight/60">{t.open} to send · {t.sent} waiting for an answer</p>
        </div>
        <div className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
          <dt className="text-sm font-semibold text-midnight/65">Credited so far</dt>
          <dd className="mt-1 text-2xl font-bold tracking-[-0.02em]">{formatMoney(paisa(t.creditedPaisa))}</dd>
          <p className="mt-1 text-sm text-midnight/60">{t.credited} claim{t.credited === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
          <dt className="text-sm font-semibold text-midnight/65">Rejected by suppliers</dt>
          <dd className="mt-1 text-2xl font-bold tracking-[-0.02em]">{t.rejected}</dd>
        </div>
      </dl>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`?${new URLSearchParams({ ...(f.key ? { status: f.key } : {}), ...(sp.vendor ? { vendor: sp.vendor } : {}) })}`} aria-current={status === f.key ? "page" : undefined} className="rounded-full border border-midnight/20 px-4 py-1.5 text-sm font-semibold aria-[current=page]:bg-midnight aria-[current=page]:text-canvas">
            {f.label}
          </Link>
        ))}
      </div>

      {claims.length === 0 ? (
        <p className="rounded-bezel bg-white px-6 py-10 text-center text-midnight/60 ring-1 ring-midnight/8">No supplier claims here.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Supplier</TH>
              <TH>Item</TH>
              <TH className="text-right">Claim</TH>
              <TH>Status</TH>
              <TH>Next step</TH>
            </TR>
          </THead>
          <tbody>
            {claims.map((c) => (
              <TR key={c.id}>
                <TD className="font-semibold">{c.vendorName}</TD>
                <TD>
                  <p>{c.quantity} × {c.product.split(" — ")[0]}</p>
                  <p className="text-sm text-midnight/60">
                    {c.sku} · <Link href={`/admin/returns/${c.returnId}`} className="underline">{c.returnCode}</Link> · {formatKarachi(c.createdAt).split(",")[0]}
                  </p>
                </TD>
                <TD className="tabular text-right whitespace-nowrap">
                  {formatMoney(paisa(c.claimPaisa))}
                  {c.status === "CREDITED" ? <p className="text-sm text-midnight/60">credited {formatMoney(paisa(c.creditPaisa))}</p> : null}
                </TD>
                <TD>
                  <Badge tone={TONE[c.status]}>{CLAIM_STATUS_LABEL[c.status]}</Badge>
                  {c.reference ? <p className="mt-1 text-sm text-midnight/60">Ref {c.reference}</p> : null}
                  {c.status === "REJECTED" && c.notes ? <p className="mt-1 max-w-48 text-sm text-midnight/60">{c.notes}</p> : null}
                </TD>
                <TD>
                  {c.status === "OPEN" || c.status === "SENT" ? (
                    <div className="flex flex-col gap-2">
                      {c.status === "OPEN" && (
                        <form action={updateClaimAction} className="flex gap-2">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="step" value="SEND" />
                          <Input name="reference" placeholder="Supplier RMA no. (optional)" aria-label="Supplier reference" className="h-9 w-44" />
                          <Button type="submit" size="sm">Mark sent</Button>
                        </form>
                      )}
                      <form action={updateClaimAction} className="flex gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="step" value="CREDIT" />
                        <Input name="credit" inputMode="decimal" placeholder="Credit Rs" aria-label="Credit received in rupees" required className="h-9 w-28" />
                        <Button type="submit" size="sm" variant="outline">Credit received</Button>
                      </form>
                      <form action={updateClaimAction} className="flex gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="step" value="REJECT" />
                        <Input name="notes" placeholder="Their reason" aria-label="Reason the supplier rejected it" required minLength={3} className="h-9 w-44" />
                        <Button type="submit" size="sm" variant="ghost">Rejected</Button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-sm text-midnight/60">{c.resolvedAt ? formatKarachi(c.resolvedAt).split(",")[0] : "—"}</span>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
