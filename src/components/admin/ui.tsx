import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Admin page heading with an optional action area (e.g. "New slide" button). */
export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div className="max-w-2xl">
        <h1 className="text-[1.875rem] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
        {description ? <p className="mt-2 text-midnight/70">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

/** Success / error message shown after a form redirect (?saved=…). */
export function Notice({ tone = "success", children }: { tone?: "success" | "error"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        "mb-6 rounded-bezel-sm px-5 py-3 text-[0.9375rem] font-medium",
        tone === "success" ? "bg-midnight text-canvas" : "bg-terracotta/10 text-terracotta",
      )}
    >
      {children}
    </p>
  );
}

const area =
  "w-full rounded-bezel-sm border border-midnight/18 bg-white px-5 py-3 text-[0.9375rem] text-midnight placeholder:text-midnight/45 " +
  "hover:border-midnight/35 focus:border-midnight focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(area, "min-h-28", className)} {...props} />;
}

/** Labelled on/off switch built on a real checkbox, so it posts with the form. */
export function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-midnight/20 transition-colors peer-checked:bg-midnight peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-sm text-midnight/65">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Small status label for list rows. */
export function Status({ on, onLabel = "Active", offLabel = "Hidden" }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[0.8125rem] font-semibold whitespace-nowrap",
        on ? "bg-midnight text-canvas" : "bg-midnight/8 text-midnight/70",
      )}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export function Section({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8 sm:p-8">
      <h2 className="font-sans text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-midnight/65">{description}</p> : null}
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/**
 * Two-step delete without JavaScript: the first click opens a small confirm panel,
 * the second submits. `action` is a Server Action that reads the hidden `id`.
 */
export function ConfirmDelete({ action, id, label, what }: { action: (fd: FormData) => Promise<void>; id: string; label?: string; what: string }) {
  return (
    <details className="group relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full px-4 text-sm font-semibold text-terracotta hover:bg-terracotta/8 [&::-webkit-details-marker]:hidden">
        {label ?? "Delete"}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-bezel-sm bg-white p-4 shadow-[0_18px_40px_-18px_rgb(11_28_51/0.4)] ring-1 ring-midnight/10">
        <p className="text-sm">Delete {what}? This can’t be undone.</p>
        <form action={action} className="mt-3">
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="inline-flex h-9 items-center rounded-full bg-terracotta px-4 text-sm font-semibold text-white">
            Yes, delete
          </button>
        </form>
      </div>
    </details>
  );
}
