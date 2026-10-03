import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SMTPServer } from "smtp-server";
import type { AddressInfo } from "node:net";
import type { DB } from "@/db/connection";
import { DEFAULT_DAILY_LIMIT, emailsSentToday, gmailTransportOptions, readGmailConfig, sendEmail } from "@/server/notify/email";
import { testDb } from "../helpers/db";

/** v1.10 — every email goes through one Gmail account, within Gmail's free daily allowance. */

const APP = { GMAIL_USER: "Caidea.Shop@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" };
const OAUTH = { GMAIL_USER: "caidea.shop@gmail.com", GMAIL_AUTH: "oauth2", GMAIL_OAUTH_CLIENT_ID: "id.apps.googleusercontent.com", GMAIL_OAUTH_CLIENT_SECRET: "secret", GMAIL_OAUTH_REFRESH_TOKEN: "1//refresh" };

describe("Gmail settings from the environment file", () => {
  it("app password (default): smtp.gmail.com:465 over TLS, spaces removed from the password", () => {
    expect(readGmailConfig(APP)).toMatchObject({ configured: true, mode: "app_password", user: "caidea.shop@gmail.com", fromName: "Caidea", dailyLimit: DEFAULT_DAILY_LIMIT, problems: [] });
    expect(gmailTransportOptions(APP)).toMatchObject({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: "caidea.shop@gmail.com", pass: "abcdefghijklmnop" } });
  });

  it("OAuth 2.0: client id, secret and refresh token go to nodemailer's OAuth2 sign-in", () => {
    expect(readGmailConfig(OAUTH)).toMatchObject({ configured: true, mode: "oauth2", problems: [] });
    expect(gmailTransportOptions(OAUTH)).toMatchObject({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { type: "OAuth2", user: "caidea.shop@gmail.com", clientId: "id.apps.googleusercontent.com", clientSecret: "secret", refreshToken: "1//refresh" },
    });
  });

  it("explains what is missing or wrong", () => {
    expect(readGmailConfig({}).configured).toBe(false);
    expect(readGmailConfig({ GMAIL_USER: "caidea.shop@gmail.com" }).problems[0]).toMatch(/GMAIL_APP_PASSWORD is empty/);
    expect(readGmailConfig({ GMAIL_USER: "caidea.shop@gmail.com", GMAIL_APP_PASSWORD: "MyNormalPass123" }).problems[0]).toMatch(/16-letter app password/);
    expect(readGmailConfig({ ...OAUTH, GMAIL_OAUTH_REFRESH_TOKEN: "" }).problems[0]).toMatch(/GMAIL_OAUTH_REFRESH_TOKEN/);
    expect(readGmailConfig({ ...APP, GMAIL_AUTH: "magic" }).problems[0]).toMatch(/GMAIL_AUTH/);
    expect(readGmailConfig({ ...APP, GMAIL_DAILY_LIMIT: "900" })).toMatchObject({ dailyLimit: DEFAULT_DAILY_LIMIT, problems: [expect.stringMatching(/1 to 500/)] });
    expect(readGmailConfig({ ...APP, SMTP_HOST: "mail.example.com" }).warnings[0]).toMatch(/no longer used/);
  });

  it("the test-server hook accepts only this machine, and warns while it is on", () => {
    expect(readGmailConfig({ ...APP, EMAIL_TEST_SMTP: "127.0.0.1:2525" })).toMatchObject({ testServer: { host: "127.0.0.1", port: 2525 }, warnings: [expect.stringMatching(/TEST mail server/)] });
    const outside = readGmailConfig({ ...APP, EMAIL_TEST_SMTP: "mail.attacker.test:25" });
    expect(outside.testServer).toBeNull();
    expect(outside.problems[0]).toMatch(/ignored/);
    expect(gmailTransportOptions({ ...APP, EMAIL_TEST_SMTP: "mail.attacker.test:25" })).toMatchObject({ host: "smtp.gmail.com" });
  });
});

describe("sending, within the daily allowance", () => {
  const inbox: { from: string; to: string[] }[] = [];
  let smtp: SMTPServer;
  let port = 0;
  let db: DB;
  beforeAll(async () => {
    smtp = new SMTPServer({
      authOptional: true,
      disabledCommands: ["STARTTLS"],
      onData(stream, session, done) {
        stream.resume();
        stream.on("end", () => {
          inbox.push({ from: (session.envelope.mailFrom && session.envelope.mailFrom.address) || "", to: session.envelope.rcptTo.map((r) => r.address) });
          done();
        });
      },
    });
    await new Promise<void>((ok) => smtp.listen(0, "127.0.0.1", ok));
    port = (smtp.server.address() as AddressInfo).port;
  });
  afterAll(() => new Promise<void>((ok) => smtp.close(() => ok())));
  beforeEach(() => {
    db = testDb();
    inbox.length = 0;
  });
  const env = () => ({ ...APP, EMAIL_TEST_SMTP: `127.0.0.1:${port}`, GMAIL_DAILY_LIMIT: "3" });

  it("sends from the Gmail address and counts recipients per day", async () => {
    expect(await sendEmail(db, { to: ["a@x.test", "B@x.test", "a@x.test"], subject: "s", text: "t" }, env())).toMatchObject({ sent: true });
    expect(inbox[0]).toEqual({ from: "caidea.shop@gmail.com", to: ["a@x.test", "b@x.test"] }); // duplicates removed
    expect(emailsSentToday(db)).toBe(2);
  });

  it("stops ordinary mail at GMAIL_DAILY_LIMIT, lets security alerts use the rest, and resets the next day", async () => {
    const day1 = new Date("2026-10-03T10:00:00+05:00");
    await sendEmail(db, { to: ["a@x.test", "b@x.test", "c@x.test"], subject: "s", text: "t" }, env(), day1);
    const blocked = await sendEmail(db, { to: ["d@x.test"], subject: "s", text: "t" }, env(), day1);
    expect(blocked).toMatchObject({ sent: false, detail: expect.stringMatching(/allowance is used up \(3 of 3/) });
    expect(await sendEmail(db, { to: ["owner@x.test"], subject: "alert", text: "t", priority: "security" }, env(), day1)).toMatchObject({ sent: true });
    expect(emailsSentToday(db, day1)).toBe(4);

    const day2 = new Date("2026-10-04T00:30:00+05:00"); // just after midnight in Karachi
    expect(emailsSentToday(db, day2)).toBe(0);
    expect(await sendEmail(db, { to: ["d@x.test"], subject: "s", text: "t" }, env(), day2)).toMatchObject({ sent: true });
  });

  it("does nothing (and says why) when Gmail isn't set up", async () => {
    expect(await sendEmail(db, { to: ["a@x.test"], subject: "s", text: "t" }, {})).toMatchObject({ sent: false, detail: expect.stringMatching(/isn’t set up/) });
    expect(emailsSentToday(db)).toBe(0);
  });
});
