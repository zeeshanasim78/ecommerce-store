import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

/**
 * `npm run setup:env` — creates .env.local for development with fresh random secrets and the
 * payment settings (v1.8) filled with SAMPLE values. Never overwrites a value that is already set:
 * on an existing file it only adds keys that are missing.
 */
const file = ".env.local";

const PAYMENT_BLOCK = [
  "",
  "# Payments (v1.8) — edit, then restart the app. Replace the SAMPLE values before going live.",
  "COD_MAX_ORDER_PKR=20000",
  "JAZZCASH_ACCOUNT_TITLE=Caidea Traders (SAMPLE)",
  "JAZZCASH_ACCOUNT_NUMBER=0300-0000000",
  "EASYPAISA_ACCOUNT_TITLE=Caidea Traders (SAMPLE)",
  "EASYPAISA_ACCOUNT_NUMBER=0345-0000000",
  "NAYAPAY_ACCOUNT_TITLE=",
  "NAYAPAY_ACCOUNT_NUMBER=",
  "BANK_NAME=Sample Bank",
  "BANK_ACCOUNT_TITLE=Caidea Traders (SAMPLE)",
  "BANK_IBAN=PK56SAMP0000000000000000",
  "",
  "# Email through Gmail (v1.10) — see .env.example for how to get an app password.",
  "GMAIL_USER=",
  "GMAIL_FROM_NAME=Caidea",
  "GMAIL_AUTH=app_password",
  "GMAIL_APP_PASSWORD=",
  "GMAIL_OAUTH_CLIENT_ID=",
  "GMAIL_OAUTH_CLIENT_SECRET=",
  "GMAIL_OAUTH_REFRESH_TOKEN=",
  "GMAIL_DAILY_LIMIT=450",
  "ALERT_EMAIL_TO=",
  "EMAIL_TEST_SMTP=",
];

if (!existsSync(file)) {
  writeFileSync(
    file,
    [
      "# Created by `npm run setup:env`. Keep this file private — it is not committed.",
      `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64")}`,
      "BETTER_AUTH_URL=http://localhost:3000",
      `CRON_SECRET=${randomBytes(32).toString("hex")}`,
      ...PAYMENT_BLOCK,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(`Created ${file} with new secrets and sample payment details.`);
} else {
  let current = readFileSync(file, "utf8");
  // v1.10: email moved from generic SMTP_* to Gmail (GMAIL_*). Carry over a Gmail sign-in, drop the old lines.
  const old = (k: string) => new RegExp(`^${k}=(.*)$`, "m").exec(current)?.[1]?.trim() ?? "";
  if (/^SMTP_HOST=/m.test(current)) {
    const carry: string[] = [];
    if (/gmail|google/i.test(old("SMTP_HOST")) && old("SMTP_USER") && !/^GMAIL_USER=/m.test(current)) {
      carry.push(`GMAIL_USER=${old("SMTP_USER")}`, `GMAIL_APP_PASSWORD=${old("SMTP_PASS")}`);
    }
    current = current.replace(/^(SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|ALERT_EMAIL_FROM)=.*\n?/gm, "").replace(/^# Security alert emails \(v1\.9\).*\n?/m, "");
    if (carry.length) current += `\n# Moved from SMTP_* by \`npm run setup:env\` (v1.10)\n${carry.join("\n")}\n`;
    writeFileSync(file, current, { mode: 0o600 });
    console.log(`Removed the old SMTP_* email settings (email now goes through Gmail)${carry.length ? " and kept your Gmail sign-in" : ""}.`);
  }
  // v1.9: the v1.8 sample IBAN had wrong check digits; swap OUR old sample for the corrected one
  if (/^BANK_IBAN=PK00SAMP0000000000000000$/m.test(current)) {
    current = current.replace(/^BANK_IBAN=PK00SAMP0000000000000000$/m, "BANK_IBAN=PK56SAMP0000000000000000");
    writeFileSync(file, current, { mode: 0o600 });
    console.log("Updated the sample BANK_IBAN to one with valid check digits (PK56SAMP0000000000000000).");
  }
  const has = (key: string) => new RegExp(`^${key}=`, "m").test(current);
  const isSetting = (line: string) => !line.startsWith("#") && line.includes("=");
  const missingKeys = PAYMENT_BLOCK.filter((line) => isSetting(line) && !has(line.split("=")[0]!));
  // Comments are added only together with at least one missing setting
  const missing = ["", "# Added by `npm run setup:env` — see .env.example for what each setting does.", ...missingKeys];
  if (missingKeys.length === 0) {
    console.log(`${file} already has every key — left unchanged.`);
  } else {
    appendFileSync(file, missing.join("\n") + "\n");
    console.log(`Added ${missingKeys.length} missing setting(s) to ${file}: ${missingKeys.map((l) => l.split("=")[0]).join(", ")}`);
  }
}
