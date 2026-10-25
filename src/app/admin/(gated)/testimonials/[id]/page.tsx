import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { db } from "@/db/client";
import { getTestimonialById } from "@/server/content/testimonials";
import { requireStaff } from "@/server/dal";
import { TestimonialForm } from "../testimonial-form";

export const metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("content");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const item = getTestimonialById(db, id);
  if (!item) notFound();
  return (
    <>
      <AdminHeader title="Edit testimonial" description={item.authorName} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <TestimonialForm item={item} />
    </>
  );
}
