import { fromPaisa } from "@/lib/money";
import type { CatalogCard } from "@/server/storefront/catalog-types";

/**
 * Structured data (schema.org JSON-LD) for search engines — SPECIFICATION.md §30.
 * Pure functions: they take plain values and return plain objects, so they are unit-tested.
 * Only facts the shop really has are included; no ratings or reviews are published as markup.
 */

type Json = Record<string, unknown>;
const CONTEXT = "https://schema.org";

/** Address on this site → absolute address. https:// links pass through; anything else is dropped. */
export function absoluteUrl(site: string, path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("https://")) return path;
  if (path.startsWith("/") && !path.startsWith("//")) return `${site}${path}`;
  return undefined;
}

/**
 * JSON for a JSON-LD script tag. "<", ">" and "&" are written as \u escapes so no
 * text an admin typed can ever close the script tag, and the line/paragraph separators can't break the page.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function organizationLd(site: string, o: { name: string; phone: string | null; whatsapp: string | null; salesEmail: string | null }): Json {
  const points: Json[] = [];
  if (o.phone) points.push({ "@type": "ContactPoint", telephone: o.phone, contactType: "customer service", areaServed: "PK", availableLanguage: ["en", "ur"] });
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": `${site}/#organization`,
    name: o.name,
    url: site,
    ...(o.salesEmail ? { email: o.salesEmail } : {}),
    ...(points.length ? { contactPoint: points } : {}),
    areaServed: { "@type": "Country", name: "Pakistan" },
  };
}

export function productLd(site: string, p: Pick<CatalogCard, "slug" | "brand" | "model" | "qualityGrade" | "displayType" | "description" | "totalStock" | "images" | "price">): Json {
  const images = p.images.map((i) => absoluteUrl(site, i.url)).filter((u): u is string => Boolean(u)).slice(0, 4);
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: `${p.brand} ${p.model} ${p.qualityGrade} screen`,
    description: p.description?.trim() || `${p.displayType} display assembly for the ${p.brand} ${p.model}, ${p.qualityGrade}.`,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: p.brand },
    category: "Mobile phone replacement screens",
    offers: {
      "@type": "Offer",
      url: `${site}/store/${p.slug}`,
      priceCurrency: "PKR",
      price: fromPaisa(p.price.finalPaisa).toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: p.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${site}/#organization` },
    },
  };
}

export function blogPostingLd(
  site: string,
  p: { slug: string; title: string; description: string; coverImage: string | null; publishedAt: string | null; updatedAt: string | null; orgName: string },
): Json {
  const url = `${site}/blog/${p.slug}`;
  const image = absoluteUrl(site, p.coverImage);
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: p.title.slice(0, 110),
    description: p.description,
    ...(image ? { image: [image] } : {}),
    ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    dateModified: p.updatedAt || p.publishedAt || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: p.orgName, url: site },
    publisher: { "@id": `${site}/#organization` },
  };
}

export function breadcrumbLd(site: string, trail: { name: string; path: string }[]): Json {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: `${site}${t.path}` })),
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}
