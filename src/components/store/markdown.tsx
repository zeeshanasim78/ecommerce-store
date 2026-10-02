import Link from "next/link";
import ReactMarkdown from "react-markdown";

/**
 * Renders admin-written Markdown safely (SPECIFICATION.md §11.2):
 * raw HTML is dropped, only basic formatting tags are allowed, and links must be
 * internal paths or https:// — so slide copy can't inject scripts.
 */
const ALLOWED = ["p", "strong", "em", "a", "ul", "ol", "li", "br"];

export function SafeMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      skipHtml
      allowedElements={ALLOWED}
      unwrapDisallowed
      urlTransform={(url) => (url.startsWith("/") && !url.startsWith("//")) || url.startsWith("https://") ? url : ""}
      components={{
        a: ({ href, children: text }) =>
          href?.startsWith("/") ? (
            <Link href={href}>{text}</Link>
          ) : href ? (
            <a href={href} rel="noopener noreferrer" target="_blank">
              {text}
            </a>
          ) : (
            <>{text}</>
          ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
