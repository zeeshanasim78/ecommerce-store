import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { SlideForm } from "../slide-form";

export const metadata = { title: "New hero slide" };

export default async function NewSlidePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("hero");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New hero slide" />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <SlideForm />
    </>
  );
}
