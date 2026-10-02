import Image from "next/image";
import Link from "next/link";
import { and, asc, eq, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { AdminHeader, Notice, Status } from "@/components/admin/ui";
import { GradeBadge } from "@/components/ui/badge";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { brands, categories, productImages, productVariants, products } from "@/db/schema";
import { formatMoney, toPaisa } from "@/lib/money";
import { requireStaff } from "@/server/dal";

export const metadata = { title: "Products" };

type Search = { q?: string; brand?: string; show?: string; saved?: string; error?: string };

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff("catalog");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 60);
  const show = sp.show === "archived" ? "archived" : sp.show === "all" ? "all" : "active";

  const firstImage = db
    .select({ productId: productImages.productId, url: sql<string>`min(printf('%05d', ${productImages.sortOrder}) || '|' || ${productImages.url})`.as("url") })
    .from(productImages)
    .groupBy(productImages.productId)
    .as("first_image");

  const rows = db
    .select({
      id: products.id,
      brand: products.brand,
      model: products.model,
      grade: products.qualityGrade,
      sku: products.sku,
      retail: products.retailPricePKR,
      sale: products.salePricePKR,
      isPublished: products.isPublished,
      isFeatured: products.isFeatured,
      isFeaturedHero: products.isFeaturedHero,
      archivedAt: products.archivedAt,
      category: categories.name,
      stock: sql<number>`coalesce((select sum(${productVariants.currentStock}) from ${productVariants} where ${productVariants.productId} = ${products.id}), 0)`,
      image: firstImage.url,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(firstImage, eq(firstImage.productId, products.id))
    .where(
      and(
        show === "active" ? isNull(products.archivedAt) : show === "archived" ? isNotNull(products.archivedAt) : undefined,
        sp.brand ? eq(products.brand, sp.brand) : undefined,
        q ? or(like(products.model, `%${q}%`), like(products.sku, `%${q}%`), like(products.brand, `%${q}%`)) : undefined,
      ),
    )
    .orderBy(asc(products.brand), asc(products.model))
    .all();
  const brandList = db.select({ name: brands.name }).from(brands).orderBy(asc(brands.name)).all();

  return (
    <>
      <AdminHeader title="Products" description="Screens in the catalogue, their photos, prices and storefront flags." actions={
          <>
            <a href="/admin/products/export" className={buttonClasses("outline")} download>
              Export CSV
            </a>
            <ButtonLink href="/admin/products/import" variant="outline">
              Import CSV
            </ButtonLink>
            <ButtonLink href="/admin/products/new">New product</ButtonLink>
          </>
        } />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <form className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]" role="search">
        <Input name="q" placeholder="Search model, brand or SKU" defaultValue={q} aria-label="Search products" />
        <Select name="brand" defaultValue={sp.brand ?? ""} aria-label="Brand">
          <option value="">All brands</option>
          {brandList.map((b) => (
            <option key={b.name}>{b.name}</option>
          ))}
        </Select>
        <Select name="show" defaultValue={show} aria-label="Show">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-midnight/70">No products match. Clear the filters or add a new product.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Screen</TH>
              <TH>Grade</TH>
              <TH className="text-right">Price</TH>
              <TH className="text-right">Stock</TH>
              <TH>Shop</TH>
            </tr>
          </THead>
          <tbody>
            {rows.map((p) => {
              const img = p.image?.split("|")[1];
              return (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:underline">
                      {img ? (
                        <Image src={img} alt="" width={44} height={44} className="size-11 rounded-xl bg-surface object-contain" />
                      ) : (
                        <span className="size-11 shrink-0 rounded-xl bg-surface" aria-hidden="true" />
                      )}
                      <span>
                        <span className="block text-sm text-midnight/60">{p.brand}</span>
                        <span className="font-semibold">{p.model}</span>
                        <span className="block text-xs text-midnight/55">
                          {p.sku}
                          {p.category ? ` — ${p.category}` : ""}
                        </span>
                      </span>
                    </Link>
                  </TD>
                  <TD>
                    <GradeBadge grade={p.grade} className="whitespace-nowrap" />
                  </TD>
                  <TD className="tabular text-right whitespace-nowrap">
                    {p.sale !== null ? (
                      <>
                        <span className="block text-sm text-midnight/50 line-through">{formatMoney(toPaisa(p.retail))}</span>
                        <span className="font-semibold text-terracotta">{formatMoney(toPaisa(p.sale))}</span>
                      </>
                    ) : (
                      <span className="font-semibold">{formatMoney(toPaisa(p.retail))}</span>
                    )}
                  </TD>
                  <TD className="tabular text-right font-semibold">{p.stock}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1.5">
                      {p.archivedAt ? <Status on={false} offLabel="Archived" /> : <Status on={p.isPublished} onLabel="Published" offLabel="Draft" />}
                      {p.isFeatured ? <Status on onLabel="Home" /> : null}
                      {p.isFeaturedHero ? <Status on onLabel="Hero" /> : null}
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
