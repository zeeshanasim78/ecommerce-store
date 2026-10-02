import Link from "next/link";
import { BrandShowcase } from "@/components/store/brand-showcase";
import { HeroCarousel, type HeroSlideContent } from "@/components/store/hero-carousel";
import { RepairVideo } from "@/components/store/repair-video";
import { SafeMarkdown } from "@/components/store/markdown";
import { Phone3D } from "@/components/store/phone-3d";
import { GradeBadge } from "@/components/ui/badge";
import { Container, SectionDark } from "@/components/ui/card";
import { getBrandSummaries, getCategorySummaries, getHeroSlides, listCatalog } from "@/server/storefront/catalog";
import { getHomeStats, getHomeVideo } from "@/server/storefront/home-content";

// Rebuilt at most every 5 minutes; admin changes refresh it immediately (revalidateStorefront).
export const revalidate = 300;

/** Shown only until the owner adds hero slides in the admin. */
const FALLBACK_SLIDE = {
  id: "fallback",
  heading: "Screens graded like the originals they replace.",
  subheading: "OLED, AMOLED and LCD display assemblies for Samsung, Apple, Xiaomi, Oppo, Vivo, Infinix and Tecno.",
  bodyMd: "Sold to repair shops and phone owners, **delivered across Pakistan**.",
  ctaLabel: "Browse screens",
  ctaHref: "/store",
  visualType: "PHONE_3D" as const,
  visualUrl: null,
  theme: "MIDNIGHT" as const,
  phoneLayout: "RIGHT" as const,
  product: null,
};

const GRADES = [
  {
    grade: "OEM Original",
    text: "The panel the phone maker fitted at the factory, supplied as a service part. Colour, brightness and touch match the original exactly.",
  },
  {
    grade: "OLED A Grade",
    text: "A full OLED panel from an aftermarket line. True blacks and in-display fingerprint support on most models, at a lower price than OEM.",
  },
  {
    grade: "Compatible A Grade",
    text: "Our best LCD or incell replacement. Every unit is powered on and touch-tested before it is packed.",
  },
];

/** Matches the six steps shown in the repair video. */
const REPAIR_STEPS = [
  { title: "Check it really is the screen", text: "Lines, black patches, ghost touches or a dark screen with sound still working all point to the display, not the phone’s board." },
  { title: "Warm the edges and lift the display", text: "Gentle heat softens the factory glue. A suction cup and thin picks open the phone without bending the frame." },
  { title: "Disconnect the battery first", text: "The battery cable comes off before the screen cables, so nothing shorts while parts are moved." },
  { title: "Move over the parts that stay", text: "The earpiece speaker and its sensor cable usually transfer to the new screen. On iPhones, True Tone needs the old screen’s data copied across with a programmer." },
  { title: "Test before sealing", text: "The new screen is connected and tested for touch, brightness, colour and sensors before any glue goes on." },
  { title: "Seal and check again", text: "Fresh adhesive keeps out dust and moisture. A last check makes sure the edges sit flush." },
];

const BUYING_CHECKS = [
  { title: "Match the exact model code", text: "Phones that share a name can use different screens. Check the code in Settings, About phone (for example SM-A546E), not just “A54”." },
  { title: "Pick the right grade", text: "OEM Original matches the factory screen exactly. OLED A Grade keeps deep blacks. Compatible A Grade is the budget choice for everyday use." },
  { title: "Need the fingerprint under the screen?", text: "In-display fingerprint readers only work through OLED and AMOLED panels. An LCD replacement won’t read your finger." },
  { title: "With frame or without", text: "A screen with the frame already fitted is faster and safer to install, especially on curved Samsung models, but costs a little more." },
  { title: "iPhone features to ask about", text: "Ask whether True Tone can be restored and whether a message about a non-genuine display will appear, so there are no surprises." },
  { title: "Warranty and testing", text: "Check the warranty length, keep the protective film on until the screen is tested, and keep your receipt for any claim." },
];

const VALUES = [
  {
    title: "Carefully selected grades",
    text: "We stock a short list of suppliers per brand and reject batches that fail colour or touch checks. The grade on the label is the grade in the box.",
  },
  {
    title: "Handled properly",
    text: "Screens are stored flat in anti-static sleeves, shelved by model, and never stacked loose. Each one is logged from the moment it arrives.",
  },
  {
    title: "Delivered safely",
    text: "Rigid packing with corner guards for every courier parcel. If a screen arrives cracked, we replace it.",
  },
];

export default function HomePage() {
  const stats = getHomeStats();
  const video = getHomeVideo();
  const dbSlides = getHeroSlides();
  const slides: HeroSlideContent[] = (dbSlides.length ? dbSlides : [FALLBACK_SLIDE]).map((s) => ({
    id: s.id,
    heading: s.heading,
    subheading: s.subheading,
    body: s.bodyMd ? <SafeMarkdown>{s.bodyMd}</SafeMarkdown> : null,
    ctaLabel: s.ctaLabel,
    ctaHref: s.ctaHref,
    theme: s.theme,
    visual: (
      <Phone3D
        product={s.product}
        imageUrl={s.visualType === "IMAGE" ? s.visualUrl : null}
        layout={s.phoneLayout}
        label={s.product ? `${s.product.brand} ${s.product.model} ${s.product.qualityGrade} screen` : "Phone display assembly"}
      />
    ),
  }));

  const featured = listCatalog({ featured: true });
  const showcase = featured.length >= 4 ? featured : listCatalog();
  const brandCounts = [...new Set(showcase.map((p) => p.brand))].map((name) => ({ name, count: showcase.filter((p) => p.brand === name).length }));
  const brandSummaries = getBrandSummaries();
  const categoriesList = getCategorySummaries().filter((c) => c.count > 0);

  return (
    <>
      <HeroCarousel slides={slides} />

      {/* v1.3: Caidea in numbers (figures edited in Admin → Home page) */}
      <section aria-labelledby="numbers-heading" className="border-b border-midnight/8 bg-canvas">
        <Container className="py-10 md:py-12">
          <h2 id="numbers-heading" className="sr-only">
            Caidea in numbers
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:flex lg:justify-between">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse lg:border-l lg:border-midnight/10 lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                <dt className="mt-1 text-[0.9375rem] text-midnight/70">{s.label}</dt>
                <dd className="tabular font-display text-[2.25rem] leading-none font-bold tracking-[-0.03em] md:text-[2.75rem]">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Products by brand and category */}
      <section className="py-20 md:py-24" aria-labelledby="products-heading">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 id="products-heading" className="text-3xl font-bold tracking-[-0.02em] md:text-[2.5rem] md:leading-tight">
                {featured.length >= 4 ? "Featured screens" : "Screens by brand"}
              </h2>
              <p className="mt-3 text-lg text-midnight/75">
                {brandSummaries.length} brands, every screen graded and tested before it ships.
              </p>
            </div>
            <Link href="/store" className="font-semibold underline decoration-midnight/30 underline-offset-4 hover:decoration-midnight">
              See the full catalogue
            </Link>
          </div>
          {categoriesList.length ? (
            <nav aria-label="Categories" className="mt-8 flex flex-wrap gap-2">
              {categoriesList.map((c) => (
                <Link
                  key={c.slug}
                  href={`/store?category=${c.slug}`}
                  className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-sm font-semibold transition-[transform,background-color] hover:-translate-y-px hover:bg-midnight hover:text-canvas"
                >
                  {c.name} <span className="ml-1.5 font-medium opacity-60">{c.count}</span>
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="mt-8">
            <BrandShowcase products={showcase} brands={brandCounts} />
          </div>
        </Container>
      </section>

      {/* v1.3: changing a screen, explained (replaces the cities map, spec §16) */}
      <section className="bg-surface py-20 md:py-24" aria-labelledby="repair-heading">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <h2 id="repair-heading" className="text-3xl font-bold tracking-[-0.02em] md:text-[2.5rem] md:leading-tight">
                Changing a screen, explained
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-midnight/75">
                What a technician does when a screen is replaced. Knowing the steps helps you judge a quote, and helps you pick the right part.
              </p>
              <ol className="mt-10 flex flex-col gap-6">
                {REPAIR_STEPS.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[2.75rem_1fr] gap-4">
                    <span className="tabular grid size-11 place-items-center rounded-full bg-midnight font-display text-lg font-bold text-canvas" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-sans text-lg font-semibold">{step.title}</h3>
                      <p className="mt-1 leading-relaxed text-midnight/75">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:sticky lg:top-36">
              <RepairVideo video={video} />
            </div>
          </div>

          <div className="mt-20">
            <h3 className="text-2xl font-bold tracking-[-0.02em] md:text-[2rem]">Before you buy a screen</h3>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BUYING_CHECKS.map((c) => (
                <li key={c.title} className="flex gap-4 rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
                  <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-terracotta" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
                    <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-midnight/75">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Dark pause: how grades work */}
      <SectionDark className="py-20 md:py-28" aria-labelledby="grades-heading">
        <Container>
          <h2 id="grades-heading" className="max-w-2xl text-3xl font-bold tracking-[-0.02em] md:text-[2.5rem] md:leading-tight">
            How we grade a screen
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {GRADES.map((g) => (
              <div key={g.grade} className="border-t border-canvas/15 pt-6">
                <GradeBadge grade={g.grade} />
                <p className="mt-5 leading-relaxed text-canvas/75">{g.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </SectionDark>

      {/* What we stand for */}
      <section className="py-20 md:py-28" aria-labelledby="values-heading">
        <Container>
        <h2 id="values-heading" className="text-3xl font-bold tracking-[-0.02em] md:text-[2.5rem] md:leading-tight">
          What we stand for
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {VALUES.map((v) => (
            <div key={v.title} className="border-t-2 border-midnight pt-6">
              <h3 className="text-xl font-bold tracking-[-0.01em]">{v.title}</h3>
              <p className="mt-3 leading-relaxed text-midnight/75">{v.text}</p>
            </div>
          ))}
        </div>
        </Container>
      </section>
    </>
  );
}
