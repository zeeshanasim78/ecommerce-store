import Image from "next/image";
import type { CSSProperties } from "react";
import type { PhoneLayout } from "@/db/schema/catalog";
import type { CatalogCard } from "@/server/storefront/catalog";
import {
  deviceProfileForSlide,
  type DeviceProfile,
  type PhoneMotion,
  type RearLayout,
} from "./device-profiles";
import { PHONE_LAYOUT_STYLES } from "./hero-themes";

/**
 * CSS-3D phone model (spec §0.3.1a; v1.3 §16). No 3D library and no model files.
 * - Shape comes from the linked product (device-profiles.ts): proportions, corners,
 *   front cut-out, rear cameras and colour — so the slide shows the phone it names.
 * - Everything is sized in em: the stage font-size sets the overall size, so the layout
 *   preset (and the breakpoint) can make it bigger or smaller without overflowing.
 * - v1.14: motion is one slow 8-second cycle per slide, different per phone (`motion`, globals.css):
 *   the display placed onto the phone's base, a slow vertical turn, a float, a stand-up, a sway.
 *   The front display is its own layer over an inner "base" (mid-frame + battery), so it can be
 *   lifted off and lowered back on.
 */

function Lens({
  size,
  top,
  left,
}: {
  size: number;
  top: number;
  left: number;
}) {
  return (
    <span
      className="absolute rounded-full"
      style={{
        width: `${size}em`,
        height: `${size}em`,
        top: `${top}em`,
        left: `${left}em`,
        background:
          "radial-gradient(circle at 35% 30%, #4a5a74 0%, #0b0f17 45%, #000 70%)",
        boxShadow:
          "0 0 0 0.18em #4a4e55, 0 0 0 0.32em #1a1c20, 0 0.15em 0.4em rgb(0 0 0 / 0.6)",
      }}
    />
  );
}

function Dot({
  size,
  top,
  left,
  color = "#e8e2d4",
}: {
  size: number;
  top: number;
  left: number;
  color?: string;
}) {
  return (
    <span
      className="absolute rounded-full"
      style={{
        width: `${size}em`,
        height: `${size}em`,
        top: `${top}em`,
        left: `${left}em`,
        background: color,
      }}
    />
  );
}

function RearCameras({ layout }: { layout: RearLayout }) {
  switch (layout) {
    case "iphone-pro":
      return (
        <div
          className="absolute rounded-[1.7em]"
          style={{
            top: "1em",
            left: "1em",
            width: "7em",
            height: "7em",
            background: "rgb(255 255 255 / 0.07)",
            boxShadow: "inset 0 0 0 0.08em rgb(255 255 255 / 0.12)",
          }}
        >
          <Lens size={2.5} top={0.55} left={0.55} />
          <Lens size={2.5} top={3.95} left={0.55} />
          <Lens size={2.5} top={2.25} left={3.95} />
          <Dot size={0.8} top={0.9} left={5.2} />
          <Dot size={0.7} top={5.2} left={5.25} color="#111" />
        </div>
      );
    case "iphone-dual":
      return (
        <div
          className="absolute rounded-[1.4em]"
          style={{
            top: "1em",
            left: "1em",
            width: "5.6em",
            height: "5.6em",
            background: "rgb(255 255 255 / 0.07)",
          }}
        >
          <Lens size={2.1} top={0.5} left={0.5} />
          <Lens size={2.1} top={3} left={3} />
          <Dot size={0.7} top={0.9} left={3.9} />
        </div>
      );
    case "s-ultra":
      return (
        <>
          <Lens size={2.3} top={1.3} left={1.4} />
          <Lens size={2.3} top={4.3} left={1.4} />
          <Lens size={2.3} top={7.3} left={1.4} />
          <Lens size={2.3} top={1.3} left={4.4} />
          <Dot size={0.8} top={4.9} left={4.9} color="#2a2c30" />
          <Dot size={0.8} top={6.4} left={4.9} />
        </>
      );
    case "galaxy-a":
      return (
        <>
          <Lens size={2.1} top={1.4} left={1.5} />
          <Lens size={2.1} top={4.2} left={1.5} />
          <Lens size={1.6} top={7.1} left={1.75} />
          <Dot size={0.7} top={1.9} left={4.4} />
        </>
      );
    case "redmi-note":
      return (
        <div
          className="absolute rounded-[1.5em]"
          style={{
            top: "1em",
            left: "1em",
            width: "5.4em",
            height: "9.6em",
            background: "rgb(255 255 255 / 0.08)",
            boxShadow: "inset 0 0 0 0.08em rgb(255 255 255 / 0.12)",
          }}
        >
          <Lens size={2.6} top={0.55} left={1.4} />
          <Lens size={2.2} top={3.65} left={1.6} />
          <Lens size={1.3} top={6.5} left={0.9} />
          <Dot size={0.75} top={6.8} left={3.3} />
        </div>
      );
    case "square-module":
      return (
        <div
          className="absolute rounded-[1.6em]"
          style={{
            top: "1em",
            left: "1em",
            width: "7.2em",
            height: "7.2em",
            background: "rgb(255 255 255 / 0.08)",
            boxShadow: "inset 0 0 0 0.08em rgb(255 255 255 / 0.14)",
          }}
        >
          <Lens size={2.6} top={0.6} left={0.6} />
          <Lens size={2.6} top={3.9} left={0.6} />
          <Lens size={1.2} top={1.3} left={4.6} />
          <Dot size={0.8} top={4.8} left={4.8} />
        </div>
      );
    case "reno-pill":
      return (
        <div
          className="absolute rounded-full"
          style={{
            top: "1.1em",
            left: "1.1em",
            width: "3.6em",
            height: "8.4em",
            background: "rgb(255 255 255 / 0.09)",
            boxShadow: "inset 0 0 0 0.08em rgb(255 255 255 / 0.16)",
          }}
        >
          <Lens size={2.5} top={0.55} left={0.55} />
          <Lens size={2.5} top={3.4} left={0.55} />
          <Dot size={0.7} top={6.7} left={1.45} />
          <Dot size={0.7} top={7.0} left={4.6} />
        </div>
      );
    default:
      return (
        <div
          className="absolute rounded-[1.4em]"
          style={{
            top: "1em",
            left: "1em",
            width: "5.4em",
            height: "5.4em",
            background: "rgb(255 255 255 / 0.07)",
          }}
        >
          <Lens size={2.1} top={0.55} left={0.55} />
          <Lens size={1.5} top={3.3} left={0.85} />
          <Dot size={0.7} top={1.1} left={3.6} />
        </div>
      );
  }
}

function FrontCutout({ profile }: { profile: DeviceProfile }) {
  const base = "absolute left-1/2 -translate-x-1/2 bg-midnight";
  switch (profile.cutout) {
    case "island":
      return (
        <span
          className={`${base} rounded-full`}
          style={{ top: "0.7em", width: "5.6em", height: "1.6em" }}
        />
      );
    case "notch":
      return (
        <span
          className={base}
          style={{
            top: 0,
            width: "8em",
            height: "1.6em",
            borderRadius: "0 0 1em 1em",
          }}
        />
      );
    case "teardrop":
      return (
        <span
          className={`${base} rounded-full`}
          style={{ top: "0.55em", width: "1em", height: "1em" }}
        />
      );
    default:
      return (
        <span
          className={`${base} rounded-full ring-[0.12em] ring-white/10`}
          style={{ top: "0.75em", width: "1em", height: "1em" }}
        />
      );
  }
}

export function Phone3D({
  product,
  imageUrl,
  label,
  layout = "RIGHT",
  slideText = "",
  motion,
}: {
  product: CatalogCard | null;
  imageUrl?: string | null;
  label: string;
  layout?: PhoneLayout;
  /** v1.14: the slide's heading + subheading — picks the phone when no product is linked */
  slideText?: string;
  /** v1.14: this slide's motion (assigned so each slide differs); defaults to the model's own */
  motion?: PhoneMotion;
}) {
  const p = deviceProfileForSlide(
    product
      ? {
          brand: product.brand,
          model: product.model,
          colour: product.variants[0]?.color,
        }
      : null,
    slideText,
  );
  const l = PHONE_LAYOUT_STYLES[layout];
  const { width: W, height: H, depth: D, radius: R, bezel: B } = p;
  const face = "absolute left-1/2 top-1/2 [backface-visibility:hidden]";
  const edgeBg = `linear-gradient(90deg, ${p.frame}, color-mix(in oklab, ${p.frame} 70%, white) 50%, ${p.frame})`;

  // em-based size: --phone-base is set per breakpoint on the stage; the layout scales it
  const stageStyle = {
    fontSize: `calc(var(--phone-base) * ${l.scale})`,
  } as CSSProperties;

  return (
    <div
      className="phone-stage grid place-items-center [--phone-base:9px] sm:[--phone-base:10px] lg:[--phone-base:12.2px]"
      style={{
        transform: `translate(${l.x}%, ${l.y}%) rotate(${l.rotate}deg)`,
      }}
      role="img"
      aria-label={label}
    >
      <div style={stageStyle} className="grid place-items-center py-[1em]">
        <div className="phone-tilt" data-phone-tilt>
          <div
            className="phone-body relative"
            data-motion={motion ?? p.motion}
            data-device={p.key}
            style={{ width: `${W}em`, height: `${H}em` }}
          >
            {/* v1.14 — the phone's base under the display: mid-frame, battery and flex cables (seen when the display is lifted off) */}
            <div
              className={face}
              aria-hidden="true"
              style={{
                width: `${W}em`,
                height: `${H}em`,
                transform: `translate(-50%,-50%) translateZ(${D / 2 - 0.08}em)`,
                borderRadius: `${R}em`,
                background: `linear-gradient(160deg, color-mix(in oklab, ${p.frame} 85%, white), ${p.frame})`,
                boxShadow: `0 0 0 0.16em ${p.frame}`,
              }}
            >
              <span
                className="absolute rounded-[0.8em]"
                style={{
                  inset: "16% 12% 20% 12%",
                  background: "linear-gradient(180deg, #5a6068, #3a3f46)",
                  boxShadow: "inset 0 0 0 0.12em rgb(255 255 255 / 0.22)",
                }}
              />
              <span
                className="absolute rounded-[0.3em] bg-amber/80"
                style={{ top: "8%", left: "38%", width: "24%", height: "4%" }}
              />
              <span
                className="absolute rounded-[0.3em] bg-amber/60"
                style={{
                  bottom: "9%",
                  left: "30%",
                  width: "40%",
                  height: "3%",
                }}
              />
            </div>

            {/* Front: the display (its own layer, so it can be lifted off and placed back) */}
            <div
              className={face}
              style={{
                width: `${W}em`,
                height: `${H}em`,
                transform: `translate(-50%,-50%) translateZ(${D / 2}em)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="phone-front absolute inset-0 [backface-visibility:hidden]"
                style={{
                  borderRadius: `${R}em`,
                  padding: `${B}em`,
                  background: "#050608",
                  boxShadow: `0 0 0 0.16em ${p.frame}, 0 0 0 0.22em rgb(255 255 255 / 0.18)`,
                }}
              >
                <div
                  className="relative flex h-full flex-col overflow-hidden text-canvas"
                  style={{
                    borderRadius: `${Math.max(R - B, 0.3)}em`,
                    padding: "1.5em",
                    background: "#06080c",
                  }}
                >
                  {/* the lit screen: dims while the display is off the phone, lights up once it's fitted */}
                  <div
                    className="phone-glow absolute inset-0"
                    style={{ background: p.wallpaper }}
                    aria-hidden="true"
                  />
                  <FrontCutout profile={p} />
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="16rem"
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <div className="phone-glow relative mt-auto">
                        {product ? (
                          <>
                            <p className="text-[0.875em] text-canvas/60">
                              {product.brand}
                            </p>
                            <p className="mt-[0.25em] font-display text-[1.65em] leading-[1.05] font-bold tracking-[-0.02em]">
                              {product.model}
                            </p>
                            <p className="mt-[0.75em] text-[0.875em] text-canvas/70">
                              {product.displayType}
                            </p>
                            <span className="mt-[1em] inline-flex h-[2.2em] items-center rounded-full bg-amber px-[0.9em] text-[0.8125em] font-semibold whitespace-nowrap text-midnight">
                              {product.qualityGrade}
                            </span>
                          </>
                        ) : (
                          <p className="font-display text-[1.65em] leading-[1.05] font-bold">
                            Caidea display assemblies
                          </p>
                        )}
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.09)_48%,transparent_62%)]" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Back: housing with this model's camera layout */}
            <div
              className={face}
              style={{
                width: `${W}em`,
                height: `${H}em`,
                transform: `translate(-50%,-50%) rotateY(180deg) translateZ(${D / 2}em)`,
                borderRadius: `${R}em`,
                background: `linear-gradient(150deg, color-mix(in oklab, ${p.back} 80%, white) 0%, ${p.back} 45%, color-mix(in oklab, ${p.back} 85%, black) 100%)`,
                boxShadow: `0 0 0 0.16em ${p.frame}, inset 0 0 0 0.08em rgb(255 255 255 / 0.08)`,
              }}
            >
              <RearCameras layout={p.rear} />
            </div>

            {/* Edges give the slab its thickness when it turns */}
            <div
              className={face}
              style={{
                width: `${D}em`,
                height: `${H - R * 2}em`,
                background: edgeBg,
                transform: `translate(-50%,-50%) rotateY(90deg) translateZ(${W / 2 - 0.05}em)`,
              }}
            />
            <div
              className={face}
              style={{
                width: `${D}em`,
                height: `${H - R * 2}em`,
                background: edgeBg,
                transform: `translate(-50%,-50%) rotateY(-90deg) translateZ(${W / 2 - 0.05}em)`,
              }}
            />
            <div
              className={face}
              style={{
                width: `${W - R * 2}em`,
                height: `${D}em`,
                background: edgeBg,
                transform: `translate(-50%,-50%) rotateX(90deg) translateZ(${H / 2 - 0.05}em)`,
              }}
            />
            <div
              className={face}
              style={{
                width: `${W - R * 2}em`,
                height: `${D}em`,
                background: edgeBg,
                transform: `translate(-50%,-50%) rotateX(-90deg) translateZ(${H / 2 - 0.05}em)`,
              }}
            />
          </div>
        </div>
        {/* floor shadow */}
        <div
          className="mt-[1em] h-[1.4em] w-[12em] rounded-[50%] bg-midnight/35 blur-[0.8em]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
