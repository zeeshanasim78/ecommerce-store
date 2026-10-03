import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { settings, SYSTEM_USER_ID } from "@/db/schema";
import type { SettingKey } from "@/db/schema/system";
import { writeAudit } from "@/server/audit-log";
import { alertRecipients, sendEmail, type EmailResult } from "@/server/notify/email";
import { readPaymentEnv } from "./payment-env";

/**
 * Tamper detection for payment details (v1.9, SPECIFICATION §21).
 *
 * The account numbers customers pay into come from the environment file. If anyone changes them —
 * the owner, or someone who got into the server — the app notices at its next start:
 *   1. it compares a SHA-256 fingerprint of the details with the one it saw last time,
 *   2. writes an audit-log entry with the old and new values,
 *   3. raises an alert in admin (dashboard + Shop settings) until the OWNER acknowledges it,
 *   4. emails ALERT_EMAIL_TO through the shop's Gmail — and the OLD address too if the alert address
 *      itself was changed.
 * These details are shown to every shopper, so they are not secret; the risk is a silent swap.
 */

export type PaymentDetails = {
  codLimit: string;
  jazzcash: string | null;
  easypaisa: string | null;
  nayapay: string | null;
  bank: string | null;
  alertEmail: string | null;
};

export const FIELD_LABEL: Record<keyof PaymentDetails, string> = {
  codLimit: "Cash-on-delivery limit",
  jazzcash: "JazzCash account",
  easypaisa: "Easypaisa account",
  nayapay: "NayaPay account",
  bank: "Bank account",
  alertEmail: "Alert email address",
};

export type FieldChange = { field: keyof PaymentDetails; label: string; before: string | null; after: string | null };
export type SeenRecord = { fingerprint: string; details: PaymentDetails; seenAt: string };
export type AlertRecord = { changedAt: string; changes: FieldChange[]; email?: EmailResult };

/** What customers are actually shown (invalid values are switched off, so they count as "not set"). */
export function currentPaymentDetails(env: Record<string, string | undefined> = process.env): PaymentDetails {
  const p = readPaymentEnv(env);
  const w = (k: "JAZZCASH" | "EASYPAISA" | "NAYAPAY") => (p.wallets[k] ? `${p.wallets[k]!.accountTitle} · ${p.wallets[k]!.accountNumber}` : null);
  const to = alertRecipients(env);
  return {
    codLimit: p.codMaxPaisa > 0 ? `Rs ${(p.codMaxPaisa / 100).toLocaleString("en-PK")}` : "Off",
    jazzcash: w("JAZZCASH"),
    easypaisa: w("EASYPAISA"),
    nayapay: w("NAYAPAY"),
    bank: p.bank ? `${p.bank.bankName} · ${p.bank.accountTitle} · ${p.bank.iban}` : null,
    alertEmail: to.length ? to.join(", ") : null,
  };
}

export function fingerprint(details: PaymentDetails): string {
  const ordered = (Object.keys(FIELD_LABEL) as (keyof PaymentDetails)[]).map((k) => [k, details[k]]);
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

function readJson<T>(db: DB | Tx, key: SettingKey): T | null {
  const v = db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).get()?.value;
  return (v && typeof v === "object" ? v : null) as T | null;
}
function writeJson(db: Tx, key: SettingKey, value: unknown) {
  const now = new Date().toISOString();
  db.insert(settings)
    .values({ key, value, updatedBy: SYSTEM_USER_ID, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: SYSTEM_USER_ID, updatedAt: now } })
    .run();
}

export const getSeenPaymentDetails = (db: DB) => readJson<SeenRecord>(db, "payment_details_seen");
export const getPaymentAlert = (db: DB) => readJson<AlertRecord>(db, "payment_details_alert");

const SYSTEM_CTX = { ip: "server", userAgent: "startup check" };

export type CheckResult =
  | { status: "baseline"; fingerprint: string }
  | { status: "unchanged"; fingerprint: string }
  | { status: "changed"; fingerprint: string; changes: FieldChange[]; notify: string[] };

/** Compares the current details with the last ones seen and records any change. Synchronous, one transaction. */
export function checkPaymentDetails(db: DB, env: Record<string, string | undefined> = process.env, now: Date = new Date()): CheckResult {
  const details = currentPaymentDetails(env);
  const fp = fingerprint(details);
  return db.transaction(
    (tx): CheckResult => {
      const seen = readJson<SeenRecord>(tx, "payment_details_seen");
      if (seen?.fingerprint === fp) return { status: "unchanged", fingerprint: fp };

      writeJson(tx, "payment_details_seen", { fingerprint: fp, details, seenAt: now.toISOString() } satisfies SeenRecord);
      if (!seen) {
        writeAudit(tx, SYSTEM_CTX, { actorId: SYSTEM_USER_ID, action: "payment_details.baseline", entity: "settings", entityId: "payment_details", after: details });
        return { status: "baseline", fingerprint: fp };
      }

      // Merge with an alert the owner hasn't acknowledged yet, so "before" stays the last confirmed value
      const open = readJson<AlertRecord>(tx, "payment_details_alert");
      // A field already in the open alert keeps its "before" even when that was "not set" (null)
      const confirmedBefore = (field: keyof PaymentDetails) => {
        const pending = open?.changes.find((c) => c.field === field);
        return pending ? pending.before : (seen.details[field] ?? null);
      };
      const changes: FieldChange[] = (Object.keys(FIELD_LABEL) as (keyof PaymentDetails)[])
        .map((field) => ({ field, label: FIELD_LABEL[field], before: confirmedBefore(field), after: details[field] }))
        .filter((c) => c.before !== c.after);

      if (changes.length === 0) {
        // Changed back to the confirmed values before anyone acknowledged: nothing left to warn about
        tx.delete(settings).where(inArray(settings.key, ["payment_details_alert"])).run();
        writeAudit(tx, SYSTEM_CTX, { actorId: SYSTEM_USER_ID, action: "payment_details.reverted", entity: "settings", entityId: "payment_details", after: details });
        return { status: "unchanged", fingerprint: fp };
      }

      writeJson(tx, "payment_details_alert", { changedAt: now.toISOString(), changes } satisfies AlertRecord);
      writeAudit(tx, SYSTEM_CTX, {
        actorId: SYSTEM_USER_ID,
        action: "payment_details.changed",
        entity: "settings",
        entityId: "payment_details",
        before: Object.fromEntries(changes.map((c) => [c.field, c.before])),
        after: Object.fromEntries(changes.map((c) => [c.field, c.after])),
      });
      // Tell the new alert address AND the previous one (so changing the address can't hide the alert)
      const previous = (seen.details.alertEmail ?? "").split(",").map((a) => a.trim()).filter(Boolean);
      return { status: "changed", fingerprint: fp, changes, notify: [...new Set([...alertRecipients(env), ...previous])] };
    },
    { behavior: "immediate" },
  );
}

export function alertEmailText(changes: FieldChange[], changedAt: string): { subject: string; text: string } {
  const lines = changes.map((c) => `• ${c.label}\n    was: ${c.before ?? "(not set)"}\n    now: ${c.after ?? "(not set)"}`);
  return {
    subject: "Caidea: payment details changed - please confirm",
    text: [
      "The payment details shown to customers at checkout changed when the Caidea app started.",
      `Time: ${changedAt} (UTC)`,
      "",
      ...lines,
      "",
      "If YOU made this change: sign in, open Admin → Shop settings and press “I made this change”.",
      "If you did NOT: customers may be paying someone else. Switch off the affected payment method in Shop settings,",
      "restore the correct values in the environment file on the server, restart the app, and change the server passwords.",
    ].join("\n"),
  };
}

/**
 * Runs the check and, when something changed, emails the alert and records whether it was sent.
 * Never throws: a failed email must not stop the shop from starting.
 */
export async function runPaymentIntegrityCheck(db: DB, env: Record<string, string | undefined> = process.env, now: Date = new Date()): Promise<CheckResult> {
  const result = checkPaymentDetails(db, env, now);
  if (result.status !== "changed") return result;
  console.warn(`[caidea] Payment details changed: ${result.changes.map((c) => c.label).join(", ")}. Owner alert raised.`);

  const { subject, text } = alertEmailText(result.changes, now.toISOString());
  const email = await sendEmail(db, { to: result.notify, subject, text, priority: "security" }, env, now).catch((e): EmailResult => ({ sent: false, detail: String(e) }));
  db.transaction(
    (tx) => {
      const open = readJson<AlertRecord>(tx, "payment_details_alert");
      if (open) writeJson(tx, "payment_details_alert", { ...open, email } satisfies AlertRecord);
      writeAudit(tx, SYSTEM_CTX, { actorId: SYSTEM_USER_ID, action: email.sent ? "payment_details.alert_emailed" : "payment_details.alert_email_failed", entity: "settings", entityId: "payment_details", after: email });
    },
    { behavior: "immediate" },
  );
  if (!email.sent) console.warn(`[caidea] ${email.detail}`);
  return result;
}

/** Owner confirms the change was theirs. Audited with who and when. */
export function acknowledgePaymentAlert(db: DB, actorId: string, ctx: { ip: string; userAgent: string | null }): boolean {
  return db.transaction(
    (tx) => {
      const open = readJson<AlertRecord>(tx, "payment_details_alert");
      if (!open) return false;
      tx.delete(settings).where(inArray(settings.key, ["payment_details_alert"])).run();
      writeAudit(tx, ctx, { actorId, action: "payment_details.acknowledged", entity: "settings", entityId: "payment_details", before: open });
      return true;
    },
    { behavior: "immediate" },
  );
}
