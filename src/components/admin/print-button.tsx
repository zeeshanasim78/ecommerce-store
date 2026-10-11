"use client";

import { buttonClasses } from "@/components/ui/button";

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses("primary", "sm")}>
      {label}
    </button>
  );
}
