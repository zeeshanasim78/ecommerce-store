import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminHeader, ConfirmDelete, Notice, Status } from "@/components/admin/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { coupons } from "@/db/schema";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { describeDiscount, discountStatus } from "@/server/discount-status";
import { deleteCoupon } from "./actions";

export const metadata = { title: "Coupons" };

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("discounts");
  const { saved, error } = await searchParams;
  const rows = db.select().from(coupons).orderBy(desc(coupons.createdAt)).all();

  return (
    <>
      <AdminHeader
        title="Coupons"
        description="Codes shoppers enter at checkout. Each use is counted the moment an order is placed, so a single-use code can never be used twice."
        actions={<ButtonLink href="/admin/coupons/new">New coupon</ButtonLink>}
      />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {rows.length === 0 ? (
        <p className="text-midnight/70">No coupons yet.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Code</TH>
              <TH>Discount</TH>
              <TH>Valid</TH>
              <TH className="text-right">Used</TH>
              <TH>Status</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <tbody>
            {rows.map((c) => {
              const status = discountStatus(c);
              const usedUp = c.maxRedemptions !== null && c.redemptionCount >= c.maxRedemptions;
              return (
                <TR key={c.id}>
                  <TD>
                    <span className="tabular font-semibold">{c.code}</span>
                    {c.description ? <span className="block text-sm text-midnight/60">{c.description}</span> : null}
                  </TD>
                  <TD className="whitespace-nowrap">
                    {describeDiscount(c)}
                    {c.minOrderPaisa > 0 ? <span className="block text-sm text-midnight/60">min Rs {(c.minOrderPaisa / 100).toLocaleString("en-PK")}</span> : null}
                  </TD>
                  <TD className="text-sm whitespace-nowrap text-midnight/75">
                    {formatKarachi(c.startsAt)}
                    <br />
                    to {formatKarachi(c.endsAt)}
                  </TD>
                  <TD className="tabular text-right">
                    {c.redemptionCount}
                    {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ""}
                    <span className="block text-xs text-midnight/55">{c.usage === "SINGLE_USE" ? "single-use" : "multi-use"}</span>
                  </TD>
                  <TD>
                    <Status on={status === "Running" && !usedUp} onLabel="Live" offLabel={usedUp ? "Used up" : status} />
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/coupons/${c.id}`} className={buttonClasses("primary", "sm")}>
                        Edit
                      </Link>
                      <ConfirmDelete action={deleteCoupon} id={c.id} what={c.code} />
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
