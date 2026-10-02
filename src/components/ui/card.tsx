import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Radius = "sm" | "md" | "lg";
const radii: Record<Radius, string> = {
  sm: "rounded-bezel-sm",
  md: "rounded-bezel",
  lg: "rounded-bezel-lg",
};

/** White floating container with a phone-bezel corner radius. */
export function Card({ radius = "md", className, ...props }: ComponentProps<"div"> & { radius?: Radius }) {
  return <div className={cn("bg-white ring-1 ring-midnight/8", radii[radius], className)} {...props} />;
}

/** Page-width wrapper with consistent side gutters. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

/** Full-width midnight band — the horizontal "visual pause" between light sections (spec §0.3). */
export function SectionDark({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("bg-midnight text-canvas", className)} {...props}>
      {children}
    </section>
  );
}
