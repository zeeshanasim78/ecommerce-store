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
import { liveGatewayDeps, readGatewayConfig } from "@/server/payments";
import { expireOnlineOrders, reconcilePending } from "@/server/payments/online";
import { sendOrderEmail } from "@/server/notify/order-emails";
import { orders, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
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

/** Owner checks the payment gateway keys with one harmless authenticated call (v1.19, M14). Audited. */
export async function testGatewayConnection() {
  const staff = await requireStaff("settings");
  const cfg = readGatewayConfig();
  let result: { ok: boolean; detail: string };
  if (!cfg.configured) result = { ok: false, detail: cfg.problems[0] ?? "Online payment isn’t set up in the environment file." };
  else {
    try {
      await liveGatewayDeps().gateway().ping();
      result = { ok: true, detail: "The payment gateway answered and accepted the keys." };
    } catch (e) {
      result = { ok: false, detail: e instanceof Error ? e.message : "The payment gateway couldn’t be reached." };
    }
  }
  const ctx = await auditContext();
  db.transaction((tx) => writeAudit(tx, ctx, { actorId: staff.id, action: result.ok ? "gateway.test_ok" : "gateway.test_failed", entity: "settings", entityId: "gateway", after: { ...result, vendor: cfg.vendor } }));
  goTo(PATH, result.ok ? { saved: result.detail } : { error: result.detail });
}

/** Owner asks the gateway about every unsettled online payment now, instead of waiting for the 10-minute timer. Audited. */
export async function reconcilePaymentsNow() {
  const staff = await requireStaff("settings");
  const deps = liveGatewayDeps();
  if (!deps.isConfigured()) goTo(PATH, { error: "Online payment isn’t set up." });
  const summary = await reconcilePending(db, deps, new Date(), { minAgeSeconds: 0 });
  const cancelled = await expireOnlineOrders(db, deps);
  const value = { at: new Date().toISOString(), by: staff.name, ...summary, cancelled };
  db.insert(settings).values({ key: "payment_reconcile_last", value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: value.at } }).run();
  for (const code of summary.paid) {
    const o = db.select({ id: orders.id }).from(orders).where(eq(orders.code, code)).get();
    if (o) await sendOrderEmail(db, { orderId: o.id, kind: "PAYMENT_CONFIRMED", actorId: staff.id });
  }
  const ctx = await auditContext();
  db.transaction((tx) => writeAudit(tx, ctx, { actorId: staff.id, action: "gateway.reconcile_now", entity: "settings", entityId: "gateway", after: value }));
  revalidateStorefront();
  goTo(PATH, { saved: `Asked the payment company about ${summary.checked} payment${summary.checked === 1 ? "" : "s"}: ${summary.paid.length} newly paid, ${summary.latePayments.length} paid after cancel, ${summary.mismatches.length} amount mismatch, ${cancelled.length} unpaid order${cancelled.length === 1 ? "" : "s"} cancelled.${summary.errors.length ? ` ${summary.errors.length} could not be checked: ${summary.errors[0]}` : ""}` });
}
