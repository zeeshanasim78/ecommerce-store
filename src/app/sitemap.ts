import type { MetadataRoute } from "next";
import { db } from "@/db/client";
import { publishedPostSlugs } from "@/server/content/blog";
import { siteUrl } from "@/server/site-url";
import { listCatalog } from "@/server/storefront/catalog";

// Built on every request: a post published in the admin must appear at once (M13 "done when").
export const dynamic = "force-dynamic";

/** Public pages that never change address. Cart, checkout, orders and the admin are left out on purpose. */
const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/store", priority: 0.9, changeFrequency: "daily" },
  { path: "/categories", priority: 0.6, changeFrequency: "weekly" },
  { path: "/deals", priority: 0.7, changeFrequency: "daily" },
  { path: "/services", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/faqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/return-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  const pages = STATIC_PAGES.map((p) => ({ url: `${site}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
  const products = listCatalog().map((c) => ({ url: `${site}/store/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 }));
  const posts = publishedPostSlugs(db).map((p) => ({
    url: `${site}/blog/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt.includes("T") ? p.updatedAt : `${p.updatedAt.replace(" ", "T")}Z`) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...products, ...posts];
}
