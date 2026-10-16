/**
 * Device profiles for the hero's 3D phone (SPECIFICATION.md §16, v1.3).
 * The model is picked from the linked product's brand and model, so the phone drawn on a
 * slide is the phone the slide talks about: its proportions, corner radius, front camera
 * cut-out, rear camera layout and body colour.
 * Shapes only — no manufacturer logos are drawn.
 */

export type FrontCutout = "island" | "notch" | "punch" | "teardrop";
export type RearLayout =
  | "iphone-pro"
  | "iphone-dual"
  | "s-ultra"
  | "galaxy-a"
  | "redmi-note"
  | "single-module"
  | "square-module"
  | "reno-pill";
/** v1.14: how the phone moves on its hero slide (one slow 8-second cycle; see globals.css). */
export type PhoneMotion = "assemble" | "turn" | "float" | "rise" | "sway";
export const PHONE_MOTIONS: readonly PhoneMotion[] = [
  "assemble",
  "turn",
  "float",
  "rise",
  "sway",
];

export type DeviceProfile = {
  key: string;
  label: string;
  /** Body size in em (scaled by the stage font-size) */
  width: number;
  height: number;
  depth: number;
  /** Outer corner radius and screen inset, in em */
  radius: number;
  bezel: number;
  cutout: FrontCutout;
  rear: RearLayout;
  /** Frame / back colours */
  frame: string;
  back: string;
  /** v1.14: the lock-screen look for this model, built from the brand tokens (no real wallpapers) */
  wallpaper: string;
  /** v1.14: preferred motion for this model; another is used if a slide already has it */
  motion: PhoneMotion;
};

const WALL = {
  ultra:
    "radial-gradient(90% 60% at 80% 10%, color-mix(in srgb, var(--color-terracotta) 55%, transparent), transparent 60%), radial-gradient(80% 60% at 10% 90%, color-mix(in srgb, var(--color-amber) 35%, transparent), transparent 60%), linear-gradient(170deg, #12233c, #0b1c33)",
  iphone:
    "radial-gradient(120% 70% at 50% 0%, #3a2f5a 0%, #1c1830 45%, #0b0d18 75%)",
  redmi:
    "conic-gradient(from 210deg at 70% 30%, color-mix(in srgb, var(--color-amber) 60%, var(--color-midnight)), var(--color-midnight), color-mix(in srgb, var(--color-terracotta) 60%, var(--color-midnight)), var(--color-midnight))",
  galaxyA:
    "linear-gradient(160deg, color-mix(in srgb, var(--color-canvas) 22%, #1b3a5c) 0%, #12263f 55%, #0b1c33 100%)",
  generic:
    "radial-gradient(120% 70% at 20% 0%, #24456f 0%, #0e2340 45%, #0b1c33 70%)",
  square:
    "radial-gradient(100% 60% at 30% 20%, color-mix(in srgb, var(--color-amber) 30%, #123a52), #0b1c33 70%)",
  reno: "linear-gradient(200deg, color-mix(in srgb, var(--color-terracotta) 30%, #102a3f), #0b1c33 65%)",
};

const PROFILES: Record<string, DeviceProfile> = {
  iphonePro: {
    key: "iphone-pro",
    label: "iPhone Pro (Dynamic Island, triple camera)",
    width: 15.4,
    height: 31.4,
    depth: 1.0,
    radius: 2.7,
    bezel: 0.5,
    cutout: "island",
    rear: "iphone-pro",
    frame: "#3a3633",
    back: "#2f2c2a",
    wallpaper: WALL.iphone,
    motion: "turn",
  },
  iphoneNotch: {
    key: "iphone-notch",
    label: "iPhone with notch (dual camera)",
    width: 14.6,
    height: 30.0,
    depth: 1.0,
    radius: 2.6,
    bezel: 0.6,
    cutout: "notch",
    rear: "iphone-dual",
    frame: "#24272c",
    back: "#1c1f24",
    wallpaper: WALL.iphone,
    motion: "turn",
  },
  sUltra: {
    key: "s-ultra",
    label: "Galaxy S Ultra (squared corners, five lenses)",
    width: 15.6,
    height: 32.2,
    depth: 0.9,
    radius: 1.1,
    bezel: 0.38,
    cutout: "punch",
    rear: "s-ultra",
    frame: "#26282b",
    back: "#1d1f22",
    wallpaper: WALL.ultra,
    motion: "assemble",
  },
  galaxyA: {
    key: "galaxy-a",
    label: "Galaxy A series (three separate lenses)",
    width: 15.2,
    height: 31.6,
    depth: 0.95,
    radius: 2.2,
    bezel: 0.55,
    cutout: "punch",
    rear: "galaxy-a",
    frame: "#33363a",
    back: "#2a2d31",
    wallpaper: WALL.galaxyA,
    motion: "rise",
  },
  redmiNote: {
    key: "redmi-note",
    label: "Redmi Note (camera island)",
    width: 15.2,
    height: 32.0,
    depth: 0.95,
    radius: 2.0,
    bezel: 0.45,
    cutout: "punch",
    rear: "redmi-note",
    frame: "#202326",
    back: "#17191c",
    wallpaper: WALL.redmi,
    motion: "float",
  },
  generic: {
    key: "generic",
    label: "Generic Android phone",
    width: 15.0,
    height: 31.0,
    depth: 0.95,
    radius: 2.2,
    bezel: 0.55,
    cutout: "teardrop",
    rear: "single-module",
    frame: "#24395a",
    back: "#1a2c46",
    wallpaper: WALL.generic,
    motion: "sway",
  },
  // v1.14: more of the catalogue's phones get their own shape (Vivo / Infinix / Tecno / Redmi 12C style big square module, Oppo Reno pill)
  squareModule: {
    key: "square-module",
    label: "Android with a large square camera module",
    width: 15.0,
    height: 32.0,
    depth: 1.0,
    radius: 2.0,
    bezel: 0.6,
    cutout: "teardrop",
    rear: "square-module",
    frame: "#26292d",
    back: "#1f2226",
    wallpaper: WALL.square,
    motion: "float",
  },
  reno: {
    key: "reno",
    label: "Oppo Reno (two large lenses in a raised pill)",
    width: 14.8,
    height: 31.6,
    depth: 0.85,
    radius: 2.1,
    bezel: 0.42,
    cutout: "punch",
    rear: "reno-pill",
    frame: "#2b2f33",
    back: "#22262a",
    wallpaper: WALL.reno,
    motion: "rise",
  },
};

/** Known variant colour names → body colour, so the model wears the product's real colour. */
const COLOURS: Array<[RegExp, string]> = [
  [/phantom black|midnight black|space black|graphite|black/i, "#1d1f22"],
  [/green|sage|lime/i, "#3e4a3e"],
  [/purple|lavender|violet/i, "#4b405a"],
  [/blue|ocean/i, "#28405e"],
  [/gold|cream/i, "#9a8b6f"],
  [/silver|white|starlight/i, "#c9ccd1"],
  [/red/i, "#6e1f1f"],
];

export function deviceProfileFor(
  brand: string | null | undefined,
  model: string | null | undefined,
  colour?: string | null,
): DeviceProfile {
  const name = `${brand ?? ""} ${model ?? ""}`.toLowerCase();
  let profile = PROFILES.generic!;
  if (/iphone\s*1[4-9]\s*pro/.test(name)) profile = PROFILES.iphonePro!;
  else if (/iphone/.test(name)) profile = PROFILES.iphoneNotch!;
  else if (/galaxy\s*s\d+\s*ultra/.test(name)) profile = PROFILES.sUltra!;
  else if (/galaxy\s*(a|m)\d+/.test(name)) profile = PROFILES.galaxyA!;
  else if (/redmi\s*note/.test(name)) profile = PROFILES.redmiNote!;
  else if (/oppo|reno/.test(name)) profile = PROFILES.reno!;
  else if (/vivo|infinix|tecno|redmi\s*\d+c|galaxy\s*a0\d/.test(name))
    profile = PROFILES.squareModule!;

  const tint = colour
    ? COLOURS.find(([re]) => re.test(colour))?.[1]
    : undefined;
  return tint ? { ...profile, back: tint } : profile;
}

/**
 * v1.14: the phone a slide shows. A linked product decides; with no product, the slide's own words are
 * read ("iPhone 14 Pro Max, original panel." draws an iPhone Pro), so the phone matches the text.
 */
export function deviceProfileForSlide(
  product: { brand: string; model: string; colour?: string | null } | null,
  text: string,
): DeviceProfile {
  if (product)
    return deviceProfileFor(product.brand, product.model, product.colour);
  const t = text.replace(/[^A-Za-z0-9 ]/g, " ");
  const named =
    /(iphone\s*\d+\s*(pro)?|galaxy\s*s\d+\s*ultra|galaxy\s*[am]\d+|redmi\s*note\s*\d*|redmi\s*\d+c|oppo\s*reno\s*\d*|reno\s*\d+|vivo\s*\w+|infinix\s*\w+|tecno\s*\w+)/i.exec(
      t,
    );
  return deviceProfileFor(null, named?.[0] ?? "", null);
}

/** v1.14: one motion per slide — each phone's own, or the next one not used yet (Q64). */
export function assignMotions(profiles: DeviceProfile[]): PhoneMotion[] {
  const used = new Set<PhoneMotion>();
  return profiles.map((p) => {
    const pick = !used.has(p.motion)
      ? p.motion
      : (PHONE_MOTIONS.find((m) => !used.has(m)) ?? p.motion);
    used.add(pick);
    return pick;
  });
}
