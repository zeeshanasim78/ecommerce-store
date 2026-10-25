"use client";

import { useState } from "react";
import { ArticleMarkdown } from "@/components/store/article-markdown";

const area =
  "w-full rounded-bezel-sm border border-midnight/18 bg-white px-5 py-3 font-mono text-[0.9375rem] leading-relaxed text-midnight placeholder:text-midnight/45 " +
  "hover:border-midnight/35 focus:border-midnight focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

/** Markdown box with a live preview that uses the very same renderer as the public blog page. */
export function MarkdownEditor({ name, defaultValue = "", maxLength = 60000, rows = 18 }: { name: string; defaultValue?: string; maxLength?: number; rows?: number }) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const tabClass = (on: boolean) => `h-9 rounded-full px-4 text-sm font-semibold ${on ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10"}`;
  return (
    <div>
      <div role="tablist" aria-label="Editor" className="mb-3 flex gap-2">
        <button type="button" role="tab" aria-selected={tab === "write"} className={tabClass(tab === "write")} onClick={() => setTab("write")}>
          Write
        </button>
        <button type="button" role="tab" aria-selected={tab === "preview"} className={tabClass(tab === "preview")} onClick={() => setTab("preview")}>
          Preview
        </button>
      </div>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        hidden={tab !== "write"}
        className={area}
        aria-label="Post text (Markdown)"
      />
      {tab === "preview" ? (
        <div className="min-h-64 rounded-bezel-sm border border-midnight/18 bg-white px-6 py-5" aria-live="polite">
          {value.trim() ? <ArticleMarkdown>{value}</ArticleMarkdown> : <p className="text-midnight/60">Nothing to preview yet.</p>}
        </div>
      ) : null}
      <p className="mt-2 text-sm text-midnight/65">
        {value.length.toLocaleString()} / {maxLength.toLocaleString()} characters. Use <code>##</code> for headings, <code>**bold**</code>, <code>*italic*</code>, <code>[link](/store)</code>, <code>- </code> for lists, <code>&gt; </code> for quotes and{" "}
        <code>![description](/uploads/…)</code> for images. Raw HTML is ignored.
      </p>
    </div>
  );
}
