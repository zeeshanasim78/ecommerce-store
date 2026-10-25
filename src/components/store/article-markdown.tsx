import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/**
 * Renders blog and service Markdown (SPECIFICATION.md §11.2, M13).
 * Defence in depth, three layers:
 *  1. react-markdown never turns raw HTML in the text into elements (`skipHtml`);
 *  2. only the tags in ALLOWED survive (`allowedElements`), and `rehype-sanitize` cleans what is left;
 *  3. links must be a page on this site or https://, images must be an upload on this site or https://.
 * Usable on the server (blog pages) and in the browser (the admin's live preview).
 */
const ALLOWED = ["h1", "h2", "h3", "h4", "p", "strong", "em", "a", "ul", "ol", "li", "br", "hr", "blockquote", "code", "pre", "img"];

/** rehype-sanitize's default schema, narrowed to the tags above and to safe link/image protocols. */
const SCHEMA = {
  ...defaultSchema,
  tagNames: ALLOWED,
  protocols: { href: ["https"], src: ["https"] },
  attributes: { a: ["href"], img: ["src", "alt"], code: [["className", /^language-[\w-]+$/]] },
  clobberPrefix: "",
};

const safeUrl = (url: string) => ((url.startsWith("/") && !url.startsWith("//")) || url.startsWith("https://") ? url : "");

export function ArticleMarkdown({ children }: { children: string }) {
  return (
    <div className="article">
      <ReactMarkdown
        skipHtml
        allowedElements={ALLOWED}
        unwrapDisallowed
        rehypePlugins={[[rehypeSanitize, SCHEMA]]}
        urlTransform={safeUrl}
        components={{
          // The page title is the only h1; a "# Heading" in the body becomes an h2.
          h1: ({ children: c }) => <h2>{c}</h2>,
          a: ({ href, children: text }) =>
            href?.startsWith("/") ? (
              <Link href={href}>{text}</Link>
            ) : href ? (
              <a href={href} rel="noopener noreferrer nofollow" target="_blank">
                {text}
              </a>
            ) : (
              <>{text}</>
            ),
          // eslint-disable-next-line @next/next/no-img-element -- admin-chosen images of unknown size; lazy-loaded
          img: ({ src, alt }) => (typeof src === "string" && src ? <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" /> : null),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
