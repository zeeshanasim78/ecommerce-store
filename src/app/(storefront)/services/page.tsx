import type { Metadata } from "next";
import { ArticleMarkdown } from "@/components/store/article-markdown";
import { CallToAction, PageIntro, ServiceGlyph, Testimonials } from "@/components/store/content-ui";
import { Container } from "@/components/ui/card";
import { db } from "@/db/client";
import { listActiveServices } from "@/server/content/services";
import { listPublishedTestimonials } from "@/server/content/testimonials";

export const metadata: Metadata = {
  title: "Wholesale and enterprise",
  description: "Wholesale screen prices for repair shops, bulk supply, fitting at our counter and warranty service from Caidea.",
  alternates: { canonical: "/services" },
};
export const revalidate = 300;

const STEPS = [
  { title: "Tell us about your shop", text: "Send your shop name, city and mobile number through the contact form or on WhatsApp." },
  { title: "We register you", text: "A manager approves you as a technician. Your mobile number is how we find you." },
  { title: "Buy at wholesale prices", text: "At our counter your wholesale prices apply to every brand we stock, and never rise above the shelf price." },
];

export default function ServicesPage() {
  const services = listActiveServices(db);
  const testimonials = listPublishedTestimonials(db, 3);
  return (
    <>
      <PageIntro
        eyebrow="Wholesale & enterprise"
        title="Supply for repair shops, from one box to a full shelf."
        lead="Trade prices for approved technicians, fitting at our counter, and warranty service you can rely on."
      />

      <Container className="py-16">
        {services.length === 0 ? (
          <p className="text-midnight/70">Our services are being updated. Please contact us and we will help directly.</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} id={s.slug} className="scroll-mt-36 rounded-bezel bg-white p-7 ring-1 ring-midnight/8">
                <ServiceGlyph name={s.icon} />
                <h2 className="mt-5 text-xl font-bold tracking-[-0.01em]">{s.title}</h2>
                <p className="mt-2 leading-relaxed text-midnight/75">{s.summary}</p>
                {s.bodyMd ? (
                  <div className="mt-4 text-[0.9375rem]">
                    <ArticleMarkdown>{s.bodyMd}</ArticleMarkdown>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Container>

      <section className="bg-surface py-16 md:py-20" aria-labelledby="wholesale-heading">
        <Container>
          <h2 id="wholesale-heading" className="text-3xl font-bold tracking-[-0.02em]">
            How wholesale pricing works
          </h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-bezel bg-white p-7 ring-1 ring-midnight/8">
                <span className="tabular grid size-10 place-items-center rounded-full bg-midnight font-display font-bold text-canvas" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-sans text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-midnight/75">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Testimonials items={testimonials} />
      <CallToAction title="Run a repair shop?" text="Ask for wholesale pricing and we will get you set up." href="/contact?subject=wholesale" label="Ask for wholesale pricing" secondary={{ href: "/return-policy", label: "Warranty and returns" }} />
    </>
  );
}
