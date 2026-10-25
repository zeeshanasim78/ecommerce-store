import type { Metadata } from "next";
import Link from "next/link";
import { CallToAction, PageIntro, Testimonials } from "@/components/store/content-ui";
import { GradeBadge } from "@/components/ui/badge";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { listPublishedTestimonials } from "@/server/content/testimonials";
import { etaText, getShopFacts } from "@/server/storefront/shop-facts";

export const metadata: Metadata = {
  title: "About us",
  description: "Caidea supplies original and compatible phone display assemblies to repair shops and phone owners across Pakistan, each graded and tested before it is packed.",
  alternates: { canonical: "/about" },
};
export const revalidate = 300;

const GRADES = [
  { grade: "OEM Original", text: "The panel the phone maker fitted at the factory, supplied as a service part." },
  { grade: "OLED A Grade", text: "A full OLED panel from an aftermarket line, with deep blacks and in-display fingerprint support on most models." },
  { grade: "Compatible A Grade", text: "Our best LCD or incell replacement for everyday use at the lowest price." },
];

const PRINCIPLES = [
  { title: "Carefully selected grades", text: "We sell three clearly named grades and nothing vaguer. The grade on the label is the grade in the box." },
  { title: "Handled properly", text: "Every screen is powered on and touch-tested before it is packed, and packed to survive the courier." },
  { title: "Delivered safely", text: "Parcels leave with tracked couriers, and you can follow yours with just the order number and your phone." },
];

export default function AboutPage() {
  const facts = getShopFacts();
  const testimonials = listPublishedTestimonials(db, 3);
  return (
    <>
      <PageIntro
        eyebrow="About Caidea"
        title="Phone screens, graded honestly and delivered across Pakistan."
        lead="We supply display assemblies for Samsung, Apple, Xiaomi, Oppo, Vivo, Infinix and Tecno to repair shops and to people fixing their own phones."
      />

      <Container className="grid gap-12 py-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.02em]">What we do</h2>
          <div className="mt-5 flex flex-col gap-4 text-lg leading-relaxed text-midnight/80">
            <p>A replacement screen is only as good as the grade you actually receive. We keep a focused range, describe each screen by its real grade and display type, and keep one shared stock for our counter and this website, so what you see in stock is on the shelf.</p>
            <p>Repair shops get wholesale prices once they are approved. Everyone else pays the same shelf price online as at the counter, delivered {etaText(facts)} to cities across Pakistan.</p>
          </div>
        </div>
        <ul className="flex flex-col gap-4">
          {GRADES.map((g) => (
            <li key={g.grade} className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
              <GradeBadge grade={g.grade} />
              <p className="mt-3 leading-relaxed text-midnight/75">{g.text}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="bg-surface py-16 md:py-20" aria-labelledby="principles-heading">
        <Container>
          <h2 id="principles-heading" className="text-3xl font-bold tracking-[-0.02em]">
            How we work
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="rounded-bezel bg-white p-7 ring-1 ring-midnight/8">
                <span className="tabular grid size-10 place-items-center rounded-full bg-midnight font-display font-bold text-canvas" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-sans text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-midnight/75">{p.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-midnight/75">
            Read the details in our <Link href="/return-policy" className="font-semibold underline underline-offset-4">returns and warranty policy</Link> or the{" "}
            <Link href="/faqs" className="font-semibold underline underline-offset-4">FAQs</Link>.
          </p>
        </Container>
      </section>

      <Testimonials items={testimonials} heading="What our customers say" />
      <CallToAction title="Ready to find your screen?" text="Browse the catalogue, or tell us your phone's model code and we will point you to the right one." href="/store" label="Browse screens" secondary={{ href: "/contact", label: "Contact us" }} />
    </>
  );
}
