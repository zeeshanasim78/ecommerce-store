import "server-only";
import { headers } from "next/headers";
import type { DB, Tx } from "@/db/connection";
import { adminAuditLog } from "@/db/schema";
import { clientIp } from "./rate-limit";

/** Writes one row to admin_audit_log (spec §4.14). Call inside the same transaction as the change. */
export async function auditContext() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}

export function writeAudit(
  db: DB | Tx,
  ctx: { ip: string; userAgent: string | null },
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
