import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminHeader, ConfirmDelete, Notice, Section } from "@/components/admin/ui";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { productImages, productVariants, products } from "@/db/schema";
import { IMAGE_ANGLES } from "@/db/schema/catalog";
import { formatMoney, toPaisa } from "@/lib/money";
import { requireStaff } from "@/server/dal";
import { effectivePrice } from "@/server/pricing/price";
import { getActivePromotions } from "@/server/storefront/catalog";
import { addVariant, deleteImage, moveImage, setArchived, updateImage, uploadImages } from "../actions";
import { ProductForm } from "../product-form";

export const metadata = { title: "Edit product" };

const ANGLE_LABEL: Record<(typeof IMAGE_ANGLES)[number], string> = { FRONT: "Front", BACK: "Back", SIDE: "Side", DETAIL: "Detail" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("catalog");
  const [{ id }, { saved, error }] = await Promise.all([params, searchParams]);
  const product = db.select().from(products).where(eq(products.id, id)).get();
  if (!product) notFound();
  const variants = db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.variantSku)).all();
  const images = db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)).all();

  const price = effectivePrice(
    {
      productId: product.id,
      brand: product.brand,
      categoryId: product.categoryId,
      retailPaisa: toPaisa(product.retailPricePKR),
      salePaisa: product.salePricePKR === null ? null : toPaisa(product.salePricePKR),
      saleStartsAt: product.saleStartsAt,
      saleEndsAt: product.saleEndsAt,
    },
    getActivePromotions(),
  );

  return (
    <>
      <AdminHeader
        title={`${product.brand} ${product.model}`}
        description={`${product.qualityGrade}, SKU ${product.sku}`}
        actions={
          product.isPublished && !product.archivedAt ? (
            <Link href={`/store/${product.slug}`} className={buttonClasses("outline")} target="_blank">
              View in shop
            </Link>
          ) : null
        }
      />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {product.archivedAt ? <Notice tone="error">This product is archived and hidden from the shop.</Notice> : null}

      <div className="mb-6 rounded-bezel bg-surface p-5 text-[0.9375rem]">
        <span className="font-semibold">Shoppers pay right now: </span>
        {price.isDiscounted ? (
          <>
            <span className="text-midnight/50 line-through">{formatMoney(price.originalPaisa)}</span>{" "}
            <span className="font-bold text-terracotta">{formatMoney(price.finalPaisa)}</span>{" "}
            <span className="text-midnight/70">
              ({price.percentOff}% off from {price.source === "SALE" ? "this product’s sale price" : `the promotion “${price.promotion?.name}”`})
            </span>
          </>
        ) : (
          <span className="font-bold">{formatMoney(price.finalPaisa)}</span>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <ProductForm product={product} />

        <Section title="Photos" description="2–3 photos per screen work best: front, back and side. The first photo is the card image; hovering shows the next one.">
          {images.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, i) => (
                <li key={img.id} className="flex flex-col gap-3 rounded-bezel-sm bg-canvas p-3 ring-1 ring-midnight/8">
                  <Image src={img.url} alt={img.alt} width={400} height={400} className="aspect-square w-full rounded-bezel-sm bg-white object-contain" />
                  <form action={updateImage} className="flex flex-col gap-2">
                    <input type="hidden" name="id" value={img.id} />
                    <Input name="alt" aria-label="Photo description" defaultValue={img.alt} maxLength={140} required className="h-9 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <Select name="angle" aria-label="Angle" defaultValue={img.angle} className="h-9 text-sm">
                        {IMAGE_ANGLES.map((a) => (
                          <option key={a} value={a}>
                            {ANGLE_LABEL[a]}
                          </option>
                        ))}
                      </Select>
                      <Select name="variantId" aria-label="Colour" defaultValue={img.variantId ?? ""} className="h-9 text-sm">
                        <option value="">All colours</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.color}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <button type="submit" className={buttonClasses("outline", "sm")}>
                      Save details
                    </button>
                  </form>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={moveImage}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" disabled={i === 0} className={buttonClasses("ghost", "sm")}>
                        Earlier
                      </button>
                    </form>
                    <form action={moveImage}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" disabled={i === images.length - 1} className={buttonClasses("ghost", "sm")}>
                        Later
                      </button>
                    </form>
                    <span className="ml-auto">
                      <ConfirmDelete action={deleteImage} id={img.id} what="this photo" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-midnight/70">No photos yet. The shop shows a drawn placeholder until you add some.</p>
          )}

          <form action={uploadImages} className="grid gap-4 rounded-bezel-sm border border-dashed border-midnight/25 p-5 md:grid-cols-2">
            <input type="hidden" name="productId" value={product.id} />
            <Field id="images" label="Add photos" hint="Up to 6 at once. JPG, PNG, WebP or AVIF, 5 MB each.">
              <input
                id="images"
                name="images"
                type="file"
                multiple
                required
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="rounded-full border border-midnight/18 bg-white px-4 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-midnight file:px-3 file:py-1 file:text-sm file:text-canvas"
              />
            </Field>
            <Field id="alt" label="Description" hint="Read aloud by screen readers.">
              <Input id="alt" name="alt" maxLength={140} defaultValue={`${product.brand} ${product.model} screen`} />
            </Field>
            <Field id="angle" label="Angle">
              <Select id="angle" name="angle" defaultValue="FRONT">
                {IMAGE_ANGLES.map((a) => (
                  <option key={a} value={a}>
                    {ANGLE_LABEL[a]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="variantId" label="Colour">
              <Select id="variantId" name="variantId" defaultValue="">
                <option value="">All colours</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.color}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Button type="submit">Upload photos</Button>
            </div>
          </form>
        </Section>

        <Section title="Colours and stock" description="Stock can’t be typed in here: it changes only through purchase orders, sales, returns and stock counts, so every unit is traceable in the stock ledger.">
          <Table>
            <THead>
              <tr>
                <TH>Colour</TH>
                <TH>Variant SKU</TH>
                <TH>Shelf</TH>
                <TH className="text-right">In stock</TH>
              </tr>
            </THead>
            <tbody>
              {variants.map((v) => (
                <TR key={v.id}>
                  <TD className="font-semibold">
                    {v.color}
                    {v.variantLabel ? <span className="font-normal text-midnight/65"> ({v.variantLabel})</span> : null}
                  </TD>
                  <TD className="tabular text-midnight/75">{v.variantSku}</TD>
                  <TD className="text-midnight/75">{v.binLocation ?? "—"}</TD>
                  <TD className={`tabular text-right font-semibold ${v.currentStock <= product.lowStockThreshold ? "text-terracotta" : ""}`}>{v.currentStock}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <form action={addVariant} className="grid gap-4 sm:grid-cols-[1fr_1fr_0.7fr_auto] sm:items-end">
            <input type="hidden" name="productId" value={product.id} />
            <Field id="color" label="New colour">
              <Input id="color" name="color" required maxLength={40} />
            </Field>
            <Field id="variantLabel" label="Label (optional)">
              <Input id="variantLabel" name="variantLabel" maxLength={40} placeholder="With Frame" />
            </Field>
            <Field id="binLocation" label="Shelf (optional)">
              <Input id="binLocation" name="binLocation" maxLength={20} />
            </Field>
            <Button type="submit" variant="outline">
              Add colour
            </Button>
          </form>
        </Section>

        <Section title={product.archivedAt ? "Restore product" : "Archive product"} description="Archived products disappear from the shop but keep their stock history, which can never be deleted.">
          <form action={setArchived}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="archive" value={product.archivedAt ? "0" : "1"} />
            <button type="submit" className={buttonClasses(product.archivedAt ? "primary" : "outline")}>
              {product.archivedAt ? "Restore product" : "Archive product"}
            </button>
          </form>
        </Section>
      </div>
    </>
  );
}
