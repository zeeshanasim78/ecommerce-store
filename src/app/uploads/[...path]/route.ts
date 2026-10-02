import { open, stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";

const ROOT = join(process.cwd(), "data", "uploads");
const TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * Serves admin-uploaded files from data/uploads. Names are random, so files are cached for a year.
 * Supports byte ranges (HTTP 206): Safari and iPhones need them to play video.
 */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = normalize(join(ROOT, ...path));
  const ext = target.split(".").pop()?.toLowerCase() ?? "";
  // Refuse anything outside data/uploads (e.g. "../") and any unknown file type
  if (!target.startsWith(ROOT + sep) || !TYPES[ext]) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    const info = await stat(target);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": TYPES[ext],
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };

  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = request.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === "" && m[2] === "")) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    if (m[1] === "") {
      start = Math.max(size - Number(m[2]), 0); // suffix range: last N bytes
    } else {
      start = Number(m[1]);
      if (m[2] !== "") end = Math.min(Number(m[2]), size - 1);
    }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }

  const length = end - start + 1;
  const handle = await open(target, "r");
  const buffer = Buffer.alloc(length);
  await handle.read(buffer, 0, length, start);
  await handle.close();
  headers["Content-Length"] = String(length);
  return new Response(new Uint8Array(buffer), { status, headers });
}
