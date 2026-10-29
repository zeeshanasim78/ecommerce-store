"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-reads the server page every few seconds for a short while (e.g. waiting for the payment company to confirm). */
export function AutoRefresh({ everyMs = 4000, times = 15 }: { everyMs?: number; times?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (++n > times) clearInterval(t);
      else router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, times]);
  return null;
}
