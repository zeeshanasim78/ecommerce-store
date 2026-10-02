"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { enrol, type EnrolState } from "./actions";

export function EnrolForm() {
  const [state, action, pending] = useActionState(enrol, { step: "password" } as EnrolState);

  if (state.step !== "scan") {
    return (
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="intent" value="start" />
        <Field id="password" label="Confirm your password" error={state.error}>
          <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Preparing…" : "Show my QR code"}
        </Button>
      </form>
    );
  }

  const scan = state;
  return (
    <div className="flex flex-col gap-6">
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.9375rem] text-midnight/80">
        <li>Open Google Authenticator, Microsoft Authenticator or Authy on your phone.</li>
        <li>Add an account and scan this code.</li>
        <li>Type the 6-digit code the app shows.</li>
      </ol>
      <div className="flex flex-col items-center gap-3 rounded-bezel bg-white p-5 ring-1 ring-midnight/8">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, nothing to optimise */}
        <img src={scan.qrDataUrl} width={200} height={200} alt="QR code for your authenticator app" />
        <p className="text-center text-sm text-midnight/70">
          Can’t scan? Enter this key: <span className="tabular font-semibold break-all text-midnight">{scan.secret}</span>
        </p>
      </div>
      <div className="rounded-bezel bg-surface p-5">
        <h2 className="font-sans text-base font-semibold">Backup codes</h2>
        <p className="mt-1 text-sm text-midnight/70">
          Each one signs you in once if you lose your phone. Write them down and keep them somewhere safe — they won’t be shown again.
        </p>
        <ul className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[0.9375rem] font-semibold">
          {scan.backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="intent" value="confirm" />
        <Field id="code" label="Code from the app" error={scan.error}>
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={7} placeholder="123456" className="tabular text-lg tracking-[0.2em]" />
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Checking…" : "Turn on two-step sign-in"}
        </Button>
      </form>
    </div>
  );
}
