import type { DB, Tx } from "@/db/connection";
import { adminAuditLog } from "@/db/schema";

/**
 * Writes one row to admin_audit_log (spec §4.14). Call inside the same transaction as the change.
 * Kept free of Next.js imports so domain modules (purchasing, stock counts, CSV import) and
 * their tests can use it.
 */
export type AuditContext = { ip: string; userAgent: string | null };

export function writeAudit(
  db: DB | Tx,
  ctx: AuditContext,
  entry: { actorId: string; action: string; entity: string; entityId?: string | null; before?: unknown; after?: unknown },
) {
  db.insert(adminAuditLog)
    .values({
      actorId: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    })
    .run();
}
