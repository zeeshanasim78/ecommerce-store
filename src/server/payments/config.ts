/**
 * Online payment gateway settings — environment file only, like the payment details and courier keys
 * (v1.8/v1.9/v1.15, §20, §21, §27). Edit `.env.production` (`/etc/caidea/caidea.env` on the shop
 * server) and restart. The keys are secrets: they are never shown in the admin screens — only
 * whether they are set — and the vendor's replies never reach an error message with them in.
 */

export const GATEWAY_ENV_KEYS = ["AGGREGATOR_VENDOR", "AGGREGATOR_MERCHANT_ID", "AGGREGATOR_SECRET_KEY", "AGGREGATOR_WEBHOOK_SECRET", "AGGREGATOR_TEST_BASE_URL"] as const;

type Env = Record<string, string | undefined>;

/** Vendors that have an adapter in this version. Add a real one here when its adapter file exists. */
export const KNOWN_VENDORS = ["test"] as const;
export type GatewayVendor = (typeof KNOWN_VENDORS)[number];

export type GatewayConfig = {
  vendor: GatewayVendor | null;
  /** Everything needed is present and well-formed: customers can be offered "pay online". */
  configured: boolean;
  /** "test" = a pretend gateway on this machine (automated tests and the walk-through). */
  mode: "live" | "test" | "off";
  label: string;
  baseUrl: string | null;
  problems: string[];
  warnings: string[];
};

/** The test gateway must be on THIS machine, so a typo can't send customers' payments elsewhere. */
function testBase(env: Env, problems: string[]): string | null {
  const raw = env.AGGREGATOR_TEST_BASE_URL?.trim();
  if (!raw) return null;
  const m = /^http:\/\/(127\.0\.0\.1|localhost):(\d{1,5})\/?$/i.exec(raw);
  if (!m) {
    problems.push("AGGREGATOR_TEST_BASE_URL is only for the test gateway and must look like http://127.0.0.1:4020 — it was ignored.");
    return null;
  }
  return `http://${m[1]}:${m[2]}`;
}

export function readGatewayConfig(env: Env = process.env): GatewayConfig {
  const v = (k: string) => env[k]?.trim() ?? "";
  const problems: string[] = [];
  const warnings: string[] = [];
  const vendorRaw = v("AGGREGATOR_VENDOR").toLowerCase();
  const off: GatewayConfig = { vendor: null, configured: false, mode: "off", label: "Not set up", baseUrl: null, problems, warnings };

  if (!vendorRaw) {
    if (v("AGGREGATOR_MERCHANT_ID") || v("AGGREGATOR_SECRET_KEY") || v("AGGREGATOR_WEBHOOK_SECRET")) problems.push("AGGREGATOR_VENDOR is empty, so online payment stays off. Set it to the vendor the shop signed up with.");
    return off;
  }
  if (!(KNOWN_VENDORS as readonly string[]).includes(vendorRaw)) {
    problems.push(`AGGREGATOR_VENDOR “${vendorRaw}” has no adapter in this version, so online payment stays off. Ask for the adapter for that vendor to be added (BUILD_GUIDE M14).`);
    return off;
  }
  const vendor = vendorRaw as GatewayVendor;

  const merchant = v("AGGREGATOR_MERCHANT_ID");
  const secret = v("AGGREGATOR_SECRET_KEY");
  const hook = v("AGGREGATOR_WEBHOOK_SECRET");
  if (!merchant) problems.push("AGGREGATOR_MERCHANT_ID is empty — the merchant ID from the vendor’s dashboard.");
  else if (!/^[A-Za-z0-9_-]{3,80}$/.test(merchant)) problems.push("AGGREGATOR_MERCHANT_ID should be letters, numbers, - or _ only (3–80 characters).");
  if (!secret) problems.push("AGGREGATOR_SECRET_KEY is empty — the secret API key from the vendor’s dashboard.");
  else if (secret.length < 16 || /\s/.test(secret)) problems.push("AGGREGATOR_SECRET_KEY looks too short (at least 16 characters, no spaces).");
  if (!hook) problems.push("AGGREGATOR_WEBHOOK_SECRET is empty — the signing secret the vendor gives for payment callbacks. Without it callbacks can’t be trusted.");
  else if (hook.length < 16 || /\s/.test(hook)) problems.push("AGGREGATOR_WEBHOOK_SECRET looks too short (at least 16 characters, no spaces).");

  const base = vendor === "test" ? testBase(env, problems) : null;
  if (vendor === "test") {
    if (!base && !env.AGGREGATOR_TEST_BASE_URL?.trim()) problems.push("AGGREGATOR_TEST_BASE_URL is empty — the test gateway’s address, e.g. http://127.0.0.1:4020.");
    warnings.push("Online payment is using the TEST gateway on this machine — no real money moves. Set AGGREGATOR_VENDOR to your real vendor before going live.");
  }
  return {
    vendor,
    configured: problems.length === 0 && Boolean(base ?? vendor !== "test"),
    mode: vendor === "test" ? "test" : "live",
    label: vendor === "test" ? "Test gateway (this machine)" : vendor,
    baseUrl: base,
    problems,
    warnings,
  };
}

/** Secrets for the adapters. Kept apart from GatewayConfig so status screens never hold them. */
export function gatewaySecrets(env: Env = process.env) {
  const v = (k: string) => env[k]?.trim() ?? "";
  return { merchantId: v("AGGREGATOR_MERCHANT_ID"), secretKey: v("AGGREGATOR_SECRET_KEY"), webhookSecret: v("AGGREGATOR_WEBHOOK_SECRET") };
}
