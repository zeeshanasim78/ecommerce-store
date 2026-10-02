import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { PromotionForm } from "../promotion-form";

export const metadata = { title: "New promotion" };

export default async function NewPromotionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("discounts");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New promotion" description="An automatic discount shown on product prices — no code needed." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <PromotionForm />
    </>
  );
}
