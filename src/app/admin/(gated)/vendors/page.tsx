import Link from "next/link";
import { asc, isNotNull, isNull, sql } from "drizzle-orm";
import { AdminHeader, Notice, Status } from "@/components/admin/ui";
import { PAYMENT_TERMS_LABEL } from "@/components/admin/purchasing-labels";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { purchaseOrders, vendors } from "@/db/schema";
import { requireStaff } from "@/server/dal";

export const metadata = { title: "Vendors" };

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ show?: string; saved?: string; error?: string }> }) {
  await requireStaff("vendors");
  const sp = await searchParams;
  const archived = sp.show === "archived";
  const rows = db
    .select({
      v: vendors,
      openPos: sql<number>`(select count(*) from ${purchaseOrders} where ${purchaseOrders.vendorId} = ${vendors.id} and ${purchaseOrders.status} in ('DRAFT','ORDERED','PARTIALLY_RECEIVED'))`,
    })
    .from(vendors)
    .where(archived ? isNotNull(vendors.archivedAt) : isNull(vendors.archivedAt))
    .orderBy(asc(vendors.name))
    .all();

  return (
    <>
      <AdminHeader
        title="Vendors"
        description="Suppliers you buy screens from, their terms and their purchase orders."
        actions={
          <>
            <ButtonLink href="/admin/purchase-orders" variant="outline">
              Purchase orders
            </ButtonLink>
            <ButtonLink href="/admin/vendors/new">New vendor</ButtonLink>
          </>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <form className="mb-6 flex max-w-sm gap-3">
        <Select name="show" defaultValue={archived ? "archived" : "active"} aria-label="Show">
          <option value="active">Active vendors</option>
          <option value="archived">Archived vendors</option>
        </Select>
        <Button type="submit" variant="outline">
          Show
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-midnight/70">{archived ? "No archived vendors." : "No vendors yet. Add the suppliers you buy from."}</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Vendor</TH>
              <TH>Country</TH>
              <TH>Terms</TH>
              <TH className="text-right">Lead time</TH>
              <TH className="text-right">Open POs</TH>
            </tr>
          </THead>
          <tbody>
            {rows.map(({ v, openPos }) => (
              <TR key={v.id}>
                <TD>
                  <Link href={`/admin/vendors/${v.id}`} className="font-semibold hover:underline">
                    {v.name}
                  </Link>
                  <span className="block text-xs text-midnight/60 tabular">
                    {v.code}
                    {v.brandsSupplied.length ? ` — ${v.brandsSupplied.join(", ")}` : ""}
                  </span>
                </TD>
                <TD className="text-midnight/80">
                  {v.city ? `${v.city}, ` : ""}
                  {v.country}
                </TD>
                <TD className="text-midnight/80">
                  {PAYMENT_TERMS_LABEL[v.paymentTerms]}
                  <span className="block text-xs text-midnight/60">Invoices in {v.currency}</span>
                </TD>
                <TD className="tabular text-right">{v.leadTimeDays} days</TD>
                <TD className="text-right">{openPos > 0 ? <Status on onLabel={String(openPos)} /> : <span className="text-midnight/50">0</span>}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
