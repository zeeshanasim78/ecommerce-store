import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { TestimonialForm } from "../testimonial-form";

export const metadata = { title: "New testimonial" };

export default async function NewTestimonialPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("content");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New testimonial" />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <TestimonialForm />
    </>
  );
}
