import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "urgent" | "ghost" | "outline" | "inverse";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold whitespace-nowrap " +
  "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-terracotta";

const variants: Record<Variant, string> = {
  // Midnight: the default call to action
  primary: "bg-midnight text-canvas hover:bg-midnight/88",
  // Terracotta: checkout and other high-urgency actions only
  urgent: "bg-terracotta text-white hover:bg-terracotta/90",
  ghost: "bg-transparent text-midnight hover:bg-midnight/6",
  outline: "border border-midnight/20 bg-white text-midnight hover:border-midnight/45",
  // For use on midnight panels
  inverse: "bg-canvas text-midnight hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.9375rem]",
  lg: "h-13 px-8 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
