import { asc } from "drizzle-orm";
import { Section, Textarea, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { brands, categories, type products } from "@/db/schema";
import { isoToKarachiInput } from "@/lib/time";
import { saveProduct } from "./actions";

type Product = typeof products.$inferSelect;

const GRADES = ["OEM Original", "OLED A Grade", "Compatible Soft OLED", "Compatible A Grade", "Compatible Incell"];
const DISPLAYS = ["Dynamic AMOLED 2X", "Super AMOLED", "AMOLED", "OLED", "Super Retina XDR OLED", "IPS LCD", "PLS LCD", "TFT LCD"];

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

/** Add / edit product. Stock is not edited here — it only changes through the stock ledger (spec §0.4). */
export function ProductForm({ product }: { product?: Product }) {
  const brandList = db.select({ name: brands.name }).from(brands).orderBy(asc(brands.sortOrder), asc(brands.name)).all();
  const categoryList = db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)).all();

  return (
    <form action={saveProduct} className="flex flex-col gap-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <datalist id="grades">{GRADES.map((g) => <option key={g} value={g} />)}</datalist>
      <datalist id="displays">{DISPLAYS.map((d) => <option key={d} value={d} />)}</datalist>

      <Section title="Screen details">
        <Row>
          <Field id="brand" label="Brand" hint="Missing? Add it under Brands first.">
            <Select id="brand" name="brand" required defaultValue={product?.brand ?? ""} aria-describedby="brand-hint">
              <option value="" disabled>
                Choose a brand
              </option>
              {brandList.map((b) => (
                <option key={b.name}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field id="model" label="Phone model">
            <Input id="model" name="model" required maxLength={80} placeholder="Galaxy A54 5G" defaultValue={product?.model} />
          </Field>
        </Row>
        <Row>
          <Field id="displayType" label="Display type">
            <Input id="displayType" name="displayType" list="displays" required maxLength={60} defaultValue={product?.displayType} />
          </Field>
          <Field id="qualityGrade" label="Quality grade">
            <Input id="qualityGrade" name="qualityGrade" list="grades" required maxLength={60} defaultValue={product?.qualityGrade} />
          </Field>
        </Row>
        <Row>
          <Field id="sku" label="SKU" hint="Capital letters, numbers and dashes, e.g. CA-SAM-GA545G-OEM.">
            <Input id="sku" name="sku" required pattern="[A-Za-z0-9\-]{3,40}" defaultValue={product?.sku} aria-describedby="sku-hint" />
          </Field>
          <Field id="categoryId" label="Category">
            <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""}>
              <option value="">No category</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </Row>
        <Field id="description" label="Description (optional)">
          <Textarea id="description" name="description" maxLength={2000} defaultValue={product?.description ?? ""} />
        </Field>
        <Row>
          <Field id="compatibility" label="Fits model codes" hint="Separate with commas, e.g. SM-A546E, SM-A546E/DS">
            <Input id="compatibility" name="compatibility" defaultValue={product?.compatibility.join(", ")} aria-describedby="compatibility-hint" />
          </Field>
          <Field id="featureTags" label="Feature tags (up to 6)" hint="Short labels on product cards, e.g. In-display fingerprint, 120 Hz">
            <Input id="featureTags" name="featureTags" defaultValue={product?.featureTags.join(", ")} aria-describedby="featureTags-hint" />
          </Field>
        </Row>
        <Row>
          <Field id="slug" label="Web address" hint="Leave blank to make one from brand, model and grade.">
            <Input id="slug" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={product?.slug} aria-describedby="slug-hint" />
          </Field>
          <Field id="warrantyDays" label="Warranty (days)">
            <Input id="warrantyDays" name="warrantyDays" type="number" min={0} max={365} required defaultValue={product?.warrantyDays ?? 7} />
          </Field>
        </Row>
      </Section>

      {product ? null : (
        <Section title="First colour" description="Add more colours after saving. Stock starts at 0 and arrives through purchase orders.">
          <Row>
            <Field id="color" label="Colour">
              <Input id="color" name="color" required maxLength={40} placeholder="Black" />
            </Field>
            <Field id="variantLabel" label="Variant label (optional)">
              <Input id="variantLabel" name="variantLabel" maxLength={40} placeholder="With Frame" />
            </Field>
          </Row>
          <Field id="binLocation" label="Shelf location (optional)">
            <Input id="binLocation" name="binLocation" maxLength={20} placeholder="A1-03" />
          </Field>
        </Section>
      )}

      <Section title="Prices (PKR)" description="All prices are in Pakistani rupees.">
        <Row>
          <Field id="retailPricePKR" label="Retail price">
            <Input id="retailPricePKR" name="retailPricePKR" type="number" inputMode="decimal" min={1} step="0.01" required defaultValue={product?.retailPricePKR} />
          </Field>
          <Field id="wholesalePricePKR" label="Wholesale price (approved technicians)">
            <Input id="wholesalePricePKR" name="wholesalePricePKR" type="number" inputMode="decimal" min={1} step="0.01" required defaultValue={product?.wholesalePricePKR} />
          </Field>
        </Row>
        <Row>
          <Field id="costPrice" label="Cost price" hint="Purchase orders will keep this updated from Milestone 6.">
            <Input id="costPrice" name="costPrice" type="number" inputMode="decimal" min={0} step="0.01" required defaultValue={product?.costPrice ?? 0} aria-describedby="costPrice-hint" />
          </Field>
          <Field id="lowStockThreshold" label="Low-stock alert at">
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} max={1000} required defaultValue={product?.lowStockThreshold ?? 5} />
          </Field>
        </Row>
      </Section>

      <Section title="Sale price (optional)" description="Shows the retail price struck through with the sale price beside it. Leave the price empty for no sale. Times are Pakistan time.">
        <Row>
          <Field id="salePricePKR" label="Sale price">
            <Input id="salePricePKR" name="salePricePKR" type="number" inputMode="decimal" min={1} step="0.01" defaultValue={product?.salePricePKR ?? ""} />
          </Field>
          <div />
        </Row>
        <Row>
          <Field id="saleStartsAt" label="Starts (optional)">
            <Input id="saleStartsAt" name="saleStartsAt" type="datetime-local" defaultValue={isoToKarachiInput(product?.saleStartsAt)} />
          </Field>
          <Field id="saleEndsAt" label="Ends (optional)">
            <Input id="saleEndsAt" name="saleEndsAt" type="datetime-local" defaultValue={isoToKarachiInput(product?.saleEndsAt)} />
          </Field>
        </Row>
      </Section>

      <Section title="Visibility">
        <Toggle name="isPublished" label="Published" hint="Shown in the shop. Unpublished products stay in admin only." defaultChecked={product?.isPublished ?? false} />
        <Toggle name="isFeatured" label="Featured on the home page" hint="Appears in the product cards section." defaultChecked={product?.isFeatured ?? false} />
        <Toggle
          name="isFeaturedHero"
          label="Featured on Hero"
          hint="Adds a slide for this screen to the home-page carousel (max 5 live slides)."
          defaultChecked={product?.isFeaturedHero ?? false}
        />
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {product ? "Save product" : "Create product"}
        </Button>
        <ButtonLink href="/admin/products" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
