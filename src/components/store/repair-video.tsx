"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { HomeVideo } from "@/db/home-defaults";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * The 6-second repair video (spec §16). Muted, looping and inline so phones autoplay it;
 * it only loads when scrolled near (keeps the home page fast on mobile data), shows its
 * poster under reduced motion, and has a visible pause/play button (WCAG 2.2.2).
 */
export function RepairVideo({ video }: { video: HomeVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => true);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || userPaused) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => undefined);
        else el.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, userPaused]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      setUserPaused(false);
      el.play().catch(() => undefined);
    } else {
      setUserPaused(true);
      el.pause();
    }
  };

  return (
    <figure className="relative">
      <div className="relative overflow-hidden rounded-bezel-lg bg-canvas ring-1 ring-midnight/10 shadow-[0_40px_80px_-50px_rgb(11_28_51/0.6)]">
        <video
          ref={ref}
          className="aspect-[4/5] w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          poster={video.poster ?? undefined}
          aria-label={video.caption}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          {video.webm ? <source src={video.webm} type="video/webm" /> : null}
          {video.mp4 ? <source src={video.mp4} type="video/mp4" /> : null}
        </video>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full bg-midnight/85 text-canvas backdrop-blur transition-colors hover:bg-midnight"
        >
          {playing ? (
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
      <figcaption className="mt-3 text-sm text-midnight/65">{video.caption}</figcaption>
    </figure>
  );
}
