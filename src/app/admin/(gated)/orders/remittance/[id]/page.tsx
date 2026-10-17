import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import type { RemittanceResult } from "@/db/schema/logistics";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { acceptable, remittanceDetails } from "@/server/orders/cod-remittance";
import { COURIER_LABEL } from "@/server/orders/order-details";
import { confirmRemittanceAction, discardRemittanceAction } from "../actions";

export const metadata = { title: "COD payment report" };
export const dynamic = "force-dynamic";

const rs = (n: number) => formatMoney(paisa(n));
const RESULT: Record<RemittanceResult, { label: string; tone: "stock" | "low" | "out" | "neutral" }> = {
  MATCH: { label: "Matches — will be marked paid", tone: "stock" },
  AMOUNT_DIFFERS: { label: "Amount differs", tone: "low" },
  NOT_DELIVERED: { label: "Not marked delivered here", tone: "low" },
  UNKNOWN_CN: { label: "CN not found", tone: "out" },
  ALREADY_REMITTED: { label: "Already paid earlier", tone: "neutral" },
  NOT_COD: { label: "Not a COD parcel", tone: "out" },
  DUPLICATE_ROW: { label: "Same CN twice in the file", tone: "out" },
};

export default async function RemittanceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("orders");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const r = remittanceDetails(db, id);
  if (!r) notFound();
  const draft = r.status === "DRAFT";
  const matches = r.lines.filter((l) => l.result === "MATCH");
  const reportTotal = r.lines.reduce((s, l) => s + l.amountPaisa, 0);

  return (
    <>
      <AdminHeader
        title={`COD payment report ${r.code}`}
        description={`${COURIER_LABEL[r.courier] ?? r.courier} · ${r.fileName}${r.reference ? ` · ref ${r.reference}` : ""} · uploaded ${formatKarachi(r.createdAt)} by ${r.uploadedBy ?? "?"}`}
        actions={
          <ButtonLink href="/admin/orders/remittance" variant="outline">
            COD remittance
          </ButtonLink>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <p className="mb-6 text-[0.9375rem]">
        {r.rows} row{r.rows === 1 ? "" : "s"} totalling {rs(reportTotal)}.{" "}
        {draft ? (
          <>
            <b>{matches.length}</b> match{matches.length === 1 ? "es" : ""} ({rs(matches.reduce((s, l) => s + l.amountPaisa, 0))}). Rows with a different amount, or parcels not yet marked delivered, are only applied if you tick them and write why.
          </>
        ) : r.status === "CONFIRMED" ? (
          <>
            Confirmed {formatKarachi(r.confirmedAt)}: <b>{r.appliedCount}</b> parcel{r.appliedCount === 1 ? "" : "s"}, {rs(r.appliedPaisa)}.
          </>
        ) : null}
      </p>

      <form action={confirmRemittanceAction}>
        <input type="hidden" name="remittanceId" value={r.id} />
        <Table>
          <THead>
            <tr>
              <TH>Row</TH>
              <TH>CN</TH>
              <TH>Order</TH>
              <TH className="text-right">Paid</TH>
              <TH className="text-right">Expected</TH>
              <TH>Result</TH>
            </tr>
          </THead>
          <tbody>
            {r.lines.map((l) => (
              <TR key={l.id}>
                <TD className="tabular">{l.rowNo}</TD>
                <TD className="tabular font-semibold">{l.cn}</TD>
                <TD>
                  {l.orderId ? (
                    <Link href={`/admin/orders/${l.orderId}`} className="tabular underline-offset-4 hover:underline">
                      {l.orderCode}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD className="tabular text-right">{rs(l.amountPaisa)}</TD>
                <TD className={`tabular text-right ${l.expectedPaisa != null && l.expectedPaisa !== l.amountPaisa ? "font-semibold text-terracotta" : ""}`}>{l.expectedPaisa != null ? rs(l.expectedPaisa) : "—"}</TD>
                <TD>
                  <Badge tone={l.applied ? "stock" : RESULT[l.result].tone}>{l.applied ? "Applied" : RESULT[l.result].label}</Badge>
                  {l.note ? <span className="mt-1 block text-sm text-midnight/65">{l.note}</span> : null}
                  {draft && acceptable(l) ? (
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" name={`accept_${l.id}`} className="size-5 accent-midnight" />
                        Accept
                      </label>
                      <Input name={`reason_${l.id}`} maxLength={200} placeholder={l.result === "AMOUNT_DIFFERS" ? "Why (e.g. courier deducted return charge)" : "Why (e.g. courier confirms delivered)"} aria-label={`Reason for ${l.cn}`} className="h-9 min-w-56 flex-1 text-sm" />
                    </span>
                  ) : null}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        {draft ? (
          <div className="mt-6">
            <Button type="submit">Confirm — mark these parcels paid by the courier</Button>
          </div>
        ) : null}
      </form>
      {draft ? (
        <form action={discardRemittanceAction} className="mt-4">
          <input type="hidden" name="remittanceId" value={r.id} />
          <Button type="submit" variant="ghost" size="sm">
            Discard this upload
          </Button>
        </form>
      ) : null}
    </>
  );
}
