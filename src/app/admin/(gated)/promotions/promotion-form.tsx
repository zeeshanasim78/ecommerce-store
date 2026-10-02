import { asc, isNull } from "drizzle-orm";
import { Section, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { brands, categories, products, type promotions } from "@/db/schema";
import { isoToKarachiInput } from "@/lib/time";
import { displayAmount } from "@/server/discount-forms";
import { savePromotion } from "./actions";

type Promotion = typeof promotions.$inferSelect;

/** Discount type + amount + window, shared by promotions and coupons. */
export function DiscountFields({ discountType, value, startsAt, endsAt }: { discountType?: string; value?: number; startsAt?: string; endsAt?: string }) {
  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 864e5);
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="discountType" label="Discount type">
          <Select id="discountType" name="discountType" defaultValue={discountType ?? "PERCENT"}>
            <option value="PERCENT">Percentage off (%)</option>
            <option value="FIXED">Fixed amount off (Rs)</option>
          </Select>
        </Field>
        <Field id="amount" label="Amount" hint="For percentage, 15 means 15%. For fixed, 500 means Rs 500.">
          <Input id="amount" name="amount" type="number" inputMode="decimal" min={0.01} step="0.01" required defaultValue={value ? displayAmount(value) : ""} aria-describedby="amount-hint" />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="startsAt" label="Starts (Pakistan time)">
          <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={isoToKarachiInput(startsAt ?? now.toISOString())} />
        </Field>
        <Field id="endsAt" label="Ends (Pakistan time)">
          <Input id="endsAt" name="endsAt" type="datetime-local" required defaultValue={isoToKarachiInput(endsAt ?? inAWeek.toISOString())} />
        </Field>
      </div>
    </>
  );
}

export function PromotionForm({ promotion }: { promotion?: Promotion }) {
  const brandList = db.select({ name: brands.name }).from(brands).orderBy(asc(brands.name)).all();
  const categoryList = db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)).all();
  const productList = db.select({ id: products.id, brand: products.brand, model: products.model, grade: products.qualityGrade }).from(products).where(isNull(products.archivedAt)).orderBy(asc(products.brand), asc(products.model)).all();
  const scopeValue = promotion?.scopeValue ?? "";

  return (
    <form action={savePromotion} className="flex flex-col gap-6">
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}
      <Section title="Promotion">
        <Field id="name" label="Name (staff only)">
          <Input id="name" name="name" required minLength={3} maxLength={80} placeholder="Eid OLED sale" defaultValue={promotion?.name} />
        </Field>
        <DiscountFields discountType={promotion?.discountType} value={promotion?.value} startsAt={promotion?.startsAt} endsAt={promotion?.endsAt} />
      </Section>

      <Section title="Applies to" description="Pick one. The shop always shows each screen’s lowest available price.">
        <Field id="scope" label="Products covered">
          <Select id="scope" name="scope" defaultValue={promotion?.scope ?? "ALL"}>
            <option value="ALL">Every screen in the shop</option>
            <option value="BRAND">One brand (choose below)</option>
            <option value="CATEGORY">One category (choose below)</option>
            <option value="PRODUCT">One product (choose below)</option>
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="scopeBrand" label="Brand">
            <Select id="scopeBrand" name="scopeBrand" defaultValue={promotion?.scope === "BRAND" ? scopeValue : ""}>
              <option value="">—</option>
              {brandList.map((b) => (
                <option key={b.name}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field id="scopeCategory" label="Category">
            <Select id="scopeCategory" name="scopeCategory" defaultValue={promotion?.scope === "CATEGORY" ? scopeValue : ""}>
              <option value="">—</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="scopeProduct" label="Product">
            <Select id="scopeProduct" name="scopeProduct" defaultValue={promotion?.scope === "PRODUCT" ? scopeValue : ""}>
              <option value="">—</option>
              {productList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.model} ({p.grade})
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="On the storefront">
        <Field id="bannerText" label="Banner and badge text" hint="Shown in the site-wide banner and on discounted product cards, e.g. “Eid sale: 10% off every OLED screen”.">
          <Input id="bannerText" name="bannerText" maxLength={120} defaultValue={promotion?.bannerText ?? ""} aria-describedby="bannerText-hint" />
        </Field>
        <Toggle name="showBanner" label="Show in the site-wide banner" hint="The banner sits above the menu on every page while the promotion runs." defaultChecked={promotion?.showBanner ?? false} />
        <Toggle name="isActive" label="Active" hint="Switch off to pause the promotion without deleting it." defaultChecked={promotion?.isActive ?? true} />
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {promotion ? "Save promotion" : "Create promotion"}
        </Button>
        <ButtonLink href="/admin/promotions" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
