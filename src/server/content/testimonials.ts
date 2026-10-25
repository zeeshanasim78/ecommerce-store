import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connection";
import { testimonials } from "@/db/schema";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { ContentError, oneLine } from "./errors";

/** Customer testimonials (SPECIFICATION.md §4.14, §7, §30). No Next.js imports. */

export type Testimonial = typeof testimonials.$inferSelect;

export const TestimonialInput = z.object({
  authorName: z.string().min(2, "Add the customer’s name.").max(80),
  authorRole: z.string().max(80).nullable(),
  city: z.string().max(60).nullable(),
  rating: z.number().int().min(1, "Rating is 1 to 5.").max(5, "Rating is 1 to 5.").nullable(),
  quote: z.string().min(10, "Add what the customer said (at least 10 letters).").max(600, "Keep the quote under 600 characters."),
  isPublished: z.boolean(),
});
export type TestimonialInputValue = z.infer<typeof TestimonialInput>;

export function cleanTestimonialInput(raw: { authorName: string; authorRole?: string; city?: string; rating?: string; quote: string; isPublished: boolean }): TestimonialInputValue {
  const rating = raw.rating?.trim() ? Number(raw.rating) : null;
  return {
    authorName: oneLine(raw.authorName, 120),
    authorRole: oneLine(raw.authorRole, 120) || null,
    city: oneLine(raw.city, 100) || null,
    rating: rating !== null && Number.isFinite(rating) ? Math.round(rating) : null,
    quote: oneLine(raw.quote, 800),
    isPublished: raw.isPublished,
  };
}

export function saveTestimonial(db: DB, ctx: AuditContext, actorId: string, id: string | null, input: TestimonialInputValue): string {
  const parsed = TestimonialInput.safeParse(input);
  if (!parsed.success) throw new ContentError(parsed.error.issues[0]?.message ?? "Check the form.");
  const data = parsed.data;
  return db.transaction(
    (tx) => {
      const before = id ? tx.select().from(testimonials).where(eq(testimonials.id, id)).get() : undefined;
      if (id && !before) throw new ContentError("That testimonial no longer exists.");
      let savedId = id;
      if (id) tx.update(testimonials).set(data).where(eq(testimonials.id, id)).run();
      else {
        const last = tx.select({ n: sql<number>`COALESCE(MAX(${testimonials.sortOrder}), -1)` }).from(testimonials).get()?.n ?? -1;
        savedId = tx.insert(testimonials).values({ ...data, sortOrder: last + 1 }).returning({ id: testimonials.id }).get().id;
      }
      writeAudit(tx, ctx, { actorId, action: id ? "testimonial.update" : "testimonial.create", entity: "testimonials", entityId: savedId, before, after: data });
      return savedId!;
    },
    { behavior: "immediate" },
  );
}

export function setTestimonialPublished(db: DB, ctx: AuditContext, actorId: string, id: string, published: boolean) {
  db.transaction(
    (tx) => {
      const t = tx.select().from(testimonials).where(eq(testimonials.id, id)).get();
      if (!t) throw new ContentError("That testimonial no longer exists.");
      if (t.archivedAt) throw new ContentError("Restore the testimonial first.");
      tx.update(testimonials).set({ isPublished: published }).where(eq(testimonials.id, id)).run();
      writeAudit(tx, ctx, { actorId, action: published ? "testimonial.publish" : "testimonial.unpublish", entity: "testimonials", entityId: id });
    },
    { behavior: "immediate" },
  );
}

export function archiveTestimonial(db: DB, ctx: AuditContext, actorId: string, id: string, archive: boolean, now = new Date()) {
  db.transaction(
    (tx) => {
      const t = tx.select().from(testimonials).where(eq(testimonials.id, id)).get();
      if (!t) throw new ContentError("That testimonial no longer exists.");
      tx.update(testimonials).set(archive ? { archivedAt: now.toISOString(), isPublished: false } : { archivedAt: null }).where(eq(testimonials.id, id)).run();
      writeAudit(tx, ctx, { actorId, action: archive ? "testimonial.archive" : "testimonial.restore", entity: "testimonials", entityId: id });
    },
    { behavior: "immediate" },
  );
}

/** Swap with the neighbour and renumber 0..n (same approach as the hero slides). */
export function moveTestimonial(db: DB, ctx: AuditContext, actorId: string, id: string, direction: "up" | "down") {
  db.transaction(
    (tx) => {
      const ordered = tx.select({ id: testimonials.id }).from(testimonials).where(isNull(testimonials.archivedAt)).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt)).all();
      const i = ordered.findIndex((t) => t.id === id);
      const j = i + (direction === "up" ? -1 : 1);
      if (i < 0 || j < 0 || j >= ordered.length) return;
      [ordered[i], ordered[j]] = [ordered[j]!, ordered[i]!];
      ordered.forEach((t, n) => tx.update(testimonials).set({ sortOrder: n }).where(eq(testimonials.id, t.id)).run());
      writeAudit(tx, ctx, { actorId, action: "testimonial.reorder", entity: "testimonials", entityId: id, after: ordered.map((t) => t.id) });
    },
    { behavior: "immediate" },
  );
}

export function listPublishedTestimonials(db: DB, limit = 12): Testimonial[] {
  return db.select().from(testimonials).where(and(eq(testimonials.isPublished, true), isNull(testimonials.archivedAt))).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt)).limit(limit).all();
}

export function listAdminTestimonials(db: DB, archived = false): Testimonial[] {
  return db.select().from(testimonials).where(archived ? sql`${testimonials.archivedAt} IS NOT NULL` : isNull(testimonials.archivedAt)).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt)).all();
}
export const getTestimonialById = (db: DB, id: string) => db.select().from(testimonials).where(eq(testimonials.id, id)).get();
