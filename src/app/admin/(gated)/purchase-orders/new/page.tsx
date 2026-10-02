import { asc, isNull } from "drizzle-orm";
import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { vendors } from "@/db/schema";
import { requireStaff } from "@/server/dal";
import { createPurchaseOrder } from "../actions";

export const metadata = { title: "New purchase order" };

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("purchasing");
  const { error } = await searchParams;
  const list = db.select({ id: vendors.id, name: vendors.name, code: vendors.code, currency: vendors.currency }).from(vendors).where(isNull(vendors.archivedAt)).orderBy(asc(vendors.name)).all();

  return (
    <>
      <AdminHeader title="New purchase order" description="Start a draft for one vendor, then add the screens you’re ordering." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {list.length === 0 ? (
        <Section title="Add a vendor first">
          <p className="text-midnight/70">Purchase orders belong to a vendor.</p>
          <div>
            <ButtonLink href="/admin/vendors/new">New vendor</ButtonLink>
          </div>
        </Section>
      ) : (
        <form action={createPurchaseOrder}>
          <Section title="Vendor">
            <Field id="vendorId" label="Who are you ordering from?">
              <Select id="vendorId" name="vendorId" required defaultValue="">
                <option value="" disabled>
                  Choose a vendor
                </option>
                {list.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code}, {v.currency})
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <Button type="submit">Create draft</Button>
            </div>
          </Section>
        </form>
      )}
    </>
  );
}
