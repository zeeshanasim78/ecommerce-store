import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { ServiceForm } from "../service-form";

export const metadata = { title: "New service" };

export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("content");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New service" />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <ServiceForm />
    </>
  );
}
