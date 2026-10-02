import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/card";
import { Logo } from "./logo";

/**
 * Two-tier header (SPECIFICATION.md §0.3.1, v1.2):
 * a dark utility bar for secondary pages, then a clean single-line main menu for the
 * high-priority pages. Below `lg` the main menu folds into a drawer (native <details>, no JS).
 */

export const MAIN_NAV = [
  { href: "/store", label: "Catalogue" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
  { href: "/services", label: "Wholesale & Enterprise" },
] as const;

export const UTILITY_NAV = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/order", label: "Track order" },
  { href: "/faqs", label: "FAQs" },
] as const;

export function PromoBanner({ text }: { text: string }) {
  return (
    <div className="bg-terracotta text-white">
      {/* v1.3: 20 % shorter — 32 px on desktop (was 40), smaller type on phones */}
      <Container className="flex min-h-8 items-center justify-center gap-3 py-1 text-center text-xs leading-4 font-semibold sm:py-0 sm:text-[0.8125rem]">
        <span>{text}</span>
        <Link href="/deals" className="whitespace-nowrap underline decoration-white/60 underline-offset-4 hover:decoration-white">
          See deals
        </Link>
      </Container>
    </div>
  );
}

function UtilityBar({ phone }: { phone: string | null }) {
  return (
    <div className="border-b border-white/10 bg-midnight text-canvas">
      <Container className="flex h-10 items-center justify-between gap-6 text-[0.8125rem]">
        <nav aria-label="Help and company" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {UTILITY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="whitespace-nowrap text-canvas/70 transition-colors hover:text-canvas">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="truncate text-canvas/70 md:text-right">
          Delivery across Pakistan, cash on delivery
          {phone ? (
            <>
              {" "}
              — call{" "}
              <a href={`tel:${phone}`} className="font-semibold whitespace-nowrap text-canvas">
                {phone}
              </a>
            </>
          ) : null}
        </p>
      </Container>
    </div>
  );
}

function CartPill() {
  return (
    <Link href="/cart" className={buttonClasses("outline", "sm", "gap-2 hover:-translate-y-px")}>
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
        <path d="M3 4h2l1.6 8.2a1.5 1.5 0 0 0 1.5 1.2h6.3a1.5 1.5 0 0 0 1.5-1.2L17 7H6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="16.5" r="1.1" fill="currentColor" />
        <circle cx="14.5" cy="16.5" r="1.1" fill="currentColor" />
      </svg>
      Cart
    </Link>
  );
}

function MobileDrawer() {
  return (
    <details className="group lg:hidden">
      <summary className={buttonClasses("ghost", "sm", "list-none px-3 [&::-webkit-details-marker]:hidden")} aria-label="Menu">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="group-open:hidden" />
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hidden group-open:block" />
        </svg>
      </summary>
      {/* Drawer panel, anchored under the sticky header (whatever its height) */}
      <div className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-7rem)] overflow-y-auto border-b border-midnight/8 bg-canvas px-4 pt-4 pb-10 shadow-[0_30px_60px_-30px_rgb(11_28_51/0.45)] sm:left-auto sm:w-96 sm:rounded-bl-bezel sm:border-l">
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block border-b border-midnight/8 py-4 font-display text-xl font-bold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Help and company (menu)" className="mt-6">
          <ul className="grid grid-cols-2 gap-2">
            {UTILITY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-full px-4 py-2.5 text-[0.9375rem] font-medium hover:bg-surface">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </details>
  );
}

export function SiteHeader({ bannerText, phone }: { bannerText?: string | null; phone: string | null }) {
  return (
    <header className="sticky top-0 z-30">
      {bannerText ? <PromoBanner text={bannerText} /> : null}
      <UtilityBar phone={phone} />
      <div className="border-b border-midnight/8 bg-canvas/95 shadow-[0_10px_30px_-24px_rgb(11_28_51/0.5)] backdrop-blur supports-[backdrop-filter]:bg-canvas/85">
        <Container className="flex h-[4.25rem] items-center justify-between gap-6 whitespace-nowrap">
          <Link href="/" aria-label="Caidea home" className="text-midnight">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative block rounded-full px-4 py-2 text-[0.9375rem] font-semibold text-midnight/80 transition-colors after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-terracotta after:transition-transform after:duration-300 hover:text-midnight hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <CartPill />
            <MobileDrawer />
          </div>
        </Container>
      </div>
    </header>
  );
}
