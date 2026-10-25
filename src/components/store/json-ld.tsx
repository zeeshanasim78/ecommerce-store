import { jsonLdString } from "@/server/content/seo";

/**
 * One schema.org block for search engines. The JSON is escaped by `jsonLdString` (no "<" survives) and
 * React writes script text without HTML-escaping it, so raw-HTML injection is never needed (Constitution §11.2).
 */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json">{jsonLdString(data)}</script>;
}
