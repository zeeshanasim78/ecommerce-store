import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { db } from "@/db/client";
import { promotions } from "@/db/schema";
import { requireStaff } from "@/server/dal";
import { PromotionForm } from "../promotion-form";

export const metadata = { title: "Edit promotion" };

export default async function EditPromotionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("discounts");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const promotion = db.select().from(promotions).where(eq(promotions.id, id)).get();
  if (!promotion) notFound();
  return (
    <>
      <AdminHeader title="Edit promotion" description={promotion.name} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <PromotionForm promotion={promotion} />
    </>
  );
}
