import { Section, Textarea } from "@/components/admin/ui";
import { COUNTRIES, CURRENCY_LABEL, PAYMENT_TERMS_LABEL } from "@/components/admin/purchasing-labels";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { vendors } from "@/db/schema";
import { PAYMENT_TERMS, VENDOR_CURRENCIES } from "@/db/schema/purchasing";
import { saveVendor } from "./actions";

type Vendor = typeof vendors.$inferSelect;

export function VendorForm({ vendor }: { vendor?: Vendor }) {
  const country = vendor?.country ?? "PK";
  return (
    <form action={saveVendor} className="flex flex-col gap-6">
      {vendor ? <input type="hidden" name="id" value={vendor.id} /> : null}
      <Section title="Who they are">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Name">
            <Input id="name" name="name" required minLength={2} maxLength={80} defaultValue={vendor?.name} placeholder="Shenzhen Display Co." />
          </Field>
          <Field id="code" label="Vendor code" hint={vendor ? undefined : "Leave blank to number it automatically (V-003)."}>
            <Input id="code" name="code" maxLength={16} pattern="[A-Za-z0-9\-]{2,16}" defaultValue={vendor?.code} className="tabular uppercase" />
          </Field>
          <Field id="contactPerson" label="Contact person">
            <Input id="contactPerson" name="contactPerson" maxLength={80} defaultValue={vendor?.contactPerson ?? ""} />
          </Field>
          <Field id="phone" label="Phone / WhatsApp">
            <Input id="phone" name="phone" type="tel" maxLength={30} defaultValue={vendor?.phone ?? ""} placeholder="+92 300 0000000" />
          </Field>
          <Field id="email" label="Email">
            <Input id="email" name="email" type="email" maxLength={120} defaultValue={vendor?.email ?? ""} />
          </Field>
          <Field id="city" label="City">
            <Input id="city" name="city" maxLength={60} defaultValue={vendor?.city ?? ""} />
          </Field>
          <Field id="country" label="Country">
            <Select id="country" name="country" defaultValue={country}>
              {COUNTRIES.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
              {COUNTRIES.some(([c]) => c === country) ? null : <option value={country}>{country}</option>}
            </Select>
          </Field>
          <Field id="brandsSupplied" label="Brands they supply" hint="Separate with commas.">
            <Input id="brandsSupplied" name="brandsSupplied" defaultValue={vendor?.brandsSupplied.join(", ")} placeholder="Samsung, Apple" />
          </Field>
        </div>
      </Section>

      <Section title="Buying terms" description="The currency is copied onto each new purchase order. Prices on the shop are always in rupees.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="currency" label="Invoice currency">
            <Select id="currency" name="currency" defaultValue={vendor?.currency ?? "PKR"}>
              {VENDOR_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="paymentTerms" label="Payment terms">
            <Select id="paymentTerms" name="paymentTerms" defaultValue={vendor?.paymentTerms ?? "ADVANCE"}>
              {PAYMENT_TERMS.map((t) => (
                <option key={t} value={t}>
                  {PAYMENT_TERMS_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="leadTimeDays" label="Lead time (days)" hint="Order to arrival. Used later for reorder suggestions.">
            <Input id="leadTimeDays" name="leadTimeDays" type="number" min={0} max={365} step={1} defaultValue={vendor?.leadTimeDays ?? 7} />
          </Field>
          <Field id="rating" label="Rating">
            <Select id="rating" name="rating" defaultValue={vendor?.rating?.toString() ?? ""}>
              <option value="">Not rated</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} of 5
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field id="notes" label="Notes (staff only)">
          <Textarea id="notes" name="notes" maxLength={2000} defaultValue={vendor?.notes ?? ""} />
        </Field>
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {vendor ? "Save vendor" : "Add vendor"}
        </Button>
        <ButtonLink href="/admin/vendors" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
