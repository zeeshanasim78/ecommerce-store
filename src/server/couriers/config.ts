import type { ApiCourier } from "@/db/schema/logistics";

/**
 * Courier API settings — environment file only, like the payment details (v1.8/v1.9, §20–§21).
 * Edit `.env.production` (`/etc/caidea/caidea.env` on the shop server) and restart. Keys are secrets:
 * on the live server load them with systemd-creds (BUILD_GUIDE M18 step 8). They are never shown in
 * the admin screens — only whether they are set.
 */

export const COURIER_ENV_KEYS = ["LEOPARDS_API_KEY", "LEOPARDS_API_PASSWORD", "LEOPARDS_MODE", "POSTEX_API_TOKEN", "POSTEX_PICKUP_ADDRESS_CODE", "COURIER_TEST_BASE_URL"] as const;

type Env = Record<string, string | undefined>;

export const LEOPARDS_LIVE_URL = "https://merchantapi.leopardscourier.com/api/";
export const LEOPARDS_STAGING_URL = "https://merchantapistaging.leopardscourier.com/api/";
export const POSTEX_URL = "https://api.postex.pk/services/integration/api/order/";

export type CourierConfig = {
  courier: ApiCourier;
  label: string;
  /** Keys present and well-formed: the adapter can be used. */
  configured: boolean;
  /** "live", "staging" (Leopards' test server) or "test" (a fake courier on this machine, automated tests only). */
  mode: "live" | "staging" | "test";
  baseUrl: string;
  problems: string[];
  warnings: string[];
};

/** Automated tests only: a fake courier on THIS machine. Anything else is ignored (orders can't be diverted). */
function testBase(env: Env, problems: string[], warnings: string[]): string | null {
  const raw = env.COURIER_TEST_BASE_URL?.trim();
  if (!raw) return null;
  const m = /^http:\/\/(127\.0\.0\.1|localhost):(\d{1,5})\/?$/i.exec(raw);
  if (!m) {
    problems.push("COURIER_TEST_BASE_URL is only for automated tests and must look like http://127.0.0.1:4010 — it was ignored.");
    return null;
  }
  warnings.push(`COURIER_TEST_BASE_URL is set: courier bookings go to a TEST courier on this machine (${raw}), not to the real courier. Remove it on the live server.`);
  return `http://${m[1]}:${m[2]}/`;
}

export function readCourierConfig(courier: ApiCourier, env: Env = process.env): CourierConfig {
  const v = (k: string) => env[k]?.trim() ?? "";
  const problems: string[] = [];
  const warnings: string[] = [];
  const test = testBase(env, problems, warnings);

  if (courier === "LEOPARDS") {
    const key = v("LEOPARDS_API_KEY");
    const pass = v("LEOPARDS_API_PASSWORD");
    const rawMode = v("LEOPARDS_MODE").toLowerCase() || "staging";
    if (rawMode !== "staging" && rawMode !== "live") problems.push(`LEOPARDS_MODE “${rawMode}” isn’t known — use staging or live. Using staging.`);
    const live = rawMode === "live";
    if (key && !pass) problems.push("LEOPARDS_API_PASSWORD is empty — Leopards needs the API key and the API password.");
    if (!key && pass) problems.push("LEOPARDS_API_KEY is empty — Leopards needs the API key and the API password.");
    if (key && !/^[A-Za-z0-9]{8,100}$/.test(key)) problems.push("LEOPARDS_API_KEY should be the letters and numbers from the Leopards merchant portal (API settings).");
    if (key && pass && !live && !test) warnings.push("Leopards is on its STAGING (test) server — bookings there are not real. Set LEOPARDS_MODE=live when the live keys arrive.");
    const ok = Boolean(key && pass) && problems.length === 0;
    return {
      courier,
      label: "Leopards Courier",
      configured: ok,
      mode: test ? "test" : live ? "live" : "staging",
      baseUrl: test ? `${test}leopards/api/` : live ? LEOPARDS_LIVE_URL : LEOPARDS_STAGING_URL,
      problems,
      warnings,
    };
  }

  const token = v("POSTEX_API_TOKEN");
  if (token && !/^[A-Za-z0-9+/=._-]{16,400}$/.test(token)) problems.push("POSTEX_API_TOKEN should be the token from the PostEx merchant portal (Settings → API).");
  const code = v("POSTEX_PICKUP_ADDRESS_CODE");
  if (code && !/^[A-Za-z0-9-]{1,30}$/.test(code)) problems.push("POSTEX_PICKUP_ADDRESS_CODE should be the pickup address code shown in the PostEx portal, or blank for the default address.");
  return {
    courier,
    label: "PostEx",
    configured: Boolean(token) && problems.length === 0,
    mode: test ? "test" : "live",
    baseUrl: test ? `${test}postex/` : POSTEX_URL,
    problems,
    warnings,
  };
}

/** Secrets for the adapters. Kept apart from CourierConfig so status screens never hold them. */
export function courierSecrets(courier: ApiCourier, env: Env = process.env) {
  const v = (k: string) => env[k]?.trim() ?? "";
  return courier === "LEOPARDS" ? { apiKey: v("LEOPARDS_API_KEY"), apiPassword: v("LEOPARDS_API_PASSWORD") } : { token: v("POSTEX_API_TOKEN"), pickupAddressCode: v("POSTEX_PICKUP_ADDRESS_CODE") || null };
}
