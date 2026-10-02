import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("catalog");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New product" description="Add the screen, then upload its photos." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <ProductForm />
    </>
  );
}
