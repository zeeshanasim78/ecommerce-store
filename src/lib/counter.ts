/** Counter-sale (POS) constants shared by the server and the till screen (v1.13, M9). No server imports. */

export const COUNTER_METHODS = ["CASH", "JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "POS_CARD"] as const;
export type CounterMethod = (typeof COUNTER_METHODS)[number];
export const COUNTER_METHOD_LABEL: Record<CounterMethod, string> = {
  CASH: "Cash",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Bank transfer",
  POS_CARD: "Card (machine)",
};
