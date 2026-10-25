import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connection";
import { services } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { ContentError, multiLine, oneLine } from "./errors";

/** Services shown on /services (SPECIFICATION.md §4.14, §30). No Next.js imports. */

export type Service = typeof services.$inferSelect;
export const SERVICE_ICONS = ["wholesale", "fitting", "warranty", "delivery", "support", "quality"] as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export const ServiceInput = z.object({
  title: z.string().min(3, "Add a title (at least 3 letters).").max(90, "Keep the title under 90 characters."),
  summary: z.string().min(10, "Add a short summary (at least 10 letters).").max(240, "Keep the summary under 240 characters."),
  bodyMd: z.string().max(6000, "Keep the details under 6,000 characters.").nullable(),
  icon: z.enum(SERVICE_ICONS).nullable(),
  isActive: z.boolean(),
});
export type ServiceInputValue = z.infer<typeof ServiceInput>;

export function cleanServiceInput(raw: { title: string; summary: string; bodyMd?: string; icon?: string; isActive: boolean }) {
  return {
    title: oneLine(raw.title, 200),
    summary: oneLine(raw.summary, 400),
    bodyMd: multiLine(raw.bodyMd, 8000) || null,
    icon: (SERVICE_ICONS as readonly string[]).includes(raw.icon ?? "") ? raw.icon : null,
    isActive: raw.isActive,
  };
}

export function saveService(db: DB, ctx: AuditContext, actorId: string, id: string | null, input: unknown): string {
  const parsed = ServiceInput.safeParse(input);
  if (!parsed.success) throw new ContentError(parsed.error.issues[0]?.message ?? "Check the form.");
  const data = parsed.data;
  return db.transaction(
    (tx) => {
      const before = id ? tx.select().from(services).where(eq(services.id, id)).get() : undefined;
      if (id && !before) throw new ContentError("That service no longer exists.");
      let savedId = id;
      if (id) tx.update(services).set(data).where(eq(services.id, id)).run();
      else {
        const base = slugify(data.title) || "service";
        let slug = base;
        for (let n = 2; tx.select({ id: services.id }).from(services).where(eq(services.slug, slug)).get(); n++) slug = `${base}-${n}`;
        const last = tx.select({ n: sql<number>`COALESCE(MAX(${services.sortOrder}), -1)` }).from(services).get()?.n ?? -1;
        savedId = tx.insert(services).values({ ...data, slug, sortOrder: last + 1 }).returning({ id: services.id }).get().id;
      }
      writeAudit(tx, ctx, { actorId, action: id ? "service.update" : "service.create", entity: "services", entityId: savedId, before, after: data });
      return savedId!;
    },
    { behavior: "immediate" },
  );
}

export function moveService(db: DB, ctx: AuditContext, actorId: string, id: string, direction: "up" | "down") {
  db.transaction(
    (tx) => {
      const ordered = tx.select({ id: services.id }).from(services).orderBy(asc(services.sortOrder), asc(services.title)).all();
      const i = ordered.findIndex((s) => s.id === id);
      const j = i + (direction === "up" ? -1 : 1);
      if (i < 0 || j < 0 || j >= ordered.length) return;
      [ordered[i], ordered[j]] = [ordered[j]!, ordered[i]!];
      ordered.forEach((s, n) => tx.update(services).set({ sortOrder: n }).where(eq(services.id, s.id)).run());
      writeAudit(tx, ctx, { actorId, action: "service.reorder", entity: "services", entityId: id, after: ordered.map((s) => s.id) });
    },
    { behavior: "immediate" },
  );
}

export function setServiceActive(db: DB, ctx: AuditContext, actorId: string, id: string, active: boolean) {
  db.transaction(
    (tx) => {
      const s = tx.select().from(services).where(eq(services.id, id)).get();
      if (!s) throw new ContentError("That service no longer exists.");
      tx.update(services).set({ isActive: active }).where(eq(services.id, id)).run();
      writeAudit(tx, ctx, { actorId, action: active ? "service.show" : "service.hide", entity: "services", entityId: id });
    },
    { behavior: "immediate" },
  );
}

export const listActiveServices = (db: DB): Service[] => db.select().from(services).where(and(eq(services.isActive, true))).orderBy(asc(services.sortOrder), asc(services.title)).all();
export const listAllServices = (db: DB): Service[] => db.select().from(services).orderBy(asc(services.sortOrder), asc(services.title)).all();
export const getServiceById = (db: DB, id: string) => db.select().from(services).where(eq(services.id, id)).get();
