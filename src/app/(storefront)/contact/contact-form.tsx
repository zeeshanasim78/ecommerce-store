"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { sendContactMessage, type ContactState } from "./actions";

const area =
  "min-h-36 w-full rounded-bezel-sm border border-midnight/18 bg-white px-5 py-3 text-[0.9375rem] text-midnight placeholder:text-midnight/45 hover:border-midnight/35 focus:border-midnight focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

export function ContactForm({ subjects, defaultSubject }: { subjects: readonly string[]; defaultSubject?: string }) {
  const [state, send, sending] = useActionState<ContactState, FormData>(sendContactMessage, {});

  if (state.done) {
    return (
      <div role="status" className="rounded-bezel bg-midnight p-8 text-canvas">
        <h2 className="text-2xl font-bold">Thank you, we have your message.</h2>
        <p className="mt-3 text-canvas/80">We will reply by phone or email as soon as we can. If it is urgent, call or WhatsApp us.</p>
      </div>
    );
  }

  return (
    <form action={send} className="grid gap-5 rounded-bezel bg-white p-6 ring-1 ring-midnight/8 sm:p-8">
      {/* Honeypot: hidden from people and screen readers. Bots fill it, and their message is quietly dropped. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <Field id="name" label="Your name">
        <Input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label="Mobile number" hint="Phone or email is needed so we can reply.">
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" aria-describedby="phone-hint" />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" autoComplete="email" maxLength={160} />
        </Field>
      </div>
      <Field id="subject" label="What is it about?">
        <Select id="subject" name="subject" defaultValue={defaultSubject ?? subjects[0]}>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="message" label="Your message" hint="For a screen question, include your phone’s model code (Settings → About phone).">
        <textarea id="message" name="message" required minLength={10} maxLength={2000} className={area} aria-describedby="message-hint" />
      </Field>
      {state.error ? (
        <p role="alert" className="font-medium text-terracotta">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
