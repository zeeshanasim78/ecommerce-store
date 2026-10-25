/** Plain-text helpers for Markdown written in the admin (blog posts, service pages). No dependencies. */

/** Markdown → plain text, for search-result snippets and automatic excerpts. */
export function markdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|\*|_|`)/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** First `max` characters of the text, cut at a word and ended with an ellipsis when shortened. */
export function excerptOf(md: string, max = 160): string {
  const text = markdownToText(md);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Minutes to read at 200 words a minute (at least 1). */
export function readingMinutes(md: string): number {
  const words = markdownToText(md).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
