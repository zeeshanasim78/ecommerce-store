"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { HeroTheme } from "@/db/schema/catalog";
import { cn } from "@/lib/cn";
import { HERO_THEME_STYLES } from "./hero-themes";

export type HeroSlideContent = {
  id: string;
  heading: string;
  subheading: string | null;
  body: ReactNode; // Markdown rendered on the server
  ctaLabel: string;
  ctaHref: string;
  visual: ReactNode; // Phone3D or image, rendered on the server
  theme: HeroTheme; // v1.3: per-slide background and text colours
};

const SLIDE_MS = 4000; // spec §0.3.1a: advance every 4 seconds

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * Hero carousel (SPECIFICATION.md §0.3.1a, v1.2; v1.3 §16: per-slide themes, 20 % shorter).
 * - Each slide has its own theme; backgrounds cross-fade and the controls follow the active theme.
 * - Timing is a CSS animation on the active progress bar; when it ends, the next slide shows.
 *   Pausing just pauses that animation, so the bar and the timer can never drift apart.
 * - Pauses on hover, on keyboard focus, when the tab is hidden, and by the play/pause button.
 * - Starts paused for people who prefer reduced motion (WCAG 2.2.2).
 */
export function HeroCarousel({ slides }: { slides: HeroSlideContent[] }) {
  const [active, setActive] = useState(0);
  // null = the shopper hasn't pressed play/pause; then reduced-motion decides
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [hoverPaused, setHoverPaused] = useState(false);
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const hidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
  const rootRef = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const count = slides.length;

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);
  const manuallyPaused = userPaused ?? reduceMotion;
  const paused = manuallyPaused || hoverPaused || hidden || count < 2;

  // Pointer tilt for the 3D phone: write CSS variables once per animation frame
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      rootRef.current?.querySelectorAll<HTMLElement>("[data-phone-tilt]").forEach((el) => {
        el.style.setProperty("--tilt-y", `${(x * 16).toFixed(2)}deg`);
        el.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
      });
    });
  };
  const resetTilt = () => {
    cancelAnimationFrame(frame.current);
    rootRef.current?.querySelectorAll<HTMLElement>("[data-phone-tilt]").forEach((el) => {
      el.style.removeProperty("--tilt-y");
      el.style.removeProperty("--tilt-x");
    });
  };

  if (count === 0) return null;
  const theme = HERO_THEME_STYLES[slides[active]?.theme ?? "MIDNIGHT"];

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Featured screens"
      className="hero-root relative isolate overflow-hidden bg-midnight"
      // v1.11: the pause button also stops the phone turning; pressing play overrides reduced motion
      data-paused={manuallyPaused ? "true" : undefined}
      data-user-play={userPaused === false ? "true" : undefined}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => {
        setHoverPaused(false);
        resetTilt();
      }}
      onPointerMove={onPointerMove}
      onFocus={() => setHoverPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHoverPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      {/* One background per slide; only the active one is visible, so themes cross-fade */}
      {slides.map((slide, i) => {
        const t = HERO_THEME_STYLES[slide.theme];
        return (
          <div
            key={`bg-${slide.id}`}
            aria-hidden="true"
            className={cn("absolute inset-0 -z-10 transition-opacity duration-700", i === active ? "opacity-100" : "opacity-0")}
            style={{ background: t.background }}
          >
            {/* Ambient glow only on dark themes (glass-on-dark rule, spec §0.2) */}
            {t.glow ? <div className="ambient-dark absolute inset-0" /> : null}
          </div>
        );
      })}

      <div className="mx-auto grid w-full max-w-6xl px-4 pt-7 pb-2 sm:px-6 md:pt-10 lg:px-8 [grid-template-areas:'stack']">
        {slides.map((slide, i) => {
          const isActive = i === active;
          const t = HERO_THEME_STYLES[slide.theme];
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.heading}`}
              aria-hidden={!isActive}
              data-active={isActive}
              inert={!isActive}
              className={cn(
                "grid items-center gap-2 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] [grid-area:stack] lg:grid-cols-[1.05fr_1fr] lg:gap-10",
                isActive ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-6 opacity-0",
              )}
            >
              <div className={cn("max-w-xl", isActive && "hero-enter")}>
                {i === 0 ? (
                  <h1 className={cn("text-[1.95rem] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[2.6rem] lg:text-[2.85rem]", t.heading)}>{slide.heading}</h1>
                ) : (
                  <h2 className={cn("text-[1.95rem] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[2.6rem] lg:text-[2.85rem]", t.heading)}>{slide.heading}</h2>
                )}
                {slide.subheading ? <p className={cn("mt-3 text-base font-medium sm:mt-4 sm:text-lg", t.sub)}>{slide.subheading}</p> : null}
                {slide.body ? <div className={cn("hero-body mt-3 max-w-[60ch] text-[0.9375rem] leading-relaxed sm:text-base", t.body, t.dark ? "" : "hero-body-light")}>{slide.body}</div> : null}
                <Link
                  href={slide.ctaHref}
                  className={cn(
                    "mt-5 inline-flex h-12 items-center rounded-full px-7 font-semibold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 sm:mt-7",
                    t.cta,
                  )}
                >
                  {slide.ctaLabel}
                </Link>
              </div>
              <div className="grid place-items-center">{slide.visual}</div>
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 pb-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setUserPaused(!manuallyPaused)}
            aria-label={manuallyPaused ? "Play slideshow" : "Pause slideshow"}
            className={cn("grid size-10 shrink-0 place-items-center rounded-full transition-colors", theme.control)}
          >
            {manuallyPaused ? (
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                <path d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" fill="currentColor" />
              </svg>
            )}
          </button>
          <ol className="flex flex-1 gap-2" aria-label="Choose a slide">
            {slides.map((slide, i) => (
              <li key={slide.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}: ${slide.heading}`}
                  aria-current={i === active ? "true" : undefined}
                  className="group block w-full py-3"
                >
                  <span className={cn("block h-1 overflow-hidden rounded-full transition-colors", theme.track)}>
                    <span
                      key={i === active ? `run-${active}` : "idle"}
                      data-hero-progress={i === active ? "" : undefined}
                      className={cn("block h-full w-full origin-left rounded-full", theme.progress)}
                      style={
                        i === active
                          ? { transform: "scaleX(0)", animation: `hero-progress ${SLIDE_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }
                          : { transform: i < active ? "scaleX(1)" : "scaleX(0)" }
                      }
                      onAnimationEnd={i === active ? () => go(active + 1) : undefined}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <span className={cn("tabular w-12 text-right text-sm opacity-70", theme.heading)} aria-hidden="true">
            {active + 1}/{count}
          </span>
        </div>
      ) : (
        <div className="pb-4" />
      )}
    </section>
  );
}
