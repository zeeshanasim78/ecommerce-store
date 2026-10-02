"use client";

import { buttonClasses } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses("primary", "sm")}>
      Print or save as PDF
    </button>
  );
}
