import type { STAFF_ROLES } from "@/db/schema/auth";

/** Which staff roles may open each admin module (spec §7). Shared by server checks and the sidebar. */
export type StaffRole = (typeof STAFF_ROLES)[number];

export const MODULE_ROLES = {
  dashboard: ["OWNER", "MANAGER", "CASHIER", "CONTENT_EDITOR"],
  hero: ["OWNER", "MANAGER", "CONTENT_EDITOR"],
  catalog: ["OWNER", "MANAGER"],
  discounts: ["OWNER", "MANAGER"],
  // Milestone 6 (spec §7): purchasing and the ledger are OWNER/MANAGER only
  vendors: ["OWNER", "MANAGER"],
  purchasing: ["OWNER", "MANAGER"],
  ledger: ["OWNER", "MANAGER"],
  /** Manual stock adjustments and stock counts (spec §6.5) */
  stockAdjust: ["OWNER", "MANAGER"],
} as const satisfies Record<string, readonly StaffRole[]>;

export type AdminModule = keyof typeof MODULE_ROLES;

export function canAccess(role: StaffRole, module: AdminModule): boolean {
  return (MODULE_ROLES[module] as readonly StaffRole[]).includes(role);
}
