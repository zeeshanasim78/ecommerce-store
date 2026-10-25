type Env = Record<string, string | undefined>;

/**
 * Public address of the shop. From the environment file (`BETTER_AUTH_URL`), never from the request,
 * so a forged Host header can't change the links in emails, the sitemap or the structured data.
 */
export function siteUrl(env: Env = process.env): string {
  const raw = (env.BETTER_AUTH_URL ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\/[^\s/?#]+(:\d+)?$/i.test(raw) ? raw : "http://localhost:3000";
}

/** True while the address is still the development one (search engines should not be invited in). */
export function isLocalSite(env: Env = process.env): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(siteUrl(env));
}
