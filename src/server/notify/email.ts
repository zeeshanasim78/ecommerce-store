import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { settings, SYSTEM_USER_ID } from "@/db/schema";

/**
 * ALL email the shop sends goes through this file, and only through Gmail (owner decision, v1.10).
 * Other code must call `sendEmail()` — a unit test fails if anything else imports nodemailer.
 *
 * Gmail's free tier: a personal account can send to about 500 recipients a day; going over blocks
 * sending for up to 24 hours. So every recipient is counted per Karachi calendar day and ordinary
 * mail stops at GMAIL_DAILY_LIMIT (default 450). Security alerts may use the rest, up to 500.
 *
 * Sign-in, chosen with GMAIL_AUTH in the environment file:
 *  - app_password (default): GMAIL_USER + GMAIL_APP_PASSWORD (16 letters; needs 2-Step Verification)
 *  - oauth2: GMAIL_USER + GMAIL_OAUTH_CLIENT_ID + GMAIL_OAUTH_CLIENT_SECRET + GMAIL_OAUTH_REFRESH_TOKEN
 *    (Google Cloud project, Gmail scope https://mail.google.com/; nodemailer swaps the refresh token
 *    for short-lived access tokens itself)
 */

export const GMAIL_SMTP_HOST = "smtp.gmail.com";
export const GMAIL_SMTP_PORT = 465; // TLS from the first byte
export const GMAIL_FREE_DAILY_RECIPIENTS = 500;
export const DEFAULT_DAILY_LIMIT = 450;

export const EMAIL_ENV_KEYS = [
  "GMAIL_USER",
  "GMAIL_FROM_NAME",
  "GMAIL_AUTH",
  "GMAIL_APP_PASSWORD",
  "GMAIL_OAUTH_CLIENT_ID",
  "GMAIL_OAUTH_CLIENT_SECRET",
  "GMAIL_OAUTH_REFRESH_TOKEN",
  "GMAIL_DAILY_LIMIT",
  "ALERT_EMAIL_TO",
  "EMAIL_TEST_SMTP",
] as const;
/** v1.9 names, no longer read — reported in Shop settings if still present. */
export const RETIRED_EMAIL_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "ALERT_EMAIL_FROM"] as const;

type Env = Record<string, string | undefined>;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type GmailConfig = {
  configured: boolean;
  mode: "app_password" | "oauth2";
  user: string | null;
  fromName: string;
  dailyLimit: number;
  /** Set only by automated tests: a mail server on this same machine instead of Gmail. */
  testServer: { host: string; port: number } | null;
  problems: string[];
  warnings: string[];
};

export function readGmailConfig(env: Env = process.env): GmailConfig {
  const v = (k: string) => env[k]?.trim() ?? "";
  const problems: string[] = [];
  const warnings: string[] = [];

  const user = v("GMAIL_USER").toLowerCase();
  const rawMode = v("GMAIL_AUTH").toLowerCase() || "app_password";
  const mode = rawMode === "oauth2" ? "oauth2" : "app_password";
  if (rawMode !== "app_password" && rawMode !== "oauth2") problems.push(`GMAIL_AUTH “${rawMode}” isn’t known — use app_password or oauth2.`);

  let configured = false;
  if (!user) {
    if (v("GMAIL_APP_PASSWORD") || v("GMAIL_OAUTH_REFRESH_TOKEN")) problems.push("GMAIL_USER is empty — set it to the shop’s Gmail address.");
  } else if (!EMAIL.test(user)) {
    problems.push(`GMAIL_USER “${user}” isn’t an email address.`);
  } else if (mode === "app_password") {
    const pass = v("GMAIL_APP_PASSWORD").replace(/\s/g, "");
    if (!pass) problems.push("GMAIL_APP_PASSWORD is empty — create a 16-letter app password in the Google Account (Security → 2-Step Verification → App passwords).");
    else if (!/^[a-z]{16}$/i.test(pass)) problems.push("GMAIL_APP_PASSWORD should be the 16-letter app password from Google, not the normal Gmail password.");
    else configured = true;
  } else {
    const missing = ["GMAIL_OAUTH_CLIENT_ID", "GMAIL_OAUTH_CLIENT_SECRET", "GMAIL_OAUTH_REFRESH_TOKEN"].filter((k) => !v(k));
    if (missing.length) problems.push(`GMAIL_AUTH=oauth2 needs ${missing.join(", ")}.`);
    else configured = true;
  }
  if (user && !/@(gmail|googlemail)\.com$/.test(user) && configured) warnings.push(`${user} isn’t a gmail.com address — that works if it is a Google Workspace account (Workspace has its own sending limits).`);

  let dailyLimit = DEFAULT_DAILY_LIMIT;
  const rawLimit = v("GMAIL_DAILY_LIMIT");
  if (rawLimit) {
    if (/^\d{1,4}$/.test(rawLimit) && Number(rawLimit) >= 1 && Number(rawLimit) <= GMAIL_FREE_DAILY_RECIPIENTS) dailyLimit = Number(rawLimit);
    else problems.push(`GMAIL_DAILY_LIMIT must be a whole number from 1 to ${GMAIL_FREE_DAILY_RECIPIENTS} (Gmail’s free limit) — using ${DEFAULT_DAILY_LIMIT}.`);
  }

  // Test hook: only a mail server on THIS machine is accepted, so mail can never be diverted elsewhere
  let testServer: GmailConfig["testServer"] = null;
  const rawTest = v("EMAIL_TEST_SMTP");
  if (rawTest) {
    const m = /^(127\.0\.0\.1|localhost):(\d{1,5})$/i.exec(rawTest);
    if (m) {
      testServer = { host: m[1]!, port: Number(m[2]) };
      configured = true;
      warnings.push(`EMAIL_TEST_SMTP is set: email goes to a TEST mail server on this machine (${rawTest}), not to Gmail. Remove it on the live server.`);
    } else {
      problems.push("EMAIL_TEST_SMTP is only for automated tests and must look like 127.0.0.1:2525 — it was ignored.");
    }
  }

  const presentRetired = RETIRED_EMAIL_KEYS.filter((k) => v(k));
  if (presentRetired.length) warnings.push(`${presentRetired.join(", ")} ${presentRetired.length === 1 ? "is" : "are"} no longer used — email now goes through Gmail (GMAIL_*). Remove ${presentRetired.length === 1 ? "it" : "them"} from the environment file.`);

  return { configured, mode, user: user || null, fromName: v("GMAIL_FROM_NAME") || "Caidea", dailyLimit, testServer, problems, warnings };
}

/** Connection settings for nodemailer. Separate so tests can check them without sending. */
export function gmailTransportOptions(env: Env = process.env): SMTPTransport.Options {
  const c = readGmailConfig(env);
  const timeouts = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };
  if (c.testServer) return { host: c.testServer.host, port: c.testServer.port, secure: false, ignoreTLS: true, ...timeouts };
  const auth =
    c.mode === "oauth2"
      ? {
          type: "OAuth2" as const,
          user: c.user ?? "",
          clientId: env.GMAIL_OAUTH_CLIENT_ID?.trim(),
          clientSecret: env.GMAIL_OAUTH_CLIENT_SECRET?.trim(),
          refreshToken: env.GMAIL_OAUTH_REFRESH_TOKEN?.trim(),
        }
      : { user: c.user ?? "", pass: (env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "") };
  return { host: GMAIL_SMTP_HOST, port: GMAIL_SMTP_PORT, secure: true, auth, ...timeouts };
}

/** ALERT_EMAIL_TO may hold several addresses separated by commas. */
export function alertRecipients(env: Env = process.env): string[] {
  return (env.ALERT_EMAIL_TO ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => EMAIL.test(a));
}

// ---- Daily counter (Gmail free tier) -------------------------------------------------------

type Counter = { day: string; recipients: number };
const karachiDay = (now: Date) => new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10);

export function emailsSentToday(db: DB, now: Date = new Date()): number {
  const v = db.select({ value: settings.value }).from(settings).where(eq(settings.key, "email_daily_count")).get()?.value as Counter | undefined;
  return v && v.day === karachiDay(now) ? v.recipients : 0;
}

/** Reserves room for `n` recipients today, atomically. Returns false if that would pass the cap. */
function reserve(db: DB, n: number, cap: number, now: Date): boolean {
  return db.transaction(
    (tx) => {
      const v = tx.select({ value: settings.value }).from(settings).where(eq(settings.key, "email_daily_count")).get()?.value as Counter | undefined;
      const used = v && v.day === karachiDay(now) ? v.recipients : 0;
      if (used + n > cap) return false;
      const value: Counter = { day: karachiDay(now), recipients: used + n };
      tx.insert(settings)
        .values({ key: "email_daily_count", value, updatedBy: SYSTEM_USER_ID })
        .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now.toISOString() } })
        .run();
      return true;
    },
    { behavior: "immediate" },
  );
}

// ---- Sending ---------------------------------------------------------------------------------

export type EmailResult = { sent: boolean; detail: string };
export type EmailMessage = { to: string[]; subject: string; text: string; priority?: "normal" | "security" };

/** Never throws. Returns whether the message left and why not. */
export async function sendEmail(db: DB, message: EmailMessage, env: Env = process.env, now: Date = new Date()): Promise<EmailResult> {
  const c = readGmailConfig(env);
  const to = [...new Set(message.to.map((a) => a.trim().toLowerCase()).filter((a) => EMAIL.test(a)))];
  if (!c.configured) return { sent: false, detail: `Email isn’t set up: ${c.problems[0] ?? "fill in GMAIL_USER and GMAIL_APP_PASSWORD in the environment file."}` };
  if (to.length === 0) return { sent: false, detail: "No valid recipient (check ALERT_EMAIL_TO)." };

  const cap = message.priority === "security" ? GMAIL_FREE_DAILY_RECIPIENTS : c.dailyLimit;
  if (!reserve(db, to.length, cap, now)) {
    return { sent: false, detail: `Not sent: today’s Gmail allowance is used up (${emailsSentToday(db, now)} of ${cap} recipients). Sending resumes after midnight.` };
  }

  const transport = nodemailer.createTransport(gmailTransportOptions(env));
  try {
    await transport.sendMail({
      from: { name: c.fromName, address: c.user ?? "test@localhost" },
      to,
      subject: message.subject,
      text: message.text,
    });
    return { sent: true, detail: `Sent from ${c.testServer ? "the TEST mail server" : c.user} to ${to.join(", ")}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const hint = /535|Username and Password not accepted|invalid_grant|BadCredentials/i.test(msg)
      ? " — Gmail refused the sign-in: check GMAIL_USER and create a new app password (changing the Gmail password cancels old app passwords)."
      : /550|limit|quota/i.test(msg)
        ? " — Gmail’s sending limit may have been reached; it resets within 24 hours."
        : "";
    return { sent: false, detail: `Email could not be sent: ${msg}${hint}` };
  } finally {
    transport.close();
  }
}
