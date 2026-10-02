import type { PurchaseOrderStatus } from "@/db/schema/purchasing";

/** Plain-language labels for purchasing screens. */
export const PAYMENT_TERMS_LABEL = { ADVANCE: "Pay in advance", NET_15: "Pay within 15 days", NET_30: "Pay within 30 days" } as const;

export const CURRENCY_LABEL = { PKR: "PKR — Pakistani rupee", USD: "USD — US dollar", CNY: "CNY — Chinese yuan", AED: "AED — UAE dirham" } as const;

export const COUNTRIES = [
  ["PK", "Pakistan"],
  ["CN", "China"],
  ["HK", "Hong Kong"],
  ["AE", "United Arab Emirates"],
  ["TW", "Taiwan"],
  ["KR", "South Korea"],
  ["VN", "Vietnam"],
  ["US", "United States"],
] as const;

export const PO_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Part received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

/** "USD 42.50" / "PKR 1,200.00" — supplier amounts in their own currency (admin purchasing only, spec §3). */
export function formatForeign(minor: number, currency: string): string {
  return `${currency} ${(minor / 100).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
