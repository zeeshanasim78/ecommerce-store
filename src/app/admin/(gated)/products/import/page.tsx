import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { requireStaff } from "@/server/dal";
import { MAX_IMPORT_ROWS } from "@/server/catalog/product-csv";
import { importProducts } from "../actions";

export const metadata = { title: "Import products" };

export default async function ImportProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("catalog");
  const { error } = await searchParams;
  const errors = error?.split("\n") ?? [];

  return (
    <>
      <AdminHeader title="Import products from CSV" description="Add or update many screens at once from a spreadsheet." />
      {errors.length ? (
        <Notice tone="error">
          <span className="block">Nothing was imported. Fix {errors.length === 1 ? "this" : "these"} and upload again:</span>
          <span className="mt-2 block font-normal">
            {errors.map((e) => (
              <span key={e} className="block">
                {e}
              </span>
            ))}
          </span>
        </Notice>
      ) : null}

      <div className="flex flex-col gap-8">
        <Section title="1. Start from the export" description="The easiest way to get the right columns is to download your current products, edit them in Excel or Google Sheets, and save as CSV (UTF-8).">
          <div>
            <a href="/admin/products/export" className={buttonClasses("outline")} download>
              Download current products (CSV)
            </a>
          </div>
        </Section>

        <Section title="2. Rules">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] text-midnight/85">
            <li>One row per colour. Repeat the product’s details on each of its colour rows; they must match.</li>
            <li>
              Products are matched by <b>sku</b> and colours by <b>variant_sku</b>: existing ones are updated, new ones are added (leave variant_sku blank to number a new colour automatically).
            </li>
            <li>
              <b>brand</b> must already exist in Brands; <b>category</b> is the category’s web address (e.g. oled-screens) or blank.
            </li>
            <li>
              Stock is never changed by an import. <b>opening_stock</b> can set the first stock of a colour that has none yet; after that, use purchase orders or a stock count. The <b>current_stock</b> column is just for reference.
            </li>
            <li>
              <b>cost_price</b> is used only for new products. Existing products keep their average cost from purchase orders.
            </li>
            <li>Sale prices, photos and home-page flags are set on each product’s page.</li>
            <li>If any row has a problem, nothing is imported and you’ll see a list of rows to fix. Up to {MAX_IMPORT_ROWS.toLocaleString("en-PK")} rows, 1 MB.</li>
          </ul>
        </Section>

        <form action={importProducts}>
          <Section title="3. Upload">
            <Field id="file" label="CSV file">
              <input
                id="file"
                name="file"
                type="file"
                required
                accept=".csv,text/csv"
                className="rounded-full border border-midnight/18 bg-white px-4 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-midnight file:px-3 file:py-1 file:text-sm file:text-canvas"
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Import</Button>
              <ButtonLink href="/admin/products" variant="ghost">
                Cancel
              </ButtonLink>
            </div>
          </Section>
        </form>
      </div>
    </>
  );
}
