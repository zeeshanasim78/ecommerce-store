import { asc, count, eq } from "drizzle-orm";
import { AdminHeader, ConfirmDelete, Notice, Status, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/db/client";
import { categories, products } from "@/db/schema";
import { requireStaff } from "@/server/dal";
import { deleteCategory, saveCategory } from "./actions";

export const metadata = { title: "Categories" };

type Category = typeof categories.$inferSelect;

function CategoryFields({ c }: { c?: Category }) {
  const p = c ? `-${c.id}` : "-new";
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_2fr_6rem]">
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`name${p}`}>
        Name
        <Input id={`name${p}`} name="name" required maxLength={60} defaultValue={c?.name} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`slug${p}`}>
        Web address
        <Input id={`slug${p}`} name="slug" maxLength={60} placeholder="made from the name" defaultValue={c?.slug} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`description${p}`}>
        Short description
        <Input id={`description${p}`} name="description" maxLength={240} defaultValue={c?.description ?? ""} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`sortOrder${p}`}>
        Order
        <Input id={`sortOrder${p}`} name="sortOrder" type="number" min={0} max={999} defaultValue={c?.sortOrder ?? 0} />
      </label>
    </div>
  );
}

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("catalog");
  const { saved, error } = await searchParams;
  const rows = db
    .select({ c: categories, n: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
    .all();

  return (
    <>
      <AdminHeader title="Categories" description="Group screens so shoppers can browse by type. Shown on /categories and as catalogue filters." />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <form action={saveCategory} className="mb-10 flex flex-col gap-4 rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
        <h2 className="font-sans text-lg font-semibold">Add a category</h2>
        <CategoryFields />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Toggle name="isActive" label="Visible on the storefront" defaultChecked />
          <Button type="submit">Add category</Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {rows.map(({ c, n }) => (
          <details key={c.id} className="group rounded-bezel bg-white ring-1 ring-midnight/8">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{c.name}</span> <span className="text-sm text-midnight/60">/{c.slug}</span>
              </span>
              <span className="text-sm text-midnight/65">{n} products</span>
              <Status on={c.isActive} onLabel="Visible" />
              <span className="text-sm font-semibold underline underline-offset-4 group-open:hidden">Edit</span>
            </summary>
            <div className="border-t border-midnight/8 p-5">
              <form action={saveCategory} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={c.id} />
                <CategoryFields c={c} />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Toggle name="isActive" label="Visible on the storefront" defaultChecked={c.isActive} />
                  <Button type="submit">Save</Button>
                </div>
              </form>
              <div className="mt-3 flex justify-end">
                <ConfirmDelete action={deleteCategory} id={c.id} what={`“${c.name}”`} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
