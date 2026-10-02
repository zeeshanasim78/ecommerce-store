"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { signInWithPassword, verifySignInCode, type LoginState } from "./actions";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, { step: "password", next } satisfies LoginState);
  const [codeState, codeAction, codePending] = useActionState(verifySignInCode, { step: "code", next } satisfies LoginState);

  if (pwState.step === "code") {
    return (
      <form action={codeAction} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={pwState.next ?? next} />
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Enter your code</h1>
          <p className="mt-2 text-[0.9375rem] text-midnight/70">
            Open your authenticator app and type the 6-digit code for Caidea ({pwState.email}). Lost your phone? Use one of
            your backup codes instead.
          </p>
        </div>
        <Field id="code" label="Authentication code" error={codeState.error}>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={32}
            placeholder="123 456"
            className="tabular text-lg tracking-[0.2em]"
            aria-invalid={codeState.error ? true : undefined}
            aria-describedby={codeState.error ? "code-error" : undefined}
          />
        </Field>
        <Button type="submit" size="lg" disabled={codePending}>
          {codePending ? "Checking…" : "Verify and sign in"}
        </Button>
      </form>
    );
  }

  return (
    <form action={pwAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Staff sign-in</h1>
        <p className="mt-2 text-[0.9375rem] text-midnight/70">For Caidea staff. You’ll need your authenticator app.</p>
      </div>
      {notice ? <p className="rounded-bezel-sm bg-surface px-4 py-3 text-sm font-medium">{notice}</p> : null}
      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={pwState.email} autoFocus />
      </Field>
      <Field id="password" label="Password" error={pwState.error}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={pwState.error ? true : undefined}
          aria-describedby={pwState.error ? "password-error" : undefined}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pwPending}>
        {pwPending ? "Signing in…" : "Continue"}
      </Button>
    </form>
  );
}
