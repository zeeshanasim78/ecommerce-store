import { and, asc, desc, eq, isNull, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connection";
import { blogPosts } from "@/db/schema";
import { POST_STATUSES } from "@/db/schema/content";
import { excerptOf, readingMinutes } from "@/lib/markdown-text";
import { slugify } from "@/lib/slug";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { ContentError, isSafeImageUrl, multiLine, oneLine } from "./errors";

/**
 * Blog (SPECIFICATION.md §4.14, §7 Blog, §30). Logic only — no Next.js imports, so it is unit-tested.
 * Visible to the public = PUBLISHED, not archived, and published_at not in the future.
 */

export const MIN_PUBLISH_CHARS = 80;
export const POSTS_PER_PAGE = 9;

export type Post = typeof blogPosts.$inferSelect;
export type PostCard = Pick<Post, "id" | "slug" | "title" | "coverImage" | "tags" | "publishedAt"> & { excerpt: string; minutes: number };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PostInput = z.object({
  title: z.string().min(3, "Add a title (at least 3 letters).").max(120, "Keep the title under 120 characters."),
  slug: z.string().max(96).nullable(),
  excerpt: z.string().max(300, "Keep the summary under 300 characters.").nullable(),
  bodyMd: z.string().min(1, "Write the post.").max(60_000, "That post is too long (60,000 characters at most)."),
  coverImage: z.string().refine(isSafeImageUrl, "The cover image must be an upload or start with https://").nullable(),
  tags: z.array(z.string().min(1).max(30)).max(8, "Use at most 8 tags."),
  seoTitle: z.string().max(70, "Keep the search title under 70 characters.").nullable(),
  seoDescription: z.string().max(170, "Keep the search description under 170 characters.").nullable(),
  status: z.enum(POST_STATUSES),
});
export type PostInputValue = z.infer<typeof PostInput>;

/** Raw form values → cleaned input (before validation). */
export function cleanPostInput(raw: { title: string; slug?: string; excerpt?: string; bodyMd: string; coverImage?: string; tags?: string; seoTitle?: string; seoDescription?: string; status: string }) {
  const tags = [...new Set((raw.tags ?? "").split(",").map((t) => oneLine(t, 30).toLowerCase()).filter(Boolean))];
  return {
    title: oneLine(raw.title, 200),
    slug: oneLine(raw.slug, 200).toLowerCase() || null,
    excerpt: oneLine(raw.excerpt, 400) || null,
    bodyMd: multiLine(raw.bodyMd, 70_000),
    coverImage: oneLine(raw.coverImage, 400) || null,
    tags,
    seoTitle: oneLine(raw.seoTitle, 200) || null,
    seoDescription: oneLine(raw.seoDescription, 400) || null,
    status: raw.status,
  };
}

function uniqueSlug(db: DB, base: string, exceptId: string | null): string {
  const taken = (s: string) => {
    const row = db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, s)).get();
    return Boolean(row && row.id !== exceptId);
  };
  let candidate = base;
  for (let n = 2; taken(candidate); n++) candidate = `${base}-${n}`.slice(0, 100);
  return candidate;
}

/** Create (id = null) or update a post in one transaction, with an audit entry. */
export function savePost(db: DB, ctx: AuditContext, actorId: string, id: string | null, input: PostInputValue, now = new Date()): { id: string; slug: string } {
  const parsed = PostInput.safeParse(input);
  if (!parsed.success) throw new ContentError(parsed.error.issues[0]?.message ?? "Check the form.");
  const data = parsed.data;
  if (data.status === "PUBLISHED" && data.bodyMd.length < MIN_PUBLISH_CHARS) {
    throw new ContentError(`Write a little more before publishing (at least ${MIN_PUBLISH_CHARS} characters). Save it as a draft meanwhile.`);
  }

  return db.transaction(
    (tx) => {
      const before = id ? tx.select().from(blogPosts).where(eq(blogPosts.id, id)).get() : undefined;
      if (id && !before) throw new ContentError("That post no longer exists.");

      let slug: string;
      if (data.slug) {
        if (!SLUG.test(data.slug)) throw new ContentError("The web address can only use lower-case letters, numbers and single hyphens.");
        const clash = tx.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, data.slug)).get();
        if (clash && clash.id !== id) throw new ContentError("Another post already uses that web address. Pick a different one.");
        slug = data.slug;
      } else if (before) {
        slug = before.slug; // an existing post keeps its address unless it is changed on purpose
      } else {
        slug = uniqueSlug(tx as unknown as DB, slugify(data.title) || "post", null);
      }

      const publishedAt = data.status === "PUBLISHED" ? (before?.publishedAt ?? now.toISOString()) : (before?.publishedAt ?? null);
      const row = {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        bodyMd: data.bodyMd,
        coverImage: data.coverImage,
        tags: data.tags,
        status: data.status,
        publishedAt,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        updatedAt: now.toISOString(),
      };
      let postId = id;
      if (id) tx.update(blogPosts).set(row).where(eq(blogPosts.id, id)).run();
      else postId = tx.insert(blogPosts).values({ ...row, authorId: actorId }).returning({ id: blogPosts.id }).get().id;

      writeAudit(tx, ctx, {
        actorId,
        action: id ? (before?.status !== data.status ? (data.status === "PUBLISHED" ? "blog.publish" : "blog.unpublish") : "blog.update") : data.status === "PUBLISHED" ? "blog.create_published" : "blog.create",
        entity: "blog_posts",
        entityId: postId,
        before: before ? { title: before.title, slug: before.slug, status: before.status } : undefined,
        after: { title: data.title, slug, status: data.status },
      });
      return { id: postId!, slug };
    },
    { behavior: "immediate" },
  );
}

/** Publish or unpublish without opening the editor. */
export function setPostStatus(db: DB, ctx: AuditContext, actorId: string, id: string, status: "PUBLISHED" | "DRAFT", now = new Date()) {
  const post = db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
  if (!post) throw new ContentError("That post no longer exists.");
  if (post.archivedAt) throw new ContentError("Restore the post before changing it.");
  return savePost(db, ctx, actorId, id, {
    title: post.title, slug: post.slug, excerpt: post.excerpt, bodyMd: post.bodyMd, coverImage: post.coverImage,
    tags: post.tags, seoTitle: post.seoTitle, seoDescription: post.seoDescription, status,
  }, now);
}

export function archivePost(db: DB, ctx: AuditContext, actorId: string, id: string, archive: boolean, now = new Date()) {
  db.transaction(
    (tx) => {
      const post = tx.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
      if (!post) throw new ContentError("That post no longer exists.");
      if (Boolean(post.archivedAt) === archive) return;
      // An archived post is never public, and comes back as a draft so it can be checked first.
      tx.update(blogPosts)
        .set(archive ? { archivedAt: now.toISOString(), status: "DRAFT", updatedAt: now.toISOString() } : { archivedAt: null, updatedAt: now.toISOString() })
        .where(eq(blogPosts.id, id))
        .run();
      writeAudit(tx, ctx, { actorId, action: archive ? "blog.archive" : "blog.restore", entity: "blog_posts", entityId: id, before: { status: post.status }, after: { title: post.title } });
    },
    { behavior: "immediate" },
  );
}

// ---- Public reads ----------------------------------------------------------------------------

const visible = (now: Date) => and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.archivedAt), lte(blogPosts.publishedAt, now.toISOString()));

export function toCard(p: Post): PostCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt?.trim() ? p.excerpt : excerptOf(p.bodyMd, 160),
    coverImage: p.coverImage,
    tags: p.tags,
    publishedAt: p.publishedAt,
    minutes: readingMinutes(p.bodyMd),
  };
}

export function listPublishedPosts(db: DB, opts: { tag?: string; page?: number; pageSize?: number; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const pageSize = opts.pageSize ?? POSTS_PER_PAGE;
  const all = db.select().from(blogPosts).where(visible(now)).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt)).all();
  const tagCounts = new Map<string, number>();
  for (const p of all) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tag = opts.tag?.toLowerCase();
  const matching = tag ? all.filter((p) => p.tags.includes(tag)) : all;
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1) || 1), pages);
  return {
    posts: matching.slice((page - 1) * pageSize, page * pageSize).map(toCard),
    total: matching.length,
    page,
    pages,
    tags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count })),
  };
}

export function getPublishedPost(db: DB, slug: string, now = new Date()): Post | undefined {
  return db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), visible(now))).get();
}

/** Up to `limit` other published posts, those sharing a tag first. */
export function relatedPosts(db: DB, post: Pick<Post, "id" | "tags">, limit = 3, now = new Date()): PostCard[] {
  const others = db.select().from(blogPosts).where(and(visible(now), ne(blogPosts.id, post.id))).orderBy(desc(blogPosts.publishedAt)).all();
  const score = (p: Post) => p.tags.filter((t) => post.tags.includes(t)).length;
  return others
    .map((p, i) => ({ p, i, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => toCard(x.p));
}

/** For sitemap.xml. */
export function publishedPostSlugs(db: DB, now = new Date()): { slug: string; updatedAt: string }[] {
  return db.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, publishedAt: blogPosts.publishedAt }).from(blogPosts).where(visible(now)).orderBy(desc(blogPosts.publishedAt)).all()
    .map((r) => ({ slug: r.slug, updatedAt: r.updatedAt || r.publishedAt || "" }));
}

// ---- Admin reads -----------------------------------------------------------------------------

export type PostFilter = "all" | "published" | "draft" | "archived";
export function listAdminPosts(db: DB, filter: PostFilter = "all"): Post[] {
  const where =
    filter === "archived" ? sql`${blogPosts.archivedAt} IS NOT NULL`
    : filter === "published" ? and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.archivedAt))
    : filter === "draft" ? and(eq(blogPosts.status, "DRAFT"), isNull(blogPosts.archivedAt))
    : isNull(blogPosts.archivedAt);
  return db.select().from(blogPosts).where(where).orderBy(desc(blogPosts.updatedAt), asc(blogPosts.title)).all();
}
export const getPostById = (db: DB, id: string) => db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
