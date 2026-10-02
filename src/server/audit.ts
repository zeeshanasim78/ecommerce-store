import "server-only";
import { headers } from "next/headers";
import { clientIp } from "./rate-limit";

export { writeAudit, type AuditContext } from "./audit-log";

/** IP and browser of the current request, for admin_audit_log (spec §4.14). */
export async function auditContext() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}
