"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/server/auth";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type LoginState = {
  step: "password" | "code";
  error?: string;
  email?: string;
  next?: string;
};

/** Only allow redirects back into the admin area — never to another site. */
function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/admin") && !v.startsWith("//") ? v : "/admin/dashboard";
}

const PasswordSchema = z.object({
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(128),
});

const GENERIC = "Email or password is incorrect.";

export async function signInWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const next = safeNext(formData.get("next"));
  const parsed = PasswordSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { step: "password", error: GENERIC, next };

  const h = await headers();
  const limit = rateLimit(`login:${clientIp(h)}:${parsed.data.email}`, 5, 15 * 60_000);
  if (!limit.ok) {
    return { step: "password", error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`, next };
  }

  let result: unknown;
  try {
    result = await auth.api.signInEmail({ body: { ...parsed.data, rememberMe: false }, headers: h });
  } catch (error) {
    if (error instanceof APIError) return { step: "password", error: GENERIC, email: parsed.data.email, next };
    throw error;
  }

  if (result && typeof result === "object" && "twoFactorRedirect" in result) {
    return { step: "code", email: parsed.data.email, next };
  }
  // Signed in without a second factor: only possible before 2FA is enrolled, so enrol now.
  redirect("/admin/setup-2fa");
}

const CodeSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((c) => c.replace(/\s+/g, ""))
    .pipe(z.string().min(6).max(32)),
});

export async function verifySignInCode(prev: LoginState, formData: FormData): Promise<LoginState> {
  const next = safeNext(formData.get("next"));
  const parsed = CodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { ...prev, step: "code", error: "Enter the 6-digit code from your authenticator app.", next };

  const h = await headers();
  const limit = rateLimit(`2fa:${clientIp(h)}`, 10, 15 * 60_000);
  if (!limit.ok) return { ...prev, step: "code", error: "Too many attempts. Wait a few minutes and sign in again.", next };

  const code = parsed.data.code;
  try {
    if (/^\d{6}$/.test(code)) {
      await auth.api.verifyTOTP({ body: { code, trustDevice: false }, headers: h });
    } else {
      await auth.api.verifyBackupCode({ body: { code, trustDevice: false }, headers: h });
    }
  } catch (error) {
    if (error instanceof APIError) {
      return { ...prev, step: "code", error: "That code didn’t work. Codes change every 30 seconds — try the current one.", next };
    }
    throw error;
  }
  redirect(next);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
