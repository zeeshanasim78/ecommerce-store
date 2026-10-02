import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Generates labelled sample product photos for development (Clarify Q14: real photos later).
 * Front, back and side views of a display assembly, drawn as SVG and saved as WebP in
 * data/uploads/products, so cards have 2–3 images to switch between.
 */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function frame(inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#F6EFE5"/>
  <ellipse cx="400" cy="712" rx="190" ry="22" fill="#0B1C33" opacity="0.12"/>
  ${inner}
  <text x="40" y="48" font-family="sans-serif" font-size="20" fill="#0B1C33" opacity="0.45">Sample image</text>
</svg>`;
}

function front(brand: string, model: string, oled: boolean) {
  const glow = oled ? "#2A4E7E" : "#3B5A80";
  return frame(`
  <rect x="245" y="70" width="310" height="630" rx="46" fill="#0B1C33"/>
  <rect x="259" y="84" width="282" height="602" rx="34" fill="url(#g)"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${glow}"/><stop offset="0.55" stop-color="#0E2340"/><stop offset="1" stop-color="#3A1A12"/>
  </linearGradient></defs>
  <rect x="362" y="100" width="76" height="20" rx="10" fill="#000"/>
  <polygon points="259,84 541,84 541,250 259,420" fill="#fff" opacity="0.05"/>
  <text x="286" y="590" font-family="sans-serif" font-size="22" fill="#FBF8F1" opacity="0.7">${esc(brand)}</text>
  <text x="286" y="628" font-family="sans-serif" font-weight="700" font-size="${model.length > 14 ? 26 : 32}" fill="#FBF8F1">${esc(model)}</text>`);
}

function back(brand: string) {
  return frame(`
  <rect x="245" y="70" width="310" height="630" rx="46" fill="#1F2E44"/>
  <rect x="263" y="88" width="274" height="594" rx="32" fill="#2A3A52"/>
  <rect x="300" y="140" width="200" height="300" rx="12" fill="#C9CED6" opacity="0.55"/>
  <text x="400" y="300" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#0B1C33" opacity="0.7">${esc(brand)} display</text>
  <rect x="370" y="440" width="60" height="150" fill="#D97706" opacity="0.85"/>
  <rect x="352" y="584" width="96" height="44" rx="6" fill="#D97706"/>
  <rect x="368" y="596" width="64" height="20" rx="3" fill="#0B1C33" opacity="0.6"/>
  <rect x="263" y="88" width="274" height="18" fill="#FBF8F1" opacity="0.18"/>`);
}

function side() {
  return frame(`
  <g transform="translate(400 390) rotate(-28) skewX(-14)">
    <rect x="-150" y="-300" width="300" height="600" rx="44" fill="#0B1C33"/>
    <rect x="-136" y="-286" width="272" height="572" rx="32" fill="#1C3557"/>
    <rect x="150" y="-292" width="22" height="584" rx="10" fill="#33496B"/>
    <polygon points="-136,-286 136,-286 136,-120 -136,60" fill="#fff" opacity="0.06"/>
  </g>`);
}

export async function generateSampleImages(slug: string, brand: string, model: string, displayType: string) {
  const dir = join(process.cwd(), "data", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const oled = /OLED|AMOLED/i.test(displayType);
  const views = [
    { angle: "FRONT" as const, svg: front(brand, model, oled) },
    { angle: "BACK" as const, svg: back(brand) },
    { angle: "SIDE" as const, svg: side() },
  ];
  const out: { angle: "FRONT" | "BACK" | "SIDE"; url: string }[] = [];
  for (const v of views) {
    const name = `seed-${slug}-${v.angle.toLowerCase()}.webp`;
    await writeFile(join(dir, name), await sharp(Buffer.from(v.svg)).webp({ quality: 80 }).toBuffer());
    out.push({ angle: v.angle, url: `/uploads/products/${name}` });
  }
  return out;
}
