import { inArray } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { settings } from "@/db/schema";
import type { SettingKey } from "@/db/schema/system";
import { readGatewayConfig } from "@/server/payments/config";
import { readPaymentEnv, type EnvBank, type EnvWallet } from "./payment-env";

/**
 * Shop settings used by checkout (spec §4.14 `settings`, §8, v1.8).
 * - From the environment file (payment-env.ts): the cash-on-delivery limit and every account number.
 * - From the database (Admin → Shop settings): shop phone, WhatsApp, which methods are on, waiting time.
 * Read with safe fallbacks so a missing or malformed value never breaks checkout — it just switches
 * that payment method off.
 */

export const CHECKOUT_METHODS = ["COD", "JAZZCASH", "EASYPAISA", "NAYAPAY", "BANK_TRANSFER", "AGGREGATOR"] as const;
export type CheckoutMethod = (typeof CHECKOUT_METHODS)[number];
export const WALLET_METHODS = ["JAZZCASH", "EASYPAISA", "NAYAPAY"] as const;
export type WalletMethod = (typeof WALLET_METHODS)[number];
/** Pay into the shop's own account, then send the transaction ID (staff confirm by hand). */
export const MANUAL_METHODS: readonly CheckoutMethod[] = ["JAZZCASH", "EASYPAISA", "NAYAPAY", "BANK_TRANSFER"];
/** v1.19 (M14): pay on the payment gateway's page; the gateway tells the shop by a signed callback. */
export const ONLINE_METHODS: readonly CheckoutMethod[] = ["AGGREGATOR"];
export const isOnlineMethod = (m: string) => (ONLINE_METHODS as readonly string[]).includes(m);

export const METHOD_LABEL: Record<CheckoutMethod, string> = {
  COD: "Cash on delivery",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  NAYAPAY: "NayaPay",
  BANK_TRANSFER: "Bank transfer",
  AGGREGATOR: "Card or wallet (pay online now)",
};

export type WalletAccount = EnvWallet;
export type BankAccount = EnvBank;

export type CheckoutSettings = {
  storeName: string;
  storePhone: string | null;
  whatsapp: string | null;
  enabledMethods: CheckoutMethod[];
  wallets: Partial<Record<WalletMethod, WalletAccount>>;
  bank: BankAccount | null;
  codMaxPaisa: number;
  unpaidTtlMinutes: number;
  manualTtlMinutes: number;
  /** v1.11: where customers email payment screenshots; also gets a copy of every order. */
  salesEmail: string | null;
  /** v1.11: cash on delivery switched off in Shop settings ("paused"). */
  codPaused: boolean;
  /** v1.11: optional words shown at checkout while COD is paused. */
  codPauseMessage: string | null;
  /** v1.12: no delivery charge when the customer pays in advance (default on). */
  prepaidFreeDelivery: boolean;
  /** v1.19 (M14): the payment gateway's keys are in the environment file and well-formed. */
  gatewayReady: boolean;
};

export const DEFAULT_MANUAL_TTL_MINUTES = 24 * 60; // v1.12 owner: payment details within 24 hours (v1.11 had 48 h)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Single-line, printable text only (no control characters) — used for settings shown to customers. */
export const cleanLine = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Placeholder numbers from the seed (e.g. +920000000000) count as "not set". */
const realPhone = (v: unknown) => (typeof v === "string" && /\d/.test(v) && !/^\+?(92)?0+$/.test(v.replace(/\s/g, "")) ? v : null);

export function getCheckoutSettings(db: DB | Tx, env: Record<string, string | undefined> = process.env): CheckoutSettings {
  const keys: SettingKey[] = ["store_name", "store_phone", "whatsapp", "enabled_payment_methods", "unpaid_order_ttl_minutes", "manual_tid_ttl_minutes", "sales_email", "cod_pause_message", "prepaid_free_delivery"];
  const rows = db.select().from(settings).where(inArray(settings.key, keys)).all();
  const get = (k: SettingKey) => rows.find((r) => r.key === k)?.value;
  const payment = readPaymentEnv(env);

  const rawEnabled = get("enabled_payment_methods");
  const enabled = (Array.isArray(rawEnabled) ? rawEnabled : []).filter((m): m is CheckoutMethod => (CHECKOUT_METHODS as readonly unknown[]).includes(m));
  const num = (k: SettingKey, fallback: number, min: number, max: number) => {
    const v = get(k);
    return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : fallback;
  };

  return {
    storeName: typeof get("store_name") === "string" ? (get("store_name") as string) : "Caidea",
    storePhone: realPhone(get("store_phone")),
    whatsapp: realPhone(get("whatsapp")),
    enabledMethods: enabled,
    wallets: payment.wallets,
    bank: payment.bank,
    codMaxPaisa: payment.codMaxPaisa,
    unpaidTtlMinutes: num("unpaid_order_ttl_minutes", 30, 5, 7 * 24 * 60),
    manualTtlMinutes: num("manual_tid_ttl_minutes", DEFAULT_MANUAL_TTL_MINUTES, 1, 7 * 24 * 60),
    salesEmail: typeof get("sales_email") === "string" && EMAIL_RE.test(get("sales_email") as string) ? (get("sales_email") as string).toLowerCase() : null,
    codPaused: !enabled.includes("COD"),
    codPauseMessage: cleanLine(get("cod_pause_message"), 200) || null,
    prepaidFreeDelivery: get("prepaid_free_delivery") !== false,
    gatewayReady: readGatewayConfig(env).configured,
  };
}

/** Methods a shopper can actually choose: switched on AND (for wallets/bank) with account details set. */
export function availableMethods(s: CheckoutSettings): CheckoutMethod[] {
  return s.enabledMethods.filter((m) => (m === "COD" ? true : m === "AGGREGATOR" ? s.gatewayReady : m === "BANK_TRANSFER" ? s.bank !== null : s.wallets[m as WalletMethod] !== undefined));
}

export function writeSetting(db: DB | Tx, key: SettingKey, value: unknown, actorId: string) {
  if (value === null || value === undefined) {
    db.delete(settings).where(inArray(settings.key, [key])).run(); // "not set" = no row (value is NOT NULL)
    return;
  }
  db.insert(settings)
    .values({ key, value, updatedBy: actorId, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: actorId, updatedAt: new Date().toISOString() } })
    .run();
}


/** Every way to pay in advance a shopper can choose (online, bank, wallets). v1.11: at least one must exist. */
export const prepaidMethods = (s: CheckoutSettings) => availableMethods(s).filter((m) => m !== "COD");
/** Bank / wallet accounts the customer pays into by hand (the "Which account?" list, the PAY TO block). */
export const manualPrepaidMethods = (s: CheckoutSettings) => prepaidMethods(s).filter((m) => !isOnlineMethod(m));

/** "Pay to" lines for a prepaid method, as shown at checkout, on the order page, in emails and the PDF. */
export function payToLines(s: CheckoutSettings, m: CheckoutMethod): string[] | null {
  if (m === "BANK_TRANSFER") return s.bank ? [`Bank: ${s.bank.bankName}`, `Account title: ${s.bank.accountTitle}`, `IBAN: ${s.bank.iban}`] : null;
  if (m === "COD" || m === "AGGREGATOR") return null;
  const w = s.wallets[m as WalletMethod];
  return w ? [`Account title: ${w.accountTitle}`, `${METHOD_LABEL[m]} number: ${w.accountNumber}`] : null;
}
