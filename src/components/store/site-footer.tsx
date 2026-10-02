import Link from "next/link";
import { Container } from "@/components/ui/card";
import { Logo } from "./logo";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { href: "/store", label: "All screens" },
      { href: "/store?grade=oem", label: "OEM Original" },
      { href: "/store?display=oled", label: "OLED and AMOLED" },
      { href: "/store?display=lcd", label: "LCD" },
    ],
  },
  {
    heading: "For repair shops",
    links: [
      { href: "/services", label: "Wholesale pricing" },
      { href: "/services#warranty", label: "Warranty and returns" },
      { href: "/order", label: "Track an order" },
    ],
  },
  {
    heading: "Caidea",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Repair notes" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-midnight text-canvas">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-canvas/70">
            Original and compatible display assemblies for repair shops and phone owners across Pakistan.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="font-sans text-sm font-semibold text-canvas">{col.heading}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[0.9375rem] text-canvas/70 hover:text-canvas">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-canvas/10">
        <Container className="flex flex-col gap-2 py-6 text-sm text-canvas/55 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Caidea. All prices in Pakistani rupees (PKR).</p>
          <p>Cash on delivery, JazzCash, Easypaisa, NayaPay and bank transfer.</p>
        </Container>
      </div>
    </footer>
  );
}
