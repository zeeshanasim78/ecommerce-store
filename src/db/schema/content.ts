import { sqliteTable, text, integer, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { id, inList, timestamp } from "./_helpers";
import { user } from "./auth";

/** Content tables — SPECIFICATION.md §4.14. */

export const POST_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const MESSAGE_STATUSES = ["NEW", "REPLIED", "SPAM"] as const;

export const blogPosts = sqliteTable(
  "blog_posts",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    bodyMd: text("body_md").notNull(),
    coverImage: text("cover_image"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default(sql`'[]'`).notNull(),
    status: text("status", { enum: POST_STATUSES }).default("DRAFT").notNull(),
    publishedAt: text("published_at"),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [check("blog_posts_status", inList("status", POST_STATUSES)), index("blog_posts_published_idx").on(t.status, t.publishedAt)],
);

export const testimonials = sqliteTable(
  "testimonials",
  {
    id: id(),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role"), // e.g. "Repair shop owner"
    city: text("city"),
    rating: integer("rating"),
    quote: text("quote").notNull(),
    isPublished: integer("is_published", { mode: "boolean" }).default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [check("testimonials_rating", sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`)],
);

export const services = sqliteTable("services", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  bodyMd: text("body_md"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: id(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    subject: text("subject"),
    message: text("message").notNull(),
    status: text("status", { enum: MESSAGE_STATUSES }).default("NEW").notNull(),
    createdAt: timestamp("created_at"),
  },
  () => [check("contact_messages_status", inList("status", MESSAGE_STATUSES))],
);
