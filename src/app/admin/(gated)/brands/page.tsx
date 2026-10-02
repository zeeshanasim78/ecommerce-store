import Image from "next/image";
import { asc, count, eq } from "drizzle-orm";
import { AdminHeader, ConfirmDelete, Notice, Status, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/db/client";
import { brands, products } from "@/db/schema";
import { requireStaff } from "@/server/dal";
import { deleteBrand, saveBrand } from "./actions";

export const metadata = { title: "Brands" };

type Brand = typeof brands.$inferSelect;

function BrandFields({ b }: { b?: Brand }) {
  const p = b ? `-${b.id}` : "-new";
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_6rem_1.6fr]">
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`name${p}`}>
        Name
        <Input id={`name${p}`} name="name" required maxLength={40} defaultValue={b?.name} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`slug${p}`}>
        Web address
        <Input id={`slug${p}`} name="slug" maxLength={40} placeholder="made from the name" defaultValue={b?.slug} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`sortOrder${p}`}>
        Order
        <Input id={`sortOrder${p}`} name="sortOrder" type="number" min={0} max={999} defaultValue={b?.sortOrder ?? 0} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`logo${p}`}>
        Logo (optional)
        <input
          id={`logo${p}`}
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="rounded-full border border-midnight/18 bg-white px-4 py-2 text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-midnight file:px-3 file:py-1 file:text-sm file:text-canvas"
        />
      </label>
    </div>
  );
}

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("catalog");
  const { saved, error } = await searchParams;
  const rows = db
    .select({ b: brands, n: count(products.id) })
    .from(brands)
    .leftJoin(products, eq(products.brand, brands.name))
    .groupBy(brands.id)
    .orderBy(asc(brands.sortOrder), asc(brands.name))
    .all();

  return (
    <>
      <AdminHeader title="Brands" description="Phone makers you stock. Renaming a brand renames it on all its products. Brands in use can be hidden but not deleted." />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <form action={saveBrand} className="mb-10 flex flex-col gap-4 rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
        <h2 className="font-sans text-lg font-semibold">Add a brand</h2>
        <BrandFields />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Toggle name="isActive" label="Visible on the storefront" defaultChecked />
          <Button type="submit">Add brand</Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {rows.map(({ b, n }) => (
          <details key={b.id} className="group rounded-bezel bg-white ring-1 ring-midnight/8">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
              {b.logoUrl ? <Image src={b.logoUrl} alt="" width={32} height={32} className="size-8 rounded-full object-contain" /> : null}
              <span className="min-w-0 flex-1 font-semibold">{b.name}</span>
              <span className="text-sm text-midnight/65">{n} products</span>
              <Status on={b.isActive} onLabel="Visible" />
              <span className="text-sm font-semibold underline underline-offset-4 group-open:hidden">Edit</span>
            </summary>
            <div className="border-t border-midnight/8 p-5">
              <form action={saveBrand} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={b.id} />
                <BrandFields b={b} />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Toggle name="isActive" label="Visible on the storefront" defaultChecked={b.isActive} />
                  <Button type="submit">Save</Button>
                </div>
              </form>
              <div className="mt-3 flex justify-end">
                <ConfirmDelete action={deleteBrand} id={b.id} what={`“${b.name}”`} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
