import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleMarkdown } from "@/components/store/article-markdown";
import { CallToAction } from "@/components/store/content-ui";
import { JsonLd } from "@/components/store/json-ld";
import { PostCard, PostDate } from "@/components/store/post-card";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { excerptOf, readingMinutes } from "@/lib/markdown-text";
import { getPublishedPost, relatedPosts } from "@/server/content/blog";
import { blogPostingLd, breadcrumbLd } from "@/server/content/seo";
import { siteUrl } from "@/server/site-url";
import { getShopFacts } from "@/server/storefront/shop-facts";

// Always current: unpublishing or editing a post takes effect at once.
export const dynamic = "force-dynamic";

const descriptionOf = (p: NonNullable<ReturnType<typeof getPublishedPost>>) => p.seoDescription?.trim() || p.excerpt?.trim() || excerptOf(p.bodyMd, 160);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPublishedPost(db, (await params).slug);
  if (!post) return { title: "Post not found", robots: { index: false } };
  const title = post.seoTitle?.trim() || post.title;
  const description = descriptionOf(post);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    twitter: { card: post.coverImage ? "summary_large_image" : "summary", title, description },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPublishedPost(db, (await params).slug);
  if (!post) notFound();
  const site = siteUrl();
  const related = relatedPosts(db, post);
  const facts = getShopFacts();

  return (
    <>
      <JsonLd
        data={blogPostingLd(site, { slug: post.slug, title: post.title, description: descriptionOf(post), coverImage: post.coverImage, publishedAt: post.publishedAt, updatedAt: post.updatedAt, orgName: facts.name })}
      />
      <JsonLd data={breadcrumbLd(site, [{ name: "Home", path: "/" }, { name: "Repair notes", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      <article>
        <header className="border-b border-midnight/8 bg-surface">
          <Container className="max-w-3xl py-12 md:py-16">
            <nav aria-label="Breadcrumb" className="text-sm text-midnight/65">
              <Link href="/blog" className="underline underline-offset-4 hover:text-midnight">
                Repair notes
              </Link>
            </nav>
            <h1 className="mt-4 text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">{post.title}</h1>
            <p className="mt-4 text-midnight/65">
              <PostDate iso={post.publishedAt} /> · {readingMinutes(post.bodyMd)} min read
            </p>
            {post.tags.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/blog?tag=${encodeURIComponent(t)}`} className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-midnight/10 hover:bg-midnight hover:text-canvas">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </Container>
        </header>
        <Container className="max-w-3xl py-12">
          {post.coverImage ? (
            post.coverImage.startsWith("/uploads/") ? (
              <Image src={post.coverImage} alt="" width={1200} height={675} priority sizes="(min-width: 768px) 48rem, 92vw" className="mb-10 h-auto w-full rounded-bezel" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- external https cover chosen by the admin
              <img src={post.coverImage} alt="" className="mb-10 h-auto w-full rounded-bezel" />
            )
          ) : null}
          <ArticleMarkdown>{post.bodyMd}</ArticleMarkdown>
        </Container>
      </article>

      {related.length ? (
        <section className="bg-surface py-14" aria-labelledby="related-heading">
          <Container>
            <h2 id="related-heading" className="text-2xl font-bold tracking-[-0.02em]">
              More repair notes
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
      <CallToAction title="Need the right screen?" text="Tell us your phone's model code and we will point you to the one that fits." href="/store" label="Browse screens" secondary={{ href: "/contact", label: "Ask us" }} />
    </>
  );
}
