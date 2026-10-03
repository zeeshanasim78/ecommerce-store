"use server";

import { db } from "@/db/client";
import { normalisePkMobile } from "@/lib/phone";
import { attempt, goTo } from "@/server/action-helpers";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";
import { alertRecipients, sendEmail } from "@/server/notify/email";
import { acknowledgePaymentAlert } from "@/server/settings/payment-integrity";
import { CHECKOUT_METHODS, cleanLine, getCheckoutSettings, writeSetting } from "@/server/settings/store-settings";

const PATH = "/admin/settings";

/**
 * Saves the parts of Shop settings kept in the database. The cash-on-delivery limit and the
 * account numbers come from the environment file (v1.8) and are only shown on this page.
 */
export async function saveShopSettings(formData: FormData) {
  const staff = await requireStaff("settings");
  const fail = (error: string) => goTo(PATH, { error });

  const phone = text(formData, "storePhone");
  const whatsapp = text(formData, "whatsapp");
  const storePhone = phone ? (normalisePkMobile(phone) ?? (/^\+?[\d\s()-]{7,20}$/.test(phone) ? phone : null)) : null;
  if (phone && !storePhone) fail("Shop phone: enter a phone number like 0300 1234567 or 042 1234567.");
  const wa = whatsapp ? normalisePkMobile(whatsapp) : null;
  if (whatsapp && !wa) fail("WhatsApp: enter a mobile number like 0300 1234567.");

  // v1.11: cash on delivery has its own On / Paused switch; the others are checkboxes
  const codOn = formData.get("cod") === "on";
  const methods = CHECKOUT_METHODS.filter((m) => (m === "COD" ? codOn : formData.get(`method:${m}`) === "on"));
  const codMessage = cleanLine(text(formData, "codPauseMessage"), 200) || null;
  const freeDelivery = formData.get("prepaidFreeDelivery") === "on";
  const salesEmail = text(formData, "salesEmail").toLowerCase() || null;
  if (salesEmail && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(salesEmail) || salesEmail.length > 120)) fail("Sales email: enter an address like sales@caidea.pk.");
  const ttlHours = Number(text(formData, "manualTtlHours"));
  if (!Number.isFinite(ttlHours) || ttlHours < 1 || ttlHours > 168) fail("Payment waiting time: between 1 and 168 hours.");

  const ctx = await auditContext();
  const r = attempt(() =>
    db.transaction(
      (tx) => {
        const before = getCheckoutSettings(tx);
        writeSetting(tx, "store_phone", storePhone, staff.id);
        writeSetting(tx, "whatsapp", wa, staff.id);
        writeSetting(tx, "enabled_payment_methods", methods, staff.id);
        writeSetting(tx, "manual_tid_ttl_minutes", Math.round(ttlHours * 60), staff.id);
        writeSetting(tx, "sales_email", salesEmail, staff.id);
        writeSetting(tx, "cod_pause_message", codMessage, staff.id);
        writeSetting(tx, "prepaid_free_delivery", freeDelivery, staff.id);
        const after = getCheckoutSettings(tx);
        const pick = (x: typeof before) => ({ storePhone: x.storePhone, whatsapp: x.whatsapp, salesEmail: x.salesEmail, enabledMethods: x.enabledMethods, codPauseMessage: x.codPauseMessage, prepaidFreeDelivery: x.prepaidFreeDelivery, manualTtlMinutes: x.manualTtlMinutes });
        writeAudit(tx, ctx, { actorId: staff.id, action: "settings.update", entity: "settings", before: pick(before), after: pick(after) });
        return { before, after };
      },
      { behavior: "immediate" },
    ),
  );
  if (!r.ok) return fail(r.error);
  revalidateStorefront();
  // v1.11: customers send payment screenshots to these contacts, so a change is emailed to ALERT_EMAIL_TO
  const note = await notifyContactChange(r.value.before, r.value.after, staff.name);
  goTo(PATH, { saved: `Shop settings saved.${note}` });
}

type Contacts = { storePhone: string | null; whatsapp: string | null; salesEmail: string | null };
async function notifyContactChange(before: Contacts, after: Contacts, who: string): Promise<string> {
  const label = { storePhone: "Shop phone", whatsapp: "WhatsApp", salesEmail: "Sales email" } as const;
  const changed = (Object.keys(label) as (keyof Contacts)[]).filter((k) => before[k] !== after[k]);
  if (!changed.length) return "";
  const lines = changed.map((k) => `${label[k]}\n  was: ${before[k] ?? "(not set)"}\n  now: ${after[k] ?? "(not set)"}`);
  const r = await sendEmail(db, {
    to: alertRecipients(),
    subject: "Caidea: shop contact details changed",
    text: `${who} changed the contact details in Admin → Shop settings at ${new Date().toISOString()} (UTC).\nCustomers send payment screenshots to these, so check this was you.\n\n${lines.join("\n\n")}`,
    priority: "security",
  });
  return r.sent ? " The alert address was emailed about the contact change." : "";
}

/** Owner confirms a change to the payment details was theirs (v1.9). Audited. */
export async function acknowledgePaymentChange() {
  const staff = await requireStaff("settings");
  const done = acknowledgePaymentAlert(db, staff.id, await auditContext());
  goTo(PATH, done ? { saved: "Thanks — the change is confirmed and recorded in the audit log." } : {});
}

/** Owner sends a test email through the shop's Gmail to ALERT_EMAIL_TO (v1.10). Audited; counts toward the daily limit. */
export async function sendTestEmail() {
  const staff = await requireStaff("settings");
  const to = alertRecipients();
  const result = await sendEmail(db, {
    to,
    subject: "Caidea: test email",
    text: `This is a test from Admin → Shop settings, sent by ${staff.name} at ${new Date().toISOString()} (UTC).\nIf you can read this, payment-detail alerts will reach you too.`,
  });
  const ctx = await auditContext();
  db.transaction((tx) => writeAudit(tx, ctx, { actorId: staff.id, action: result.sent ? "email.test_sent" : "email.test_failed", entity: "settings", entityId: "email", after: result }));
  goTo(PATH, result.sent ? { saved: `Test email sent to ${to.join(", ")}. Check the inbox (and the spam folder the first time).` } : { error: result.detail });
}
