import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SMTPServer } from "smtp-server";
import type { AddressInfo } from "node:net";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, user } from "@/db/schema";
import { alertRecipients, sendEmail } from "@/server/notify/email";
import {
  acknowledgePaymentAlert,
  checkPaymentDetails,
  currentPaymentDetails,
  fingerprint,
  getPaymentAlert,
  getSeenPaymentDetails,
  runPaymentIntegrityCheck,
} from "@/server/settings/payment-integrity";
import { testDb } from "../helpers/db";

/** v1.9 — tamper detection for the payment details in the environment file (SPECIFICATION §21). */

const BASE = {
  COD_MAX_ORDER_PKR: "20000",
  JAZZCASH_ACCOUNT_TITLE: "Caidea Traders",
  JAZZCASH_ACCOUNT_NUMBER: "0300-1112233",
  BANK_NAME: "Standard Chartered",
  BANK_ACCOUNT_TITLE: "Caidea Traders",
  BANK_IBAN: "PK36SCBL0000001123456702",
  ALERT_EMAIL_TO: "owner@caidea.test",
};
const audit = (db: DB) => db.select({ a: adminAuditLog.action, before: adminAuditLog.before, after: adminAuditLog.after }).from(adminAuditLog).all();

// A real (local, in-memory) mail server, so the email path is tested end to end
const inbox: { to: string[]; raw: string }[] = [];
let smtp: SMTPServer;
let smtpPort = 0;
beforeAll(async () => {
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, session, done) {
      let raw = "";
      stream.on("data", (c: Buffer) => (raw += c.toString()));
      stream.on("end", () => {
        inbox.push({ to: session.envelope.rcptTo.map((r) => r.address), raw });
        done();
      });
    },
  });
  await new Promise<void>((ok) => smtp.listen(0, "127.0.0.1", ok));
  smtpPort = (smtp.server.address() as AddressInfo).port;
});
afterAll(() => new Promise<void>((ok) => smtp.close(() => ok())));

let db: DB;
beforeEach(() => {
  db = testDb();
  inbox.length = 0;
});
const mailEnv = () => ({ GMAIL_USER: "caidea.shop@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop", EMAIL_TEST_SMTP: `127.0.0.1:${smtpPort}` });

describe("payment details fingerprint", () => {
  it("is stable for the same details and changes when any shown value changes", () => {
    const a = fingerprint(currentPaymentDetails(BASE));
    expect(fingerprint(currentPaymentDetails({ ...BASE }))).toBe(a);
    expect(fingerprint(currentPaymentDetails({ ...BASE, BANK_IBAN: "PK40MEZN0000001123456702" }))).not.toBe(a);
    expect(fingerprint(currentPaymentDetails({ ...BASE, COD_MAX_ORDER_PKR: "25000" }))).not.toBe(a);
    expect(fingerprint(currentPaymentDetails({ ...BASE, ALERT_EMAIL_TO: "x@caidea.test" }))).not.toBe(a);
  });

  it("ignores formatting that customers never see (spaces, lower-case IBAN)", () => {
    expect(fingerprint(currentPaymentDetails({ ...BASE, BANK_IBAN: "pk36 scbl 0000 0011 2345 6702" }))).toBe(fingerprint(currentPaymentDetails(BASE)));
  });
});

describe("checkPaymentDetails", () => {
  it("records a baseline the first time, then nothing while unchanged", () => {
    expect(checkPaymentDetails(db, BASE).status).toBe("baseline");
    expect(getSeenPaymentDetails(db)?.details.bank).toBe("Standard Chartered · Caidea Traders · PK36SCBL0000001123456702");
    expect(checkPaymentDetails(db, BASE).status).toBe("unchanged");
    expect(getPaymentAlert(db)).toBeNull();
    expect(audit(db).map((r) => r.a)).toEqual(["payment_details.baseline"]);
  });

  it("a swapped IBAN raises an alert with old and new values and an audit entry", () => {
    checkPaymentDetails(db, BASE);
    const r = checkPaymentDetails(db, { ...BASE, BANK_IBAN: "PK40MEZN0000001123456702" });
    expect(r).toMatchObject({ status: "changed", changes: [{ field: "bank", label: "Bank account", before: expect.stringContaining("PK36SCBL"), after: expect.stringContaining("PK40MEZN") }] });
    expect(getPaymentAlert(db)?.changes).toHaveLength(1);
    const row = audit(db).find((x) => x.a === "payment_details.changed")!;
    expect(row.before).toEqual({ bank: "Standard Chartered · Caidea Traders · PK36SCBL0000001123456702" });
    expect(row.after).toEqual({ bank: "Standard Chartered · Caidea Traders · PK40MEZN0000001123456702" });
  });

  it("keeps the last CONFIRMED value as 'before' across several unconfirmed changes", () => {
    checkPaymentDetails(db, BASE);
    checkPaymentDetails(db, { ...BASE, JAZZCASH_ACCOUNT_NUMBER: "0300-9999999" });
    checkPaymentDetails(db, { ...BASE, JAZZCASH_ACCOUNT_NUMBER: "0300-8888888", COD_MAX_ORDER_PKR: "50000" });
    const changes = getPaymentAlert(db)!.changes;
    expect(changes.find((c) => c.field === "jazzcash")).toMatchObject({ before: "Caidea Traders · 0300-1112233", after: "Caidea Traders · 0300-8888888" });
    expect(changes.find((c) => c.field === "codLimit")).toMatchObject({ before: "Rs 20,000", after: "Rs 50,000" });
  });

  it("a field that was 'not set' stays in the alert through later unconfirmed changes", () => {
    const noEmail = { ...BASE, ALERT_EMAIL_TO: "" };
    checkPaymentDetails(db, noEmail);
    checkPaymentDetails(db, { ...noEmail, ALERT_EMAIL_TO: "someone@evil.test" });
    checkPaymentDetails(db, { ...noEmail, ALERT_EMAIL_TO: "someone@evil.test", COD_MAX_ORDER_PKR: "21000" });
    const changes = getPaymentAlert(db)!.changes;
    expect(changes.find((c) => c.field === "alertEmail")).toMatchObject({ before: null, after: "someone@evil.test" });
    expect(changes.find((c) => c.field === "codLimit")).toMatchObject({ before: "Rs 20,000", after: "Rs 21,000" });
  });

  it("clears the alert if the values are put back before anyone confirms", () => {
    checkPaymentDetails(db, BASE);
    checkPaymentDetails(db, { ...BASE, BANK_IBAN: "PK40MEZN0000001123456702" });
    expect(checkPaymentDetails(db, BASE).status).toBe("unchanged");
    expect(getPaymentAlert(db)).toBeNull();
    expect(audit(db).map((r) => r.a)).toContain("payment_details.reverted");
  });

  it("a method switched off by a typo counts as a change (customers stop seeing it)", () => {
    checkPaymentDetails(db, BASE);
    const r = checkPaymentDetails(db, { ...BASE, BANK_IBAN: "PK36SCBL0000001123456703" }); // bad check digit → bank off
    expect(r).toMatchObject({ status: "changed", changes: [{ field: "bank", after: null }] });
  });

  it("emails the new AND the old address when the alert address itself is changed", () => {
    checkPaymentDetails(db, BASE);
    const r = checkPaymentDetails(db, { ...BASE, ALERT_EMAIL_TO: "attacker@evil.test" });
    expect(r.status === "changed" && r.notify.sort()).toEqual(["attacker@evil.test", "owner@caidea.test"]);
  });
});

describe("acknowledging", () => {
  it("only removes the alert when the owner confirms, and records who did it", () => {
    db.insert(user).values({ id: "owner-1", name: "Omar", email: "o@caidea.test", role: "OWNER", isActive: true }).run();
    checkPaymentDetails(db, BASE);
    checkPaymentDetails(db, { ...BASE, COD_MAX_ORDER_PKR: "30000" });
    expect(acknowledgePaymentAlert(db, "owner-1", { ip: "1.2.3.4", userAgent: "test" })).toBe(true);
    expect(getPaymentAlert(db)).toBeNull();
    const row = db.select().from(adminAuditLog).where(eq(adminAuditLog.action, "payment_details.acknowledged")).get()!;
    expect(row).toMatchObject({ actorId: "owner-1", ip: "1.2.3.4" });
    expect(acknowledgePaymentAlert(db, "owner-1", { ip: "1.2.3.4", userAgent: "test" })).toBe(false); // nothing left to confirm
    expect(checkPaymentDetails(db, { ...BASE, COD_MAX_ORDER_PKR: "30000" }).status).toBe("unchanged");
  });
});

describe("alert email", () => {
  it("is sent through SMTP with the old and new values, and the result is recorded", async () => {
    await runPaymentIntegrityCheck(db, { ...BASE, ...mailEnv() });
    expect(inbox).toHaveLength(0); // baseline: no email
    await runPaymentIntegrityCheck(db, { ...BASE, ...mailEnv(), BANK_IBAN: "PK40MEZN0000001123456702" });
    expect(inbox).toHaveLength(1);
    expect(inbox[0]!.to).toEqual(["owner@caidea.test"]);
    expect(inbox[0]!.raw).toMatch(/Subject: Caidea: payment details changed/);
    expect(inbox[0]!.raw).toMatch(/From: Caidea <caidea\.shop@gmail\.com>/);
    // Decode the quoted-printable body (soft line breaks "=\r\n", bytes "=C2=B7")
    const body = Buffer.from(
      inbox[0]!.raw.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16))),
      "latin1",
    ).toString("utf8");
    expect(body).toContain("was: Standard Chartered · Caidea Traders · PK36SCBL0000001123456702");
    expect(body).toContain("now: Standard Chartered · Caidea Traders · PK40MEZN0000001123456702");
    expect(body).toContain("I made this change");
    expect(getPaymentAlert(db)?.email).toMatchObject({ sent: true });
    expect(audit(db).map((r) => r.a)).toContain("payment_details.alert_emailed");
  });

  it("not configured or unreachable → no crash, alert still raised, reason recorded", async () => {
    await runPaymentIntegrityCheck(db, BASE);
    await runPaymentIntegrityCheck(db, { ...BASE, COD_MAX_ORDER_PKR: "1" });
    expect(getPaymentAlert(db)?.email).toMatchObject({ sent: false, detail: expect.stringMatching(/isn’t set up/) });

    const r = await sendEmail(db, { to: ["a@b.test"], subject: "x", text: "y" }, { GMAIL_USER: "caidea.shop@gmail.com", GMAIL_APP_PASSWORD: "abcdefghijklmnop", EMAIL_TEST_SMTP: "127.0.0.1:1" });
    expect(r).toMatchObject({ sent: false, detail: expect.stringMatching(/could not be sent/) });
  });

  it("reads several alert addresses and drops invalid ones", () => {
    expect(alertRecipients({ ALERT_EMAIL_TO: "Owner@Caidea.test, manager@caidea.test ,not-an-email" })).toEqual(["owner@caidea.test", "manager@caidea.test"]);
  });
});
