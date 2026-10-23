import Link from "next/link";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { REASON_LABEL, STATUS_LABEL, listReturns, returnCounts, type ReturnStatus } from "@/server/returns/returns";
import { claimTotals } from "@/server/returns/vendor-claims";

export const metadata = { title: "Returns" };
export const dynamic = "force-dynamic";

const TONE: Record<ReturnStatus, "low" | "stock" | "out" | "neutral" | "grade"> = { REQUESTED: "low", RECEIVED: "low", INSPECTING: "low", APPROVED: "grade", REJECTED: "out", CLOSED: "neutral" };
const FILTERS = [
  { key: "", label: "Open" },
  { key: "REQUESTED", label: "Requested" },
  { key: "RECEIVED", label: "Received" },
  { key: "INSPECTING", label: "Inspected" },
  { key: "APPROVED", label: "Approved" },
  { key: "CLOSED", label: "Closed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
] as const;

/** Returns (RMA) and warranty — spec §4.12, §7, §28. */
export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; saved?: string; error?: string }> }) {
  await requireStaff("returns");
  const sp = await searchParams;
  const status = sp.status ?? "";
  const list = listReturns(db, { status: status && status !== "ALL" ? status : undefined, open: status === "", q: sp.q });
  const counts = returnCounts(db);
  const claims = claimTotals(db);

  return (
    <>
      <AdminHeader
        title="Returns & warranty"
        description="Open a return from an order, check the warranty, inspect the item, then refund, replace or reject. Good items go back on sale; faulty ones become a supplier claim."
        actions={
          <>
            <ButtonLink href="/admin/returns/new">New return</ButtonLink>
            <ButtonLink href="/admin/returns/warranty" variant="outline">
              Warranty check
            </ButtonLink>
          </>
        }
      />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {counts.REFUND_DUE > 0 && <Notice tone="error">{counts.REFUND_DUE} approved refund{counts.REFUND_DUE === 1 ? " is" : "s are"} waiting to be paid.</Notice>}

      <dl className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Open returns" value={String(counts.OPEN)} sub={`${counts.REQUESTED + counts.RECEIVED + counts.INSPECTING} to inspect or decide`} />
        <Stat label="Refunds to pay" value={String(counts.REFUND_DUE)} sub="approved, money not yet paid back" />
        <Stat label="Supplier claims" value={formatMoney(paisa(claims.owedPaisa))} sub={`${claims.open} to send · ${claims.sent} waiting`} href="/admin/returns/claims" />
      </dl>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `?status=${f.key}` : "?"} aria-current={status === f.key ? "page" : undefined} className="rounded-full border border-midnight/20 px-4 py-1.5 text-sm font-semibold aria-[current=page]:bg-midnight aria-[current=page]:text-canvas">
            {f.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={sp.q} placeholder="RMA, order, name or mobile" aria-label="Search returns" className="h-9 w-60" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {list.length === 0 ? (
        <p className="rounded-bezel bg-white px-6 py-10 text-center text-midnight/60 ring-1 ring-midnight/8">No returns here.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Return</TH>
              <TH>Order</TH>
              <TH>Why</TH>
              <TH>Status</TH>
              <TH>Warranty</TH>
              <TH className="text-right">Refund</TH>
              <TH>Opened</TH>
            </TR>
          </THead>
          <tbody>
            {list.map((r) => (
              <TR key={r.id}>
                <TD>
                  <Link href={`/admin/returns/${r.id}`} className="font-semibold tabular hover:underline">
                    {r.code}
                  </Link>
                  <p className="text-sm text-midnight/60">
                    {r.units} unit{r.units === 1 ? "" : "s"} · {r.customer}
                  </p>
                </TD>
                <TD className="tabular whitespace-nowrap">
                  {r.orderCode}
                  <p className="text-sm text-midnight/60">{r.channel === "COUNTER" ? "Counter sale" : "Online"}</p>
                </TD>
                <TD>{REASON_LABEL[r.reason]}</TD>
                <TD>
                  <Badge tone={TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  {r.status === "APPROVED" && r.resolution ? <p className="mt-1 text-sm text-midnight/60">{r.resolution === "REFUND" ? "Refund — unpaid" : r.resolution === "REPLACEMENT" ? "Replacement" : "Store credit"}</p> : null}
                </TD>
                <TD>
                  <Badge tone={r.withinWarranty ? "stock" : "out"}>{r.withinWarranty ? "Covered" : "Outside"}</Badge>
                </TD>
                <TD className="tabular text-right whitespace-nowrap">{r.refundPaisa ? `${formatMoney(paisa(r.refundPaisa))}${r.refunded ? " ✓" : ""}` : "—"}</TD>
                <TD className="whitespace-nowrap text-midnight/75">{formatKarachi(r.createdAt)}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <div className="rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
      <dt className="text-sm font-semibold text-midnight/65">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tracking-[-0.02em]">{value}</dd>
      {sub ? <p className="mt-1 text-sm text-midnight/60">{sub}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
