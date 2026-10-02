import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Spec table — the catalog's "precision cataloging" layout (spec §0.3.5).
 * Scrolls horizontally inside its own frame on phones so the page never scrolls sideways.
 */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-bezel bg-white ring-1 ring-midnight/8">
      <table className={cn("w-full border-collapse text-left text-[0.9375rem]", className)} {...props} />
    </div>
  );
}

export function THead(props: ComponentProps<"thead">) {
  return <thead className="bg-surface text-[0.8125rem] font-semibold text-midnight/70" {...props} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-t border-midnight/8 first:border-t-0", className)} {...props} />;
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cn("px-5 py-3 font-semibold whitespace-nowrap", className)} {...props} />;
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-5 py-4 align-middle", className)} {...props} />;
}
