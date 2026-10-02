import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminHeader, Notice, Section, Status } from "@/components/admin/ui";
import { PO_STATUS_LABEL, formatForeign } from "@/components/admin/purchasing-labels";
import { Button, buttonClasses } from "@/components/ui/button";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { purchaseOrders, vendors } from "@/db/schema";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { lineTotals } from "@/server/purchasing/purchase-orders";
import { createPurchaseOrder } from "../../purchase-orders/actions";
import { setVendorArchived } from "../actions";
import { VendorForm } from "../vendor-form";

export const metadata = { title: "Vendor" };

export default async function VendorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("vendors");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const vendor = db.select().from(vendors).where(eq(vendors.id, id)).get();
  if (!vendor) notFound();
  const pos = db.select().from(purchaseOrders).where(eq(purchaseOrders.vendorId, id)).orderBy(desc(purchaseOrders.createdAt), desc(purchaseOrders.code)).all();
  const totals = lineTotals(db, pos.map((p) => p.id));

  return (
    <>
      <AdminHeader
        title={vendor.name}
        description={`${vendor.code} · invoices in ${vendor.currency}`}
        actions={
          vendor.archivedAt ? null : (
            <form action={createPurchaseOrder}>
              <input type="hidden" name="vendorId" value={vendor.id} />
              <Button type="submit">New purchase order</Button>
            </form>
          )
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {vendor.archivedAt ? <Notice tone="error">This vendor is archived. Restore them to raise new purchase orders.</Notice> : null}

      <div className="flex flex-col gap-8">
        <Section title="Purchase orders" description="Every PO raised with this vendor, newest first.">
          {pos.length === 0 ? (
            <p className="text-midnight/70">No purchase orders yet.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>PO</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Units</TH>
                  <TH className="text-right">Value</TH>
                  <TH>Raised</TH>
                </tr>
              </THead>
              <tbody>
                {pos.map((po) => {
                  const t = totals.get(po.id);
                  return (
                    <TR key={po.id}>
                      <TD>
                        <Link href={`/admin/purchase-orders/${po.id}`} className="font-semibold tabular hover:underline">
                          {po.code}
                        </Link>
                      </TD>
                      <TD>
                        <Status on={po.status !== "CANCELLED" && po.status !== "DRAFT"} onLabel={PO_STATUS_LABEL[po.status]} offLabel={PO_STATUS_LABEL[po.status]} />
                      </TD>
                      <TD className="tabular text-right">{t ? `${t.received} / ${t.ordered}` : "—"}</TD>
                      <TD className="tabular text-right">{t ? formatForeign(t.valueForeign, po.currency) : "—"}</TD>
                      <TD className="text-midnight/75">{formatKarachi(po.createdAt)}</TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Section>

        <VendorForm vendor={vendor} />

        <Section title={vendor.archivedAt ? "Restore vendor" : "Archive vendor"} description="Archived vendors are hidden from new purchase orders. Their history is kept.">
          <form action={setVendorArchived}>
            <input type="hidden" name="id" value={vendor.id} />
            <input type="hidden" name="archive" value={vendor.archivedAt ? "0" : "1"} />
            <button type="submit" className={buttonClasses(vendor.archivedAt ? "primary" : "outline")}>
              {vendor.archivedAt ? "Restore vendor" : "Archive vendor"}
            </button>
          </form>
        </Section>
      </div>
    </>
  );
}
