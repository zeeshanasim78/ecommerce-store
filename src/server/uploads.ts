import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Admin image uploads — SPECIFICATION.md §11.7 / §4.16.
 * Files live in data/uploads (outside /public, so they work after `next build` on the
 * shop server) and are served by src/app/uploads/[...path]/route.ts.
 * Every image is re-encoded with sharp: strips metadata and anything that isn't pixels.
 */
export const UPLOAD_ROOT = join(process.cwd(), "data", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export class UploadError extends Error {}

export async function saveImage(file: File, folder: "products" | "hero" | "brands" | "home"): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new UploadError("Upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_BYTES) throw new UploadError("Images must be 5 MB or smaller.");

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate() // respect phone-camera orientation, then drop EXIF
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UploadError("That file isn’t a readable image.");
  }

  const name = `${crypto.randomUUID()}.webp`;
  const dir = join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), output);
  return `/uploads/${folder}/${name}`;
}

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/**
 * Saves an uploaded MP4 or WebM for the home-page repair video (spec §16).
 * Videos aren't re-encoded (the shop server may not have ffmpeg), so the file's first
 * bytes are checked to make sure it really is MP4/WebM whatever its name says.
 */
export async function saveVideo(file: File): Promise<{ url: string; kind: "mp4" | "webm" }> {
  if (file.size > MAX_VIDEO_BYTES) throw new UploadError("Videos must be 20 MB or smaller. A 5–6 second clip is usually under 2 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const isMp4 = bytes.subarray(4, 8).toString("latin1") === "ftyp";
  const isWebm = bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!isMp4 && !isWebm) throw new UploadError("Upload an MP4 or WebM video.");
  const kind = isMp4 ? "mp4" : "webm";
  const name = `${crypto.randomUUID()}.${kind}`;
  const dir = join(UPLOAD_ROOT, "videos");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), bytes);
  return { url: `/uploads/videos/${name}`, kind };
}
