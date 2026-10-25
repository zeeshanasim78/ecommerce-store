import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { db } from "@/db/client";
import { getServiceById } from "@/server/content/services";
import { requireStaff } from "@/server/dal";
import { ServiceForm } from "../service-form";

export const metadata = { title: "Edit service" };

export default async function EditServicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("content");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const service = getServiceById(db, id);
  if (!service) notFound();
  return (
    <>
      <AdminHeader title="Edit service" description={service.title} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <ServiceForm service={service} />
    </>
  );
}
