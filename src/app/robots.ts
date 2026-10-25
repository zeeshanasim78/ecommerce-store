import type { MetadataRoute } from "next";
import { isLocalSite, siteUrl } from "@/server/site-url";

export const dynamic = "force-dynamic";

/** Pages that are private or have no value in search results. */
const PRIVATE_PATHS = ["/admin", "/api", "/login", "/cart", "/checkout", "/order", "/dev"];

export default function robots(): MetadataRoute.Robots {
  // While the address is still localhost (development, or BETTER_AUTH_URL not set) crawlers are asked to stay away.
  if (isLocalSite()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS.map((p) => `${p}`) },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
