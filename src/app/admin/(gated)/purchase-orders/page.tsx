import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { AdminHeader, Notice, Status } from "@/components/admin/ui";
import { PO_STATUS_LABEL, formatForeign } from "@/components/admin/purchasing-labels";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { purchaseOrders, vendors } from "@/db/schema";
import { PO_STATUSES, type PurchaseOrderStatus } from "@/db/schema/purchasing";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { lineTotals } from "@/server/purchasing/purchase-orders";

export const metadata = { title: "Purchase orders" };

const OPEN: PurchaseOrderStatus[] = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"];

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string; error?: string }> }) {
  await requireStaff("purchasing");
  const sp = await searchParams;
  const status = (PO_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as PurchaseOrderStatus) : sp.status === "all" ? "all" : "open";

  const rows = db
    .select({ po: purchaseOrders, vendor: vendors.name })
    .from(purchaseOrders)
    .innerJoin(vendors, eq(vendors.id, purchaseOrders.vendorId))
    .where(status === "all" ? undefined : status === "open" ? inArray(purchaseOrders.status, OPEN) : eq(purchaseOrders.status, status))
    .orderBy(desc(purchaseOrders.code))
    .limit(200)
    .all();
  const totals = lineTotals(db, rows.map((r) => r.po.id));

  return (
    <>
      <AdminHeader
        title="Purchase orders"
        description="Stock you’ve ordered from vendors. Receiving a PO is the normal way stock arrives."
        actions={
          <>
            <ButtonLink href="/admin/vendors" variant="outline">
              Vendors
            </ButtonLink>
            <ButtonLink href="/admin/purchase-orders/new">New purchase order</ButtonLink>
          </>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <form className="mb-6 flex max-w-md gap-3">
        <Select name="status" defaultValue={status} aria-label="Show">
          <option value="open">Open (draft, ordered, part received)</option>
          {PO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PO_STATUS_LABEL[s]}
            </option>
          ))}
          <option value="all">All</option>
        </Select>
        <Button type="submit" variant="outline">
          Show
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-midnight/70">No purchase orders to show.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>PO</TH>
              <TH>Vendor</TH>
              <TH>Status</TH>
              <TH className="text-right">Received / ordered</TH>
              <TH className="text-right">Goods value</TH>
              <TH>Expected</TH>
            </tr>
          </THead>
          <tbody>
            {rows.map(({ po, vendor }) => {
              const t = totals.get(po.id);
              return (
                <TR key={po.id}>
                  <TD>
                    <Link href={`/admin/purchase-orders/${po.id}`} className="font-semibold tabular hover:underline">
                      {po.code}
                    </Link>
                    <span className="block text-xs text-midnight/60">Raised {formatKarachi(po.createdAt)}</span>
                  </TD>
                  <TD>{vendor}</TD>
                  <TD>
                    <Status on={po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED" || po.status === "RECEIVED"} onLabel={PO_STATUS_LABEL[po.status]} offLabel={PO_STATUS_LABEL[po.status]} />
                  </TD>
                  <TD className="tabular text-right">{t ? `${t.received} / ${t.ordered}` : "0 / 0"}</TD>
                  <TD className="tabular text-right">{t ? formatForeign(t.valueForeign, po.currency) : "—"}</TD>
                  <TD className="text-midnight/75">{po.expectedAt ?? "—"}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
