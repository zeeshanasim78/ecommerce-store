import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { CouponForm } from "../coupon-form";

export const metadata = { title: "New coupon" };

export default async function NewCouponPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("discounts");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New coupon" description="A code shoppers type at checkout for money off their order." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <CouponForm />
    </>
  );
}
