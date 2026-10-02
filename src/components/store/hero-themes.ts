import type { HeroTheme, PhoneLayout } from "@/db/schema/catalog";

/**
 * Hero slide themes and phone layouts — SPECIFICATION.md §16 (v1.3).
 * Every colour is one of the six Caidea tokens or a mix of two of them.
 * Shared by the storefront carousel and the admin pickers.
 */

export type ThemeStyle = {
  label: string;
  /** Background for the whole slide */
  background: string;
  /** Extra glow layer (dark themes only — the glass-on-dark rule) */
  glow: boolean;
  dark: boolean;
  heading: string;
  sub: string;
  body: string;
  cta: string;
  /** Progress fill + control styling */
  progress: string;
  control: string;
  track: string;
};

export const HERO_THEME_STYLES: Record<HeroTheme, ThemeStyle> = {
  MIDNIGHT: {
    label: "Midnight",
    background: "var(--color-midnight)",
    glow: true,
    dark: true,
    heading: "text-canvas",
    sub: "text-canvas/85",
    body: "text-canvas/70",
    cta: "bg-canvas text-midnight hover:bg-white focus-visible:outline-amber",
    progress: "bg-amber",
    control: "glass-dark text-canvas hover:bg-white/12",
    track: "bg-white/15",
  },
  TERRACOTTA: {
    label: "Terracotta",
    background:
      "radial-gradient(70rem 40rem at 85% 20%, color-mix(in oklab, var(--color-terracotta) 82%, var(--color-amber)) 0%, transparent 60%), linear-gradient(135deg, var(--color-terracotta) 0%, color-mix(in oklab, var(--color-terracotta) 62%, var(--color-midnight)) 100%)",
    glow: false,
    dark: true,
    heading: "text-white",
    sub: "text-white/90",
    body: "text-white/80",
    cta: "bg-canvas text-terracotta hover:bg-white focus-visible:outline-canvas",
    progress: "bg-canvas",
    control: "glass-dark text-white hover:bg-white/14",
    track: "bg-white/25",
  },
  AMBER: {
    label: "Amber",
    background:
      "radial-gradient(60rem 36rem at 80% 30%, color-mix(in oklab, var(--color-amber) 70%, var(--color-canvas)) 0%, transparent 65%), linear-gradient(160deg, var(--color-amber) 0%, color-mix(in oklab, var(--color-amber) 72%, var(--color-terracotta)) 100%)",
    glow: false,
    dark: false,
    heading: "text-midnight",
    sub: "text-midnight/90",
    body: "text-midnight/80",
    cta: "bg-midnight text-canvas hover:bg-midnight/90 focus-visible:outline-midnight",
    progress: "bg-midnight",
    control: "bg-midnight/10 text-midnight hover:bg-midnight/18",
    track: "bg-midnight/15",
  },
  CREAM: {
    label: "Cream",
    background:
      "radial-gradient(50rem 30rem at 82% 35%, color-mix(in oklab, var(--color-amber) 22%, var(--color-surface)) 0%, transparent 70%), linear-gradient(180deg, var(--color-surface) 0%, var(--color-canvas) 100%)",
    glow: false,
    dark: false,
    heading: "text-midnight",
    sub: "text-midnight/85",
    body: "text-midnight/70",
    cta: "bg-terracotta text-white hover:bg-terracotta/90 focus-visible:outline-midnight",
    progress: "bg-terracotta",
    control: "bg-midnight/8 text-midnight hover:bg-midnight/14",
    track: "bg-midnight/12",
  },
  DUSK: {
    label: "Dusk (midnight to terracotta)",
    background:
      "linear-gradient(160deg, var(--color-midnight) 0%, var(--color-midnight) 38%, color-mix(in oklab, var(--color-midnight) 45%, var(--color-terracotta)) 78%, var(--color-terracotta) 120%)",
    glow: true,
    dark: true,
    heading: "text-canvas",
    sub: "text-canvas/85",
    body: "text-canvas/70",
    cta: "bg-amber text-midnight hover:bg-amber/90 focus-visible:outline-canvas",
    progress: "bg-amber",
    control: "glass-dark text-canvas hover:bg-white/12",
    track: "bg-white/18",
  },
};

export type LayoutStyle = {
  label: string;
  /** Phone size relative to the breakpoint's base size */
  scale: number;
  /** Offset as % of the visual column, and in-plane tilt */
  x: number;
  y: number;
  rotate: number;
};

export const PHONE_LAYOUT_STYLES: Record<PhoneLayout, LayoutStyle> = {
  RIGHT: { label: "Standard, centred in the right column", scale: 1, x: 0, y: 0, rotate: 0 },
  LOW_LEFT: { label: "Smaller, lower and to the left, tilted left", scale: 0.9, x: -14, y: 6, rotate: -6 },
  HIGH_RIGHT: { label: "Smaller, higher and to the right, tilted right", scale: 0.88, x: 12, y: -5, rotate: 6 },
  CENTER: { label: "Largest, centred", scale: 1.06, x: 0, y: 2, rotate: 0 },
  FAR_RIGHT: { label: "Smallest, far right, slight tilt", scale: 0.84, x: 20, y: 4, rotate: -3 },
};
