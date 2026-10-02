import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminHeader, ConfirmDelete, Notice, Status } from "@/components/admin/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { categories, products, promotions } from "@/db/schema";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { describeDiscount, discountStatus } from "@/server/discount-status";
import { deletePromotion } from "./actions";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("discounts");
  const { saved, error } = await searchParams;
  const rows = db.select().from(promotions).orderBy(desc(promotions.startsAt)).all();
  const categoryNames = new Map(db.select({ id: categories.id, name: categories.name }).from(categories).all().map((c) => [c.id, c.name]));
  const productNames = new Map(db.select({ id: products.id, brand: products.brand, model: products.model }).from(products).all().map((p) => [p.id, `${p.brand} ${p.model}`]));
  const target = (p: (typeof rows)[number]) =>
    p.scope === "ALL" ? "every screen" : p.scope === "BRAND" ? `${p.scopeValue} screens` : p.scope === "CATEGORY" ? `category “${categoryNames.get(p.scopeValue ?? "") ?? "deleted"}”` : productNames.get(p.scopeValue ?? "") ?? "a deleted product";

  return (
    <>
      <AdminHeader
        title="Promotions"
        description="Automatic discounts on product prices. Shoppers see the original price struck through and the lower price beside it."
        actions={<ButtonLink href="/admin/promotions/new">New promotion</ButtonLink>}
      />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {rows.length === 0 ? (
        <p className="text-midnight/70">No promotions yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((p) => {
            const status = discountStatus(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-midnight/65">
                    {describeDiscount(p)} {target(p)}, {formatKarachi(p.startsAt)} to {formatKarachi(p.endsAt)}
                    {p.showBanner ? ", in the site banner" : ""}
                  </p>
                </div>
                <Status on={status === "Running"} onLabel="Running" offLabel={status} />
                <Link href={`/admin/promotions/${p.id}`} className={buttonClasses("primary", "sm")}>
                  Edit
                </Link>
                <ConfirmDelete action={deletePromotion} id={p.id} what={`“${p.name}”`} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
