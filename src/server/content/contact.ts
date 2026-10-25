import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connection";
import { contactMessages, settings } from "@/db/schema";
import { MESSAGE_STATUSES } from "@/db/schema/content";
import { normalisePkMobile } from "@/lib/phone";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { alertRecipients, sendEmail, type EmailResult } from "@/server/notify/email";
import { siteUrl } from "@/server/site-url";
import { ContentError, multiLine, oneLine } from "./errors";

/**
 * Contact form (SPECIFICATION.md §2 /contact, §4.14 contact_messages, §30). No Next.js imports.
 * Anti-abuse, in layers: a hidden "website" field that people never fill (bots do) is silently dropped;
 * the page action adds a per-address limit; here a shop-wide daily cap stops a flood from filling the
 * database or Gmail's free allowance; an identical repeat message is stored once.
 */

export const CONTACT_SUBJECTS = ["Order question", "Product or fitting question", "Wholesale / technician pricing", "Warranty or return", "Something else"] as const;
export const CONTACT_DAILY_CAP = 50;
export const CONTACT_IP_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 } as const;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type ContactInput = { name: string; phone?: string; email?: string; subject?: string; message: string; website?: string };
export type ContactResult = { ok: true; id: string | null; duplicate?: boolean; dropped?: boolean } | { ok: false; error: string };

const Clean = z.object({
  name: z.string().min(2, "Please tell us your name."),
  phone: z.string().nullable(),
  email: z.string().regex(EMAIL_RE, "That email address doesn’t look right.").max(160).nullable(),
  subject: z.string().max(100).nullable(),
  message: z.string().min(10, "Please write a little more (at least 10 letters).").max(2000, "Please keep the message under 2,000 characters."),
});

function cleanPhone(v: string | undefined): string | null | "bad" {
  const raw = oneLine(v, 40);
  if (!raw) return null;
  const mobile = normalisePkMobile(raw);
  if (mobile) return mobile;
  const digits = raw.replace(/[\s()-]/g, "");
  return /^\+?\d{7,15}$/.test(digits) ? digits : "bad";
}

export function submitContactMessage(db: DB, input: ContactInput, now = new Date()): ContactResult {
  // Bots fill every field. Pretend it worked so they learn nothing, and store nothing.
  if ((input.website ?? "").trim() !== "") return { ok: true, id: null, dropped: true };

  const phone = cleanPhone(input.phone);
  if (phone === "bad") return { ok: false, error: "That phone number doesn’t look right. Use a mobile like 0300 1234567." };
  const subject = oneLine(input.subject, 100) || null;
  const parsed = Clean.safeParse({
    name: oneLine(input.name, 80),
    phone,
    email: oneLine(input.email, 160).toLowerCase() || null,
    subject,
    message: multiLine(input.message, 2000),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  if (!d.phone && !d.email) return { ok: false, error: "Add a phone number or an email address so we can reply." };

  const since = new Date(now.getTime() - 24 * 3600_000).toISOString().replace("T", " ").slice(0, 19);
  const result = db.transaction(
    (tx) => {
      const recent = tx.select().from(contactMessages).where(gte(contactMessages.createdAt, since)).all();
      const same = recent.find((m) => m.name === d.name && m.message === d.message && (m.phone ?? "") === (d.phone ?? "") && (m.email ?? "") === (d.email ?? ""));
      if (same) return { ok: true, id: same.id, duplicate: true } as const;
      if (recent.length >= CONTACT_DAILY_CAP) return { ok: false, error: "We’re getting a lot of messages right now. Please call or WhatsApp us instead." } as const;
      const row = tx.insert(contactMessages).values({ name: d.name, phone: d.phone, email: d.email, subject: d.subject, message: d.message }).returning({ id: contactMessages.id }).get();
      return { ok: true, id: row.id } as const;
    },
    { behavior: "immediate" },
  );
  return result;
}

// ---- Telling the shop -------------------------------------------------------------------------

/** Plain text only; every customer-typed value is a single cleaned line except the message itself. */
export function composeContactEmail(m: typeof contactMessages.$inferSelect, env: Record<string, string | undefined> = process.env) {
  const subject = `New website message: ${oneLine(m.subject, 60) || "no subject"} — ${oneLine(m.name, 40)}`;
  const text = [
    "A customer sent a message through the Contact page.",
    "",
    `Name: ${m.name}`,
    `Phone: ${m.phone ?? "—"}`,
    `Email: ${m.email ?? "—"}`,
    `About: ${m.subject ?? "—"}`,
    "",
    m.message,
    "",
    `Read and answer it in the admin: ${siteUrl(env)}/admin/messages`,
  ].join("\n");
  return { subject, text };
}

/** Sales email from Shop settings, else the first ALERT_EMAIL_TO address. */
export function contactRecipient(db: DB, env: Record<string, string | undefined> = process.env): string | null {
  const stored = db.select({ value: settings.value }).from(settings).where(eq(settings.key, "sales_email")).get()?.value;
  if (typeof stored === "string" && EMAIL_RE.test(stored)) return stored;
  return alertRecipients(env)[0] ?? null;
}

/** Emails the shop about a stored message. Never throws; a failure never loses the message (it is in the admin). */
export async function notifyContactMessage(db: DB, id: string, env: Record<string, string | undefined> = process.env): Promise<EmailResult> {
  const m = db.select().from(contactMessages).where(eq(contactMessages.id, id)).get();
  if (!m) return { sent: false, detail: "Message not found." };
  const to = contactRecipient(db, env);
  if (!to) return { sent: false, detail: "No sales email or alert address is set." };
  const { subject, text } = composeContactEmail(m, env);
  return sendEmail(db, { to: [to], subject, text }, env as never);
}

// ---- Admin ------------------------------------------------------------------------------------

export type MessageFilter = (typeof MESSAGE_STATUSES)[number] | "ALL";
export function listMessages(db: DB, filter: MessageFilter = "NEW", limit = 200) {
  return db.select().from(contactMessages).where(filter === "ALL" ? undefined : eq(contactMessages.status, filter)).orderBy(desc(contactMessages.createdAt), desc(sql`${contactMessages}.rowid`)).limit(limit).all();
}
export function messageCounts(db: DB): Record<(typeof MESSAGE_STATUSES)[number], number> {
  const out = { NEW: 0, REPLIED: 0, SPAM: 0 };
  for (const r of db.select({ status: contactMessages.status, n: sql<number>`COUNT(*)` }).from(contactMessages).groupBy(contactMessages.status).all()) out[r.status] = r.n;
  return out;
}
export const newMessageCount = (db: DB): number => messageCounts(db).NEW;

export function setMessageStatus(db: DB, ctx: AuditContext, actorId: string, id: string, status: (typeof MESSAGE_STATUSES)[number], now = new Date()) {
  if (!(MESSAGE_STATUSES as readonly string[]).includes(status)) throw new ContentError("Unknown status.");
  db.transaction(
    (tx) => {
      const m = tx.select().from(contactMessages).where(eq(contactMessages.id, id)).get();
      if (!m) throw new ContentError("That message no longer exists.");
      if (m.status === status) return;
      tx.update(contactMessages).set({ status, handledBy: actorId, handledAt: now.toISOString() }).where(and(eq(contactMessages.id, id))).run();
      writeAudit(tx, ctx, { actorId, action: `contact.${status.toLowerCase()}`, entity: "contact_messages", entityId: id, before: { status: m.status }, after: { status } });
    },
    { behavior: "immediate" },
  );
}
