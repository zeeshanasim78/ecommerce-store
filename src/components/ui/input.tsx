import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const field =
  "h-11 w-full rounded-full border border-midnight/18 bg-white px-5 text-[0.9375rem] text-midnight " +
  "placeholder:text-midnight/45 transition-colors hover:border-midnight/35 " +
  "focus:border-midnight focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta " +
  "aria-[invalid=true]:border-terracotta disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(field, "appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-midnight/60"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Label + control + optional hint/error, wired up for screen readers. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="pl-1 text-sm font-semibold text-midnight">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="pl-1 text-sm font-medium text-terracotta">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="pl-1 text-sm text-midnight/65">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
