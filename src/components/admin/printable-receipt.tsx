"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wraps the 80 mm receipt for printing (spec §6.4 step 3). CSS can't say "80 mm wide, as long as the
 * content" (`size: 80mm auto` is invalid and browsers ignore it), so the receipt is measured on screen
 * and the page is set to exactly 80 mm × its length — a roll printer feeds only what the receipt needs.
 * `offscreen`: kept out of view on screen (but measurable), printed in place.
 */
export function PrintableReceipt({ children, offscreen = false }: { children: ReactNode; offscreen?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lengthMm, setLengthMm] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const px = el.getBoundingClientRect().height;
      if (px > 0) setLengthMm(Math.ceil((px * 25.4) / 96) + 10); // + top/bottom margins and a little to tear off
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <style>{`@page { size: 80mm ${lengthMm ?? 297}mm; margin: 4mm 4mm; } @media print { html, body { background: #FFFFFF !important; } }`}</style>
      <div ref={ref} aria-hidden={offscreen || undefined} className={offscreen ? "pointer-events-none fixed top-0 left-[-320mm] print:pointer-events-auto print:static" : undefined}>
        {children}
      </div>
    </>
  );
}
