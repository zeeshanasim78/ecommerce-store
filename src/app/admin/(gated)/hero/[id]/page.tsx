import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { db } from "@/db/client";
import { heroSlides } from "@/db/schema";
import { requireStaff } from "@/server/dal";
import { SlideForm } from "../slide-form";

export const metadata = { title: "Edit hero slide" };

export default async function EditSlidePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("hero");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const slide = db.select().from(heroSlides).where(eq(heroSlides.id, id)).get();
  if (!slide) notFound();
  return (
    <>
      <AdminHeader title="Edit hero slide" description={slide.heading} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <SlideForm slide={slide} />
    </>
  );
}
