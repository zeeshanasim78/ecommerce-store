import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { STAFF_ROLES, type UserRole } from "@/db/schema";
import { canAccess, type AdminModule, type StaffRole } from "@/lib/permissions";
import { auth } from "./auth";

/**
 * Data Access Layer — the real security gate (SPECIFICATION.md §10).
 * Every admin page, layout and Server Action calls one of these first.
 * proxy.ts only does a fast "is there a cookie" redirect for convenience.
 */

export { canAccess, type AdminModule, type StaffRole };

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  twoFactorEnabled: boolean;
};

const isStaffRole = (role: unknown): role is StaffRole => (STAFF_ROLES as readonly string[]).includes(role as string);

/** Current session, read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Signed-in, active staff member — whether or not 2FA is set up yet. Used only by the 2FA setup page. */
export async function requireStaffSession(): Promise<StaffUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  const u = session.user as typeof session.user & { role?: UserRole; isActive?: boolean; twoFactorEnabled?: boolean | null };
  if (!u.isActive || !isStaffRole(u.role)) redirect("/login?error=no-access");
  return { id: u.id, name: u.name, email: u.email, role: u.role, twoFactorEnabled: Boolean(u.twoFactorEnabled) };
}

/**
 * Signed-in, active staff member with 2FA switched on, allowed into `module`.
 * Staff without 2FA are sent to enrol first; other roles go back to the dashboard.
 */
export async function requireStaff(module: AdminModule = "dashboard"): Promise<StaffUser> {
  const staff = await requireStaffSession();
  if (!staff.twoFactorEnabled) redirect("/admin/setup-2fa");
  if (!canAccess(staff.role, module)) redirect(`/admin/dashboard?denied=${module}`);
  return staff;
}
