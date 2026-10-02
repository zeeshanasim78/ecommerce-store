import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import type { DB } from "@/db/connection";
import * as schema from "@/db/schema";

/**
 * Better Auth configuration — SPECIFICATION.md §10.
 * Built as a factory so the app (src/server/auth.ts) and CLI scripts
 * (src/scripts/create-staff.ts) share exactly the same settings.
 */

export const ADMIN_SESSION_SECONDS = 60 * 60 * 12; // 12 hours (spec §10)

export function createAuth(db: DB) {
  return betterAuth({
    appName: "Caidea",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        twoFactor: schema.twoFactor,
      },
    }),
    emailAndPassword: {
      enabled: true,
      // Staff accounts are created by the owner (npm run staff:create), never by public sign-up.
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: true, defaultValue: "CUSTOMER", input: false },
        phone: { type: "string", required: false, input: false },
        isActive: { type: "boolean", required: true, defaultValue: true, input: false },
      },
    },
    session: {
      expiresIn: ADMIN_SESSION_SECONDS,
      updateAge: 60 * 60, // refresh the expiry at most once an hour
    },
    rateLimit: {
      enabled: true,
      storage: "memory", // one server process on the shop machine (spec §6.2)
      customRules: {
        "/sign-in/email": { window: 15 * 60, max: 5 },
        "/two-factor/*": { window: 15 * 60, max: 10 },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] }, // Cloudflare Tunnel sends cf-connecting-ip
    },
    plugins: [
      twoFactor({
        issuer: "Caidea",
        // Lock the account for 15 minutes after 10 wrong codes in a row
        accountLockout: { enabled: true, maxFailedAttempts: 10, durationSeconds: 15 * 60 },
      }),
      nextCookies(), // must stay last: lets Server Actions set auth cookies
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
