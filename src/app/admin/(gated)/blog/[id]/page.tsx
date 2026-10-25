import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { db } from "@/db/client";
import { getPostById } from "@/server/content/blog";
import { requireStaff } from "@/server/dal";
import { PostForm } from "../post-form";

export const metadata = { title: "Edit blog post" };

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("content");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const post = getPostById(db, id);
  if (!post) notFound();
  return (
    <>
      <AdminHeader
        title="Edit blog post"
        description={post.title}
        actions={post.status === "PUBLISHED" && !post.archivedAt ? <Link href={`/blog/${post.slug}`} className="font-semibold underline underline-offset-4">View on the site</Link> : undefined}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {post.archivedAt ? <Notice tone="error">This post is archived. Restore it from the Blog list to edit it.</Notice> : <PostForm post={post} />}
    </>
  );
}
