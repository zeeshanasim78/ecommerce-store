import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/card";
import type { ServiceIcon } from "@/server/content/services";

/** Small building blocks shared by the About, Services, Contact, FAQ and policy pages (v1.18, M13). */

export function PageIntro({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <div className="border-b border-midnight/8 bg-surface">
      <Container className="py-14 md:py-20">
        {eyebrow ? <p className="text-sm font-semibold text-terracotta">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-midnight/75">{lead}</p> : null}
      </Container>
    </div>
  );
}

const ICON_PATHS: Record<ServiceIcon, ReactNode> = {
  wholesale: <path d="M4 9l8-5 8 5v10H4zM9 19v-6h6v6" />,
  fitting: <path d="M14 5l5 5-9 9H5v-5zM12 7l5 5" />,
  warranty: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2.2 2.2L15.5 10" />,
  delivery: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.6 1.6 0 100-.01M17 19a1.6 1.6 0 100-.01" />,
  support: <path d="M5 13v-1a7 7 0 0114 0v1M5 13h2v4H5zM17 13h2v4h-2zM17 17c0 2-2 3-5 3" />,
  quality: <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.9l.9-5.4L4.2 9.7l5.4-.8z" />,
};

export function ServiceGlyph({ name }: { name: ServiceIcon | string | null }) {
  const paths = ICON_PATHS[(name as ServiceIcon) ?? "quality"] ?? ICON_PATHS.quality;
  return (
    <span className="grid size-12 place-items-center rounded-full bg-midnight text-canvas" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths}
      </svg>
    </span>
  );
}

export type TestimonialView = { id: string; authorName: string; authorRole: string | null; city: string | null; rating: number | null; quote: string };

export function Testimonials({ items, heading = "What repair shops say" }: { items: TestimonialView[]; heading?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="py-16 md:py-20" aria-labelledby="testimonials-heading">
      <Container>
        <h2 id="testimonials-heading" className="text-3xl font-bold tracking-[-0.02em] md:text-[2.25rem]">
          {heading}
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={t.id}>
              <figure className="flex h-full flex-col rounded-bezel bg-white p-7 ring-1 ring-midnight/8">
                {t.rating ? (
                  <p className="text-amber" role="img" aria-label={`${t.rating} out of 5 stars`}>
                    <span aria-hidden="true">{"★".repeat(t.rating)}<span className="text-midnight/20">{"★".repeat(5 - t.rating)}</span></span>
                  </p>
                ) : null}
                <blockquote className="mt-3 flex-1 leading-relaxed text-midnight/85">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{t.authorName}</span>
                  {t.authorRole || t.city ? <span className="text-midnight/65"> — {[t.authorRole, t.city].filter(Boolean).join(", ")}</span> : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export type LegalSection = { id: string; heading: string; body: ReactNode };

/** Policy-style page: a contents list on wide screens, numbered sections. */
export function LegalPage({ title, lead, updated, sections }: { title: string; lead: string; updated: string; sections: LegalSection[] }) {
  return (
    <>
      <PageIntro title={title} lead={lead} />
      <Container className="grid gap-12 py-12 lg:grid-cols-[14rem_1fr] lg:py-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-36 flex flex-col gap-1 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-full px-3 py-1.5 text-midnight/70 hover:bg-midnight/6 hover:text-midnight">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="max-w-3xl">
          <p className="text-sm text-midnight/60">Last updated {updated}</p>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-36">
              <h2 className="text-2xl font-bold tracking-[-0.02em]">
                {i + 1}. {s.heading}
              </h2>
              <div className="article mt-4">{s.body}</div>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}

export function CallToAction({ title, text, href, label, secondary }: { title: string; text: string; href: string; label: string; secondary?: { href: string; label: string } }) {
  return (
    <section className="bg-midnight text-canvas">
      <Container className="flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">{title}</h2>
          <p className="mt-2 text-canvas/75">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={href} variant="inverse" size="lg">
            {label}
          </ButtonLink>
          {secondary ? (
            <Link href={secondary.href} className="inline-flex h-13 items-center rounded-full border border-canvas/30 px-8 font-semibold hover:border-canvas">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
