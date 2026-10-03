import { z } from "zod";

/**
 * Payment details from the server's environment file (.env.local in development,
 * .env.production on the shop server) — owner request, v1.8.
 *
 * Changing a value needs only an edit to that file and a restart of the app; no code change.
 * The cash-on-delivery limit and every account number live ONLY here (not in the database),
 * so there is one place to look. A missing or malformed value turns that one method off and is
 * listed in `problems` (shown to the owner in Admin → Shop settings).
 */

export const DEFAULT_COD_MAX_PKR = 20_000;

export type WalletKey = "JAZZCASH" | "EASYPAISA" | "NAYAPAY";
export type EnvWallet = { accountTitle: string; accountNumber: string };
export type EnvBank = { bankName: string; accountTitle: string; iban: string };

export type PaymentEnv = {
  codMaxPaisa: number;
  wallets: Partial<Record<WalletKey, EnvWallet>>;
  bank: EnvBank | null;
  /** Human-readable problems with the file, for the owner. */
  problems: string[];
  /** True when any account still has the sample values from .env.example. */
  usesSampleDetails: boolean;
};

export const PAYMENT_ENV_KEYS = [
  "COD_MAX_ORDER_PKR",
  "JAZZCASH_ACCOUNT_TITLE",
  "JAZZCASH_ACCOUNT_NUMBER",
  "EASYPAISA_ACCOUNT_TITLE",
  "EASYPAISA_ACCOUNT_NUMBER",
  "NAYAPAY_ACCOUNT_TITLE",
  "NAYAPAY_ACCOUNT_NUMBER",
  "BANK_NAME",
  "BANK_ACCOUNT_TITLE",
  "BANK_IBAN",
] as const;

const Title = z.string().trim().min(2).max(60);
const AccountNumber = z.string().trim().regex(/^[0-9+\- ]{7,20}$/);
/** Pakistani IBAN: PK + 2 check digits + 4-letter bank code + 16 digits (24 characters). */
export const PK_IBAN = /^PK\d{2}[A-Z]{4}\d{16}$/;

/**
 * ISO 13616 check (v1.9): move the first four characters to the end, turn letters into numbers
 * (A = 10 … Z = 35) and the remainder after dividing by 97 must be 1. Catches a mistyped or
 * swapped digit, so a typo can't send customers' money to the wrong account.
 */
export function isValidPkIban(iban: string): boolean {
  if (!PK_IBAN.test(iban)) return false;
  let remainder = 0;
  for (const ch of iban.slice(4) + iban.slice(0, 4)) {
    const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}
const SAMPLE = /sample/i;

const WALLET_NAMES: Record<WalletKey, string> = { JAZZCASH: "JazzCash", EASYPAISA: "Easypaisa", NAYAPAY: "NayaPay" };

export function readPaymentEnv(env: Record<string, string | undefined> = process.env): PaymentEnv {
  const problems: string[] = [];
  const val = (k: string) => env[k]?.trim() ?? "";

  // Cash-on-delivery limit, whole rupees
  let codMaxPkr = DEFAULT_COD_MAX_PKR;
  const rawCod = val("COD_MAX_ORDER_PKR").replaceAll(",", "");
  if (rawCod) {
    if (/^\d{1,9}$/.test(rawCod)) codMaxPkr = Number(rawCod);
    else problems.push(`COD_MAX_ORDER_PKR “${rawCod}” isn’t a whole number of rupees — using Rs ${DEFAULT_COD_MAX_PKR.toLocaleString("en-PK")}.`);
  }

  const wallets: PaymentEnv["wallets"] = {};
  let sample = false;
  for (const w of Object.keys(WALLET_NAMES) as WalletKey[]) {
    const title = val(`${w}_ACCOUNT_TITLE`);
    const number = val(`${w}_ACCOUNT_NUMBER`);
    if (!title && !number) continue; // not used — method stays off
    if (!Title.safeParse(title).success || !AccountNumber.safeParse(number).success) {
      problems.push(`${WALLET_NAMES[w]}: set both ${w}_ACCOUNT_TITLE and ${w}_ACCOUNT_NUMBER (number: digits, spaces or dashes). ${WALLET_NAMES[w]} is switched off until then.`);
      continue;
    }
    wallets[w] = { accountTitle: title, accountNumber: number };
    if (SAMPLE.test(title)) sample = true;
  }

  let bank: EnvBank | null = null;
  const bankName = val("BANK_NAME");
  const bankTitle = val("BANK_ACCOUNT_TITLE");
  const iban = val("BANK_IBAN").replace(/\s/g, "").toUpperCase();
  if (bankName || bankTitle || iban) {
    if (!Title.safeParse(bankName).success || !Title.safeParse(bankTitle).success || !PK_IBAN.test(iban)) {
      problems.push("Bank transfer: set BANK_NAME, BANK_ACCOUNT_TITLE and BANK_IBAN (24 characters, like PK36SCBL0000001123456702). Bank transfer is switched off until then.");
    } else if (!isValidPkIban(iban)) {
      problems.push(`Bank transfer: BANK_IBAN ${iban} fails the IBAN check-digit test — a character is mistyped. Copy it again from your bank statement or app. Bank transfer is switched off until then.`);
    } else {
      bank = { bankName, accountTitle: bankTitle, iban };
      if (SAMPLE.test(bankTitle) || SAMPLE.test(bankName)) sample = true;
    }
  }

  return { codMaxPaisa: codMaxPkr * 100, wallets, bank, problems, usesSampleDetails: sample };
}
