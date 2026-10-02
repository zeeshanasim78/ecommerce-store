import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { db } from "@/db/client";
import { coupons } from "@/db/schema";
import { requireStaff } from "@/server/dal";
import { CouponForm } from "../coupon-form";

export const metadata = { title: "Edit coupon" };

export default async function EditCouponPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("discounts");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const coupon = db.select().from(coupons).where(eq(coupons.id, id)).get();
  if (!coupon) notFound();
  return (
    <>
      <AdminHeader title={`Coupon ${coupon.code}`} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <CouponForm coupon={coupon} />
    </>
  );
}
