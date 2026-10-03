import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { db } from "@/db/client";
import { formatPkMobile } from "@/lib/phone";
import { requireStaff } from "@/server/dal";
import { readPaymentEnv } from "@/server/settings/payment-env";
import { CHECKOUT_METHODS, METHOD_LABEL, WALLET_METHODS, availableMethods, getCheckoutSettings, prepaidMethods } from "@/server/settings/store-settings";
import { PaymentAlert } from "@/components/admin/payment-alert";
import { formatKarachi } from "@/lib/time";
import { getPaymentAlert, getSeenPaymentDetails } from "@/server/settings/payment-integrity";
import { alertRecipients, emailsSentToday, readGmailConfig } from "@/server/notify/email";
import { siteUrl } from "@/server/notify/order-emails";
import { acknowledgePaymentChange, saveShopSettings, sendTestEmail } from "./actions";

export const metadata = { title: "Shop settings" };
export const dynamic = "force-dynamic";

export default async function ShopSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("settings");
  const sp = await searchParams;
  const s = getCheckoutSettings(db);
  const env = readPaymentEnv();
  const live = availableMethods(s);
  const alert = getPaymentAlert(db);
  const seen = getSeenPaymentDetails(db);
  const gmail = readGmailConfig();
  const alertTo = alertRecipients();
  const sentToday = emailsSentToday(db);
  const site = siteUrl();

  const statusOf = (m: (typeof CHECKOUT_METHODS)[number]) =>
    live.includes(m) ? "Live" : !s.enabledMethods.includes(m) ? "Off" : m === "COD" ? "Off" : "Needs account details in the environment file";

  return (
    <>
      <AdminHeader title="Shop settings" description="How customers pay and reach you. Owner only; every change is recorded in the audit log." />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {alert ? <PaymentAlert alert={alert} acknowledge={acknowledgePaymentChange} /> : null}
      {prepaidMethods(s).length === 0 ? (
        <Notice tone="error">
          No bank or wallet payment is available, so customers can’t order above the cash-on-delivery limit{s.codPaused ? " — and cash on delivery is paused, so nobody can order online" : ""}. Put the bank (BANK_*) or JazzCash (JAZZCASH_*) details in the environment file and restart, and keep the method switched on below.
        </Notice>
      ) : null}
      {!s.salesEmail || !s.whatsapp ? <Notice tone="error">Set the WhatsApp number and the sales email below — customers paying by bank or wallet are told to send their payment screenshot there.</Notice> : null}
      {env.usesSampleDetails ? <Notice tone="error">Customers are being shown SAMPLE account details. Put your real account numbers in the environment file and restart the app before taking real orders.</Notice> : null}

      <div className="flex flex-col gap-8">
        <Section
          title="Payment accounts and cash-on-delivery limit"
          description="These come from the server’s environment file (.env.production on the shop server, .env.local on a development PC), so they can be changed without touching the code: edit the file, then restart the app."
        >
          {env.problems.length ? (
            <ul className="flex flex-col gap-2 rounded-bezel-sm bg-terracotta/10 px-5 py-4 text-[0.9375rem] font-medium text-terracotta">
              {env.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <dl className="grid gap-x-8 gap-y-4 text-[0.9375rem] sm:grid-cols-[14rem_1fr]">
            <dt className="text-midnight/65">
              Cash on delivery up to <code className="block text-xs">COD_MAX_ORDER_PKR</code>
            </dt>
            <dd className="font-semibold tabular">{s.codMaxPaisa > 0 ? `Rs ${(s.codMaxPaisa / 100).toLocaleString("en-PK")}` : "Off for every order (0)"}</dd>
            {WALLET_METHODS.map((w) => (
              <div key={w} className="contents">
                <dt className="text-midnight/65">
                  {METHOD_LABEL[w]} <code className="block text-xs">{w}_ACCOUNT_TITLE / _NUMBER</code>
                </dt>
                <dd>{s.wallets[w] ? <span className="tabular">{s.wallets[w]!.accountTitle} · {s.wallets[w]!.accountNumber}</span> : <span className="text-midnight/55">Not set — not offered</span>}</dd>
              </div>
            ))}
            <dt className="text-midnight/65">
              Bank transfer <code className="block text-xs">BANK_NAME / _ACCOUNT_TITLE / BANK_IBAN</code>
            </dt>
            <dd>{s.bank ? <span className="tabular">{s.bank.bankName} · {s.bank.accountTitle} · {s.bank.iban}</span> : <span className="text-midnight/55">Not set — not offered</span>}</dd>
          </dl>
          <p className="text-sm text-midnight/65">
            {seen ? (
              <>
                The app last loaded these details on {formatKarachi(seen.seenAt)} · fingerprint <code className="tabular">{seen.fingerprint.slice(0, 12)}</code>. Any change is recorded in the audit log and must be confirmed here.
              </>
            ) : (
              "These details are checked for changes each time the app starts."
            )}
          </p>
        </Section>

        <Section title="Email (Gmail)" description="All email from the shop goes through one Gmail account, set in the environment file (GMAIL_*). Free Gmail can send to about 500 recipients a day; the shop stops ordinary mail at the daily limit below and keeps the rest for security alerts.">
          {gmail.problems.length || gmail.warnings.length ? (
            <ul className="flex flex-col gap-2 rounded-bezel-sm bg-terracotta/10 px-5 py-4 text-[0.9375rem] font-medium text-terracotta">
              {[...gmail.problems, ...gmail.warnings].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <dl className="grid gap-x-8 gap-y-4 text-[0.9375rem] sm:grid-cols-[14rem_1fr]">
            <dt className="text-midnight/65">
              Sends from <code className="block text-xs">GMAIL_USER</code>
            </dt>
            <dd className="font-semibold">{gmail.testServer ? "TEST mail server on this machine" : gmail.configured ? `${gmail.fromName} <${gmail.user}>` : <span className="text-terracotta">Not set up — no emails are sent</span>}</dd>
            <dt className="text-midnight/65">
              Sign-in <code className="block text-xs">GMAIL_AUTH</code>
            </dt>
            <dd>{gmail.mode === "oauth2" ? "Google OAuth 2.0 (refresh token)" : "App password (16 letters, needs 2-Step Verification)"}</dd>
            <dt className="text-midnight/65">
              Alerts go to <code className="block text-xs">ALERT_EMAIL_TO</code>
            </dt>
            <dd>{alertTo.length ? alertTo.join(", ") : <span className="text-terracotta">Not set</span>}</dd>
            <dt className="text-midnight/65">
              Links in emails go to <code className="block text-xs">BETTER_AUTH_URL</code>
            </dt>
            <dd>{/localhost|127\.0\.0\.1/.test(site) ? <span className="text-terracotta">{site} — set your real web address (https://…) before going live</span> : site}</dd>
            <dt className="text-midnight/65">
              Sent today <code className="block text-xs">GMAIL_DAILY_LIMIT</code>
            </dt>
            <dd className="tabular">
              {sentToday} of {gmail.dailyLimit} recipients
            </dd>
          </dl>
          <form action={sendTestEmail}>
            <Button type="submit" variant="outline" disabled={!gmail.configured || alertTo.length === 0}>
              Send a test email
            </Button>
          </form>
        </Section>

        <form action={saveShopSettings} className="flex flex-col gap-8">
          <Section title="Contact details" description="Shown at checkout, on order pages, in emails and the PDF. Customers who pay by bank or wallet send their payment screenshot to the WhatsApp number, phone or sales email. A change is emailed to the alert address.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="storePhone" label="Shop phone">
                <Input id="storePhone" name="storePhone" type="tel" defaultValue={s.storePhone ? formatPkMobile(s.storePhone) : ""} placeholder="0300 1234567" />
              </Field>
              <Field id="whatsapp" label="WhatsApp number">
                <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={s.whatsapp ? formatPkMobile(s.whatsapp) : ""} placeholder="0300 1234567" />
              </Field>
              <Field id="salesEmail" label="Sales email" hint="Gets payment screenshots and a copy of every new order.">
                <Input id="salesEmail" name="salesEmail" type="email" maxLength={120} defaultValue={s.salesEmail ?? ""} placeholder="sales@caidea.pk" />
              </Field>
            </div>
          </Section>

          <Section
            title="Cash on delivery"
            description="Pause cash on delivery for a while and customers order by bank transfer or wallet instead: they pay with the order number in the remarks, send you the screenshot, you confirm the payment in Online orders, then dispatch."
          >
            <fieldset className="flex flex-wrap gap-3">
              <legend className="sr-only">Cash on delivery</legend>
              <label className="flex cursor-pointer items-center gap-3 rounded-bezel-sm bg-canvas px-4 py-3 ring-1 ring-midnight/10">
                <input type="radio" name="cod" value="on" defaultChecked={!s.codPaused} className="size-5 accent-midnight" />
                <span className="font-semibold">On</span>
                <span className="text-sm text-midnight/65">up to {s.codMaxPaisa > 0 ? `Rs ${(s.codMaxPaisa / 100).toLocaleString("en-PK")}` : "— limit is 0, so off"}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-bezel-sm bg-canvas px-4 py-3 ring-1 ring-midnight/10">
                <input type="radio" name="cod" value="off" defaultChecked={s.codPaused} className="size-5 accent-midnight" />
                <span className="font-semibold">Paused</span>
                <span className="text-sm text-midnight/65">pay first by bank / wallet</span>
              </label>
            </fieldset>
            <Field id="codPauseMessage" label="Message at checkout while paused (optional)">
              <Input id="codPauseMessage" name="codPauseMessage" maxLength={200} defaultValue={s.codPauseMessage ?? ""} placeholder="Cash on delivery is back after Eid." />
            </Field>
          </Section>

          <Section title="Bank and wallet payments (pay in advance)" description="Switch a method off to stop offering it. Each also needs its account details in the environment file.">
            <label className="flex cursor-pointer items-start gap-3 rounded-bezel-sm bg-canvas px-4 py-3 ring-1 ring-midnight/10">
              <input type="checkbox" name="prepaidFreeDelivery" defaultChecked={s.prepaidFreeDelivery} className="mt-0.5 size-5 accent-midnight" />
              <span>
                <span className="block font-semibold">Free delivery when the customer pays in advance</span>
                <span className="block text-sm text-midnight/65">The delivery charge is removed for bank / wallet orders. Cash-on-delivery orders still pay delivery and the COD fee.</span>
              </span>
            </label>
            <ul className="grid gap-3 sm:grid-cols-2">
              {CHECKOUT_METHODS.filter((m) => m !== "COD").map((m) => (
                <li key={m}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-bezel-sm bg-canvas px-4 py-3 ring-1 ring-midnight/10">
                    <input type="checkbox" name={`method:${m}`} defaultChecked={s.enabledMethods.includes(m)} className="size-5 accent-midnight" />
                    <span className="font-semibold">{METHOD_LABEL[m]}</span>
                    <span className={`ml-auto text-right text-sm ${live.includes(m) ? "text-midnight/70" : "text-terracotta"}`}>{statusOf(m)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="manualTtlHours" label="Wait for wallet / bank payment (hours)" hint="Unpaid orders are cancelled after this and their stock goes back on sale. Recording the screenshot in Online orders stops the clock. Default 24.">
                <Input id="manualTtlHours" name="manualTtlHours" type="number" min={1} max={168} step={1} required defaultValue={Math.round(s.manualTtlMinutes / 60) || 1} className="tabular" />
              </Field>
            </div>
          </Section>

          <div>
            <Button type="submit" size="lg">
              Save settings
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
