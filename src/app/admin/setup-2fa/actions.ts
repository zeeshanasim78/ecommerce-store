"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import QRCode from "qrcode";
import { z } from "zod";
import { auth } from "@/server/auth";
import { requireStaffSession } from "@/server/dal";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type EnrolState =
  | { step: "password"; error?: string }
  | { step: "scan"; qrDataUrl: string; secret: string; backupCodes: string[]; error?: string };

/** Step 1: confirm the password, create a TOTP secret and backup codes (not active until step 2). */
async function startEnrolment(formData: FormData): Promise<EnrolState> {
  await requireStaffSession();
  const password = z.string().min(1).max(128).safeParse(formData.get("password"));
  if (!password.success) return { step: "password", error: "Enter your password." };

  const h = await headers();
  if (!rateLimit(`enrol:${clientIp(h)}`, 10, 15 * 60_000).ok) return { step: "password", error: "Too many attempts. Wait a few minutes." };

  try {
    const result = await auth.api.enableTwoFactor({ body: { password: password.data }, headers: h });
    if (!("totpURI" in result) || typeof result.totpURI !== "string") throw new Error("Authenticator setup is not available.");
    const secret = new URL(result.totpURI).searchParams.get("secret") ?? "";
    const qrDataUrl = await QRCode.toDataURL(result.totpURI, { margin: 1, width: 240, color: { dark: "#0B1C33", light: "#FFFFFF" } });
    return { step: "scan", qrDataUrl, secret, backupCodes: result.backupCodes };
  } catch (error) {
    if (error instanceof APIError) return { step: "password", error: "That password is incorrect." };
    throw error;
  }
}

/** Step 2: prove the app works by entering its current code. Only now is 2FA switched on. */
async function confirmEnrolment(prev: EnrolState, formData: FormData): Promise<EnrolState> {
  await requireStaffSession();
  if (prev.step !== "scan") return { step: "password" };
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return { ...prev, error: "Enter the 6-digit code shown in your authenticator app." };

  const h = await headers();
  if (!rateLimit(`enrol-code:${clientIp(h)}`, 10, 15 * 60_000).ok) return { ...prev, error: "Too many attempts. Wait a few minutes." };

  try {
    await auth.api.verifyTOTP({ body: { code, trustDevice: false }, headers: h });
  } catch (error) {
    if (error instanceof APIError) return { ...prev, error: "That code didn’t match. Check the phone’s clock is set automatically and try the current code." };
    throw error;
  }
  redirect("/admin/dashboard");
}

/** Single entry point for the form, so the QR data from step 1 stays in state for step 2. */
export async function enrol(prev: EnrolState, formData: FormData): Promise<EnrolState> {
  return formData.get("intent") === "confirm" ? confirmEnrolment(prev, formData) : startEnrolment(formData);
}
