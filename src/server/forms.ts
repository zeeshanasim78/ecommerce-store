import "server-only";

/** Small helpers for reading FormData in Server Actions. Validation itself is done with Zod. */
export const text = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
export const optionalText = (fd: FormData, key: string): string | null => text(fd, key) || null;
export const checked = (fd: FormData, key: string): boolean => fd.get(key) === "on";
export const file = (fd: FormData, key: string): File | null => {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
};
/** "a, b ,c" → ["a","b","c"] */
export const list = (fd: FormData, key: string): string[] =>
  text(fd, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
