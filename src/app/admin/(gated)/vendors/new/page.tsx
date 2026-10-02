import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { VendorForm } from "../vendor-form";

export const metadata = { title: "New vendor" };

export default async function NewVendorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("vendors");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New vendor" description="A supplier you buy screens from." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <VendorForm />
    </>
  );
}
