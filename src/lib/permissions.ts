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
  /** v1.11 (M10 Phase A): online orders — confirm payments, dispatch, cancel (spec §7, §23) */
  orders: ["OWNER", "MANAGER"],
  /** v1.16 (M11): returns (RMA), warranty check, refunds, supplier claims — spec §7 Returns */
  returns: ["OWNER", "MANAGER"],
  /** v1.13 (M9): counter sale (POS) and the end-of-day summary. Non-cash payments: OWNER only (see COUNTER_NON_CASH_ROLES). */
  counter: ["OWNER", "MANAGER", "CASHIER"],
  /** v1.13 (M9): approve technicians for wholesale prices */
  technicians: ["OWNER", "MANAGER"],
  /** Shop settings: payment accounts, COD limit, contact numbers (spec §7 Settings — OWNER) */
  settings: ["OWNER"],
} as const satisfies Record<string, readonly StaffRole[]>;

export type AdminModule = keyof typeof MODULE_ROLES;

export function canAccess(role: StaffRole, module: AdminModule): boolean {
  return (MODULE_ROLES[module] as readonly StaffRole[]).includes(role);
}

/**
 * v1.13 owner decision (M9): at the counter, cashiers and other staff take cash only.
 * Only the OWNER may record JazzCash / Easypaisa / bank transfer / card, after checking the
 * transaction ID is genuine. A manager or owner may give a ticket discount, with a reason.
 */
export const COUNTER_NON_CASH_ROLES: readonly StaffRole[] = ["OWNER"];
export const COUNTER_DISCOUNT_ROLES: readonly StaffRole[] = ["OWNER", "MANAGER"];
/** Who can add a technician who is approved at once (others' additions wait as PENDING). */
export const TECHNICIAN_APPROVER_ROLES: readonly StaffRole[] = ["OWNER", "MANAGER"];
