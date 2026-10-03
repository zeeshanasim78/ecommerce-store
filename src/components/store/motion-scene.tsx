"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Wrapper for the CSS 3D scenes on the home page (v1.11, SPECIFICATION §23.5).
 * Plays by default; pauses when off screen (saves battery on phones), has a visible
 * pause / play button (WCAG 2.2.2), and starts paused when the device asks for reduced
 * motion — the shopper can still press play.
 */
export function MotionScene({ label, children, className, dark = false }: { label: string; children: ReactNode; className?: string; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
  const [userPlay, setUserPlay] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const wants = userPlay ?? !reduce;
  return (
    <div ref={ref} className={cn("motion-scene relative", className)} data-play={wants && visible ? "true" : "false"}>
      {children}
      <button
        type="button"
        onClick={() => setUserPlay(!wants)}
        aria-label={wants ? `Pause the ${label} animation` : `Play the ${label} animation`}
        aria-pressed={!wants}
        className={cn(
          "absolute right-3 bottom-3 z-10 grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
          dark ? "bg-canvas/15 text-canvas ring-1 ring-canvas/25 hover:bg-canvas/25" : "bg-midnight/85 text-canvas hover:bg-midnight",
        )}
      >
        {wants ? (
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
