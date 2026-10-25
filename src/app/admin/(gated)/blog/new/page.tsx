import { AdminHeader, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/server/dal";
import { PostForm } from "../post-form";

export const metadata = { title: "New blog post" };

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("content");
  const { error } = await searchParams;
  return (
    <>
      <AdminHeader title="New blog post" description="Write in Markdown, check the Preview, then save as a draft or publish." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <PostForm />
    </>
  );
}
