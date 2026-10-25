import type { Metadata } from "next";
import Link from "next/link";
import { CallToAction, PageIntro } from "@/components/store/content-ui";
import { JsonLd } from "@/components/store/json-ld";
import { Container } from "@/components/ui/card";
import { faqGroups } from "@/server/content/faq";
import { faqLd } from "@/server/content/seo";
import { etaText, getShopFacts } from "@/server/storefront/shop-facts";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about paying, delivery, choosing the right phone screen, warranty and returns at Caidea.",
  alternates: { canonical: "/faqs" },
};
export const revalidate = 300;

export default function FaqsPage() {
  const facts = getShopFacts();
  const groups = faqGroups(facts, etaText(facts));
  return (
    <>
      <JsonLd data={faqLd(groups.flatMap((g) => g.items.map((i) => ({ q: i.q, a: i.a }))))} />
      <PageIntro title="Frequently asked questions" lead="Paying, delivery, picking the right screen, warranty and returns. Can’t find your answer? Ask us." />
      <Container className="grid gap-12 py-12 lg:grid-cols-[14rem_1fr] lg:py-16">
        <nav aria-label="Question topics" className="hidden lg:block">
          <ul className="sticky top-36 flex flex-col gap-1 text-sm">
            {groups.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="block rounded-full px-3 py-1.5 text-midnight/70 hover:bg-midnight/6 hover:text-midnight">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl">
          {groups.map((g) => (
            <section key={g.id} id={g.id} className="mb-12 scroll-mt-36" aria-labelledby={`${g.id}-h`}>
              <h2 id={`${g.id}-h`} className="text-2xl font-bold tracking-[-0.02em]">
                {g.title}
              </h2>
              <div className="mt-4 divide-y divide-midnight/8 rounded-bezel bg-white px-6 ring-1 ring-midnight/8">
                {g.items.map((item) => (
                  <details key={item.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-midnight/60 transition-transform group-open:rotate-180">
                        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </summary>
                    <p className="mt-3 leading-relaxed text-midnight/80">{item.a}</p>
                    {item.link ? (
                      <Link href={item.link.href} className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
                        {item.link.label}
                      </Link>
                    ) : null}
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
      <CallToAction title="Still have a question?" text="Send us the model code of your phone and we will tell you which screen fits." href="/contact" label="Contact us" />
    </>
  );
}
