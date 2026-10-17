import Link from "next/link";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { recentLoadSheets } from "@/server/orders/fulfilment";
import { COURIER_LABEL } from "@/server/orders/order-details";

export const metadata = { title: "Load sheets" };
export const dynamic = "force-dynamic";

export default async function LoadSheetsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const sheets = recentLoadSheets(db, 50);
  return (
    <>
      <AdminHeader
        title="Load sheets"
        description="A list of the parcels a courier's rider takes away, for both sides to sign. Make one from Online orders → With courier: tick the parcels, then “Make load sheet”."
        actions={
          <ButtonLink href="/admin/orders?f=courier" variant="outline">
            Parcels with couriers
          </ButtonLink>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {sheets.length === 0 ? (
        <p className="text-midnight/70">No load sheets yet.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Load sheet</TH>
              <TH>Courier</TH>
              <TH className="text-right">Parcels</TH>
              <TH className="text-right">COD</TH>
            </tr>
          </THead>
          <tbody>
            {sheets.map((s) => (
              <TR key={s.id}>
                <TD>
                  <Link href={`/admin/orders/load-sheets/${s.id}`} className="font-semibold tabular underline-offset-4 hover:underline">
                    {s.code}
                  </Link>
                  <span className="block text-sm text-midnight/60">{formatKarachi(s.createdAt)}</span>
                </TD>
                <TD>{COURIER_LABEL[s.courier] ?? s.courier}</TD>
                <TD className="tabular text-right">{s.parcels}</TD>
                <TD className="tabular text-right">{formatMoney(paisa(s.codTotalPaisa))}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
