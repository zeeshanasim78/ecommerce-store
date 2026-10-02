/** URL-safe slug: "OEM Original & Frame+" → "oem-original-and-frame-plus". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
