/** A rule of the content pages was broken (bad input, duplicate address…). The message is safe to show to staff. */
export class ContentError extends Error {}

/** One line of text: control characters and line breaks become spaces, length limited. */
export const oneLine = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Longer text: keeps line breaks, drops other control characters. */
export const multiLine = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max) : "";

/** Image links from the admin must be an upload on this site or an https:// address. */
export const isSafeImageUrl = (v: string) => v.startsWith("/uploads/") || v.startsWith("https://");
