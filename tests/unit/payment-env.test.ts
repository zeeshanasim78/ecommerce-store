import { describe, expect, it } from "vitest";
import { DEFAULT_COD_MAX_PKR, isValidPkIban, readPaymentEnv } from "@/server/settings/payment-env";

/** v1.8 — COD limit and account numbers come from the environment file (owner request). */

describe("readPaymentEnv", () => {
  it("defaults the cash-on-delivery limit to Rs 20,000 when it isn't set", () => {
    expect(DEFAULT_COD_MAX_PKR).toBe(20_000);
    expect(readPaymentEnv({}).codMaxPaisa).toBe(2_000_000);
    expect(readPaymentEnv({ COD_MAX_ORDER_PKR: "35,000" }).codMaxPaisa).toBe(3_500_000);
    expect(readPaymentEnv({ COD_MAX_ORDER_PKR: "0" }).codMaxPaisa).toBe(0);
  });

  it("falls back to the default and reports a malformed limit", () => {
    const r = readPaymentEnv({ COD_MAX_ORDER_PKR: "twenty" });
    expect(r.codMaxPaisa).toBe(2_000_000);
    expect(r.problems[0]).toMatch(/COD_MAX_ORDER_PKR/);
  });

  it("reads wallet and bank accounts; a blank pair simply isn't offered", () => {
    const r = readPaymentEnv({
      JAZZCASH_ACCOUNT_TITLE: "Caidea Traders",
      JAZZCASH_ACCOUNT_NUMBER: "0300-1234567",
      BANK_NAME: "Meezan Bank",
      BANK_ACCOUNT_TITLE: "Caidea Traders",
      BANK_IBAN: "pk40 mezn 0000 0011 2345 6702",
    });
    expect(r.wallets).toEqual({ JAZZCASH: { accountTitle: "Caidea Traders", accountNumber: "0300-1234567" } });
    expect(r.bank).toEqual({ bankName: "Meezan Bank", accountTitle: "Caidea Traders", iban: "PK40MEZN0000001123456702" });
    expect(r.problems).toEqual([]);
    expect(r.usesSampleDetails).toBe(false);
  });

  it("switches a half-filled or invalid account off and says why", () => {
    const r = readPaymentEnv({ EASYPAISA_ACCOUNT_NUMBER: "0345-1234567", BANK_NAME: "X Bank", BANK_ACCOUNT_TITLE: "Caidea", BANK_IBAN: "PK123" });
    expect(r.wallets.EASYPAISA).toBeUndefined();
    expect(r.bank).toBeNull();
    expect(r.problems.join(" ")).toMatch(/Easypaisa.*EASYPAISA_ACCOUNT_TITLE/);
    expect(r.problems.join(" ")).toMatch(/BANK_IBAN/);
  });

  it("flags the sample values from .env.example", () => {
    expect(readPaymentEnv({ JAZZCASH_ACCOUNT_TITLE: "Caidea Traders (SAMPLE)", JAZZCASH_ACCOUNT_NUMBER: "0300-0000000" }).usesSampleDetails).toBe(true);
  });
});

describe("IBAN check digits (v1.9)", () => {
  it("accepts IBANs whose check digits are right", () => {
    for (const iban of ["PK36SCBL0000001123456702", "PK40MEZN0000001123456702", "PK56SAMP0000000000000000"]) expect(isValidPkIban(iban)).toBe(true);
  });

  it("rejects a single mistyped digit, swapped digits or the wrong check digits", () => {
    expect(isValidPkIban("PK36SCBL0000001123456703")).toBe(false); // last digit typed wrong
    expect(isValidPkIban("PK36SCBL0000001123465702")).toBe(false); // two digits swapped
    expect(isValidPkIban("PK00SAMP0000000000000000")).toBe(false); // the old v1.8 sample
    expect(isValidPkIban("PK36SCBL000000112345670")).toBe(false); // 23 characters
  });

  it("switches bank transfer off and explains a bad check digit", () => {
    const r = readPaymentEnv({ BANK_NAME: "Standard Chartered", BANK_ACCOUNT_TITLE: "Caidea Traders", BANK_IBAN: "PK36SCBL0000001123456703" });
    expect(r.bank).toBeNull();
    expect(r.problems[0]).toMatch(/check-digit.*mistyped/);
  });
});
