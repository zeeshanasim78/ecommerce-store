import { cn } from "@/lib/cn";

/** Placeholder brand mark (Clarify Q14): a display panel inside a bezel, plus the wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 22 32" aria-hidden="true" className="h-7 w-auto">
        <rect x="1" y="1" width="20" height="30" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="4.5" y="4.5" width="13" height="23" rx="2.5" className="fill-amber" />
        <rect x="8.5" y="6.5" width="5" height="1.6" rx="0.8" className="fill-midnight" />
      </svg>
      <span className="font-display text-[1.375rem] leading-none font-bold tracking-[-0.02em]">Caidea</span>
    </span>
  );
}
