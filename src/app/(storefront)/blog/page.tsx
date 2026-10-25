import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/store/post-card";
import { PageIntro } from "@/components/store/content-ui";
import { Container } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { db } from "@/db/client";
import { listPublishedPosts } from "@/server/content/blog";

export const metadata: Metadata = {
  title: "Repair notes",
  description: "Guides and notes on choosing, fitting and caring for phone replacement screens, from the Caidea team.",
  alternates: { canonical: "/blog" },
};
// Always current: a post published in the admin must show at once.
export const dynamic = "force-dynamic";

const pill = "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors";

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string; page?: string }> }) {
  const { tag, page } = await searchParams;
  const list = listPublishedPosts(db, { tag: typeof tag === "string" ? tag.slice(0, 30) : undefined, page: Number(page) });
  const href = (p: number, t = tag) => `/blog?${new URLSearchParams({ ...(t ? { tag: t } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`.replace(/\?$/, "");

  return (
    <>
      <PageIntro title="Repair notes" lead="Plain-language guides on choosing, fitting and looking after phone screens." />
      <Container className="py-12 lg:py-16">
        {list.tags.length ? (
          <nav aria-label="Topics" className="mb-10 flex flex-wrap gap-2">
            <Link href="/blog" className={cn(pill, !tag ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10")}>
              All
            </Link>
            {list.tags.map((t) => (
              <Link key={t.name} href={`/blog?tag=${encodeURIComponent(t.name)}`} className={cn(pill, tag === t.name ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10")}>
                {t.name} <span className="ml-1.5 opacity-60">{t.count}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        {list.posts.length === 0 ? (
          <p className="text-lg text-midnight/70">
            {tag ? "No posts with that topic yet. " : "We are writing our first posts. "}
            <Link href="/store" className="font-semibold underline underline-offset-4">
              Browse the catalogue
            </Link>{" "}
            meanwhile.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.posts.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        )}

        {list.pages > 1 ? (
          <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center gap-2">
            {list.page > 1 ? <Link href={href(list.page - 1)} className={cn(pill, "bg-surface hover:bg-midnight/10")}>Newer</Link> : null}
            <span className="px-3 text-sm text-midnight/70">Page {list.page} of {list.pages}</span>
            {list.page < list.pages ? <Link href={href(list.page + 1)} className={cn(pill, "bg-surface hover:bg-midnight/10")}>Older</Link> : null}
          </nav>
        ) : null}
      </Container>
    </>
  );
}
