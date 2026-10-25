import Link from "next/link";
import { AdminHeader, Notice, Status } from "@/components/admin/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { cn } from "@/lib/cn";
import { formatKarachi } from "@/lib/time";
import { listAdminPosts, type PostFilter } from "@/server/content/blog";
import { requireStaff } from "@/server/dal";
import { archivePostAction, setPostStatusAction } from "./actions";

export const metadata = { title: "Blog" };

const FILTERS: { key: PostFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

export default async function BlogAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; highlight?: string; show?: string }> }) {
  await requireStaff("content");
  const { saved, error, highlight, show } = await searchParams;
  const filter = FILTERS.some((f) => f.key === show) ? (show as PostFilter) : "all";
  const posts = listAdminPosts(db, filter);

  return (
    <>
      <AdminHeader title="Blog" description="Write repair notes and guides. Published posts appear on /blog and in the sitemap." actions={<ButtonLink href="/admin/blog/new">New post</ButtonLink>} />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <nav aria-label="Filter posts" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/admin/blog" : `/admin/blog?show=${f.key}`} className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold", filter === f.key ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10")}>
            {f.label}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="text-midnight/70">{filter === "all" ? "No posts yet. Write the first one." : "Nothing here."}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li key={p.id} className={cn("flex flex-wrap items-center gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8", highlight === p.id && "ring-2 ring-midnight")}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="truncate text-sm text-midnight/65">
                  /blog/{p.slug} · {p.publishedAt && p.status === "PUBLISHED" ? `published ${formatKarachi(p.publishedAt)}` : `edited ${formatKarachi(p.updatedAt)}`}
                  {p.tags.length ? ` · ${p.tags.join(", ")}` : ""}
                </p>
              </div>
              {p.archivedAt ? <Status on={false} offLabel="Archived" /> : <Status on={p.status === "PUBLISHED"} onLabel="Published" offLabel="Draft" />}
              <div className="flex flex-wrap gap-2">
                {p.archivedAt ? (
                  <form action={archivePostAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="archive" value="no" />
                    <button type="submit" className={buttonClasses("outline", "sm")}>Restore</button>
                  </form>
                ) : (
                  <>
                    {p.status === "PUBLISHED" ? <Link href={`/blog/${p.slug}`} className={buttonClasses("ghost", "sm")}>View</Link> : null}
                    <form action={setPostStatusAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                      <button type="submit" className={buttonClasses("outline", "sm")}>{p.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                    </form>
                    <Link href={`/admin/blog/${p.id}`} className={buttonClasses("primary", "sm")}>Edit</Link>
                    <form action={archivePostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className={cn(buttonClasses("ghost", "sm"), "text-terracotta")}>Archive</button>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
