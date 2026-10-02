/**
 * Device profiles for the hero's 3D phone (SPECIFICATION.md §16, v1.3).
 * The model is picked from the linked product's brand and model, so the phone drawn on a
 * slide is the phone the slide talks about: its proportions, corner radius, front camera
 * cut-out, rear camera layout and body colour.
 * Shapes only — no manufacturer logos are drawn.
 */

export type FrontCutout = "island" | "notch" | "punch" | "teardrop";
export type RearLayout = "iphone-pro" | "iphone-dual" | "s-ultra" | "galaxy-a" | "redmi-note" | "single-module";

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

export function deviceProfileFor(brand: string | null | undefined, model: string | null | undefined, colour?: string | null): DeviceProfile {
  const name = `${brand ?? ""} ${model ?? ""}`.toLowerCase();
  let profile = PROFILES.generic!;
  if (/iphone\s*1[4-9]\s*pro/.test(name)) profile = PROFILES.iphonePro!;
  else if (/iphone/.test(name)) profile = PROFILES.iphoneNotch!;
  else if (/galaxy\s*s\d+\s*ultra/.test(name)) profile = PROFILES.sUltra!;
  else if (/galaxy\s*(a|m)\d+/.test(name)) profile = PROFILES.galaxyA!;
  else if (/redmi\s*note/.test(name)) profile = PROFILES.redmiNote!;

  const tint = colour ? COLOURS.find(([re]) => re.test(colour))?.[1] : undefined;
  return tint ? { ...profile, back: tint } : profile;
}
