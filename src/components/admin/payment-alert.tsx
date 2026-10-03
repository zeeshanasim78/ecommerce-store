import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { formatKarachi } from "@/lib/time";
import type { AlertRecord } from "@/server/settings/payment-integrity";

/**
 * Red alert shown while a change to the payment details hasn't been confirmed by the owner (v1.9).
 * `acknowledge` is the owner's form action; managers see the alert without the button.
 */
export function PaymentAlert({ alert, acknowledge, showLink }: { alert: AlertRecord; acknowledge?: (fd: FormData) => Promise<void>; showLink?: boolean }) {
  return (
    <section role="alert" aria-labelledby="pay-alert-title" className="mb-8 rounded-bezel bg-terracotta/10 p-6 ring-1 ring-terracotta/40">
      <h2 id="pay-alert-title" className="font-sans text-lg font-bold text-terracotta">
        Payment details changed — confirm this was you
      </h2>
      <p className="mt-1 text-[0.9375rem] text-midnight/80">
        Noticed when the app started on {formatKarachi(alert.changedAt)}. Customers now see the new details at checkout.
      </p>
      <ul className="mt-4 flex flex-col gap-3 text-[0.9375rem]">
        {alert.changes.map((c) => (
          <li key={c.field} className="rounded-bezel-sm bg-white px-4 py-3 ring-1 ring-midnight/10">
            <span className="font-semibold">{c.label}</span>
            <span className="mt-1 block break-words tabular text-midnight/70">
              was: <span className="line-through">{c.before ?? "not set"}</span>
            </span>
            <span className="block break-words font-semibold tabular">now: {c.after ?? "not set"}</span>
          </li>
        ))}
      </ul>
      {alert.email ? <p className="mt-3 text-sm text-midnight/70">Email alert: {alert.email.detail}</p> : null}
      <p className="mt-4 text-[0.9375rem]">
        <b>Not you?</b> Customers may be paying someone else. Switch off the affected payment method below, put the correct values back in the server’s environment file, restart the app and change the server passwords.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {acknowledge ? (
          <form action={acknowledge}>
            <button type="submit" className={buttonClasses("primary")}>
              I made this change
            </button>
          </form>
        ) : (
          <p className="text-sm font-semibold text-midnight/75">Only the owner can confirm this change.</p>
        )}
        {showLink ? (
          <Link href="/admin/settings" className={buttonClasses("outline")}>
            Open Shop settings
          </Link>
        ) : null}
      </div>
    </section>
  );
}
