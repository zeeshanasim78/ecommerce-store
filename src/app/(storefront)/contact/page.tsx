import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/store/content-ui";
import { Container } from "@/components/ui/card";
import { formatPkMobile } from "@/lib/phone";
import { CONTACT_SUBJECTS } from "@/server/content/contact";
import { getShopFacts } from "@/server/storefront/shop-facts";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, WhatsApp, email or send a message to Caidea about an order, a screen, wholesale prices or a warranty claim.",
  alternates: { canonical: "/contact" },
};
export const revalidate = 300;

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const f = getShopFacts();
  const defaultSubject = subject === "wholesale" ? CONTACT_SUBJECTS[2] : undefined;
  const ways = [
    f.phone ? { label: "Call us", value: formatPkMobile(f.phone), href: `tel:${f.phone}` } : null,
    f.whatsapp && f.whatsappUrl ? { label: "WhatsApp", value: formatPkMobile(f.whatsapp), href: f.whatsappUrl } : null,
    f.salesEmail ? { label: "Email", value: f.salesEmail, href: `mailto:${f.salesEmail}` } : null,
  ].filter((w): w is { label: string; value: string; href: string } => w !== null);

  return (
    <>
      <PageIntro title="Contact us" lead="Questions about an order, a screen that fits your phone, wholesale prices or a warranty claim? We read every message." />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
        <ContactForm subjects={CONTACT_SUBJECTS} defaultSubject={defaultSubject} />
        <aside className="flex flex-col gap-6">
          <div className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
            <h2 className="font-sans text-lg font-semibold">Talk to us directly</h2>
            {ways.length ? (
              <ul className="mt-4 flex flex-col gap-4">
                {ways.map((w) => (
                  <li key={w.label}>
                    <p className="text-sm text-midnight/65">{w.label}</p>
                    <a href={w.href} {...(w.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="tabular font-semibold break-all underline decoration-midnight/30 underline-offset-4 hover:decoration-midnight">
                      {w.value}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-midnight/70">Use the form and we will get back to you.</p>
            )}
          </div>
          <div className="rounded-bezel bg-surface p-6">
            <h2 className="font-sans text-lg font-semibold">Quicker answers</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[0.9375rem]">
              <li><Link href="/order" className="font-semibold underline underline-offset-4">Track an order</Link></li>
              <li><Link href="/faqs" className="font-semibold underline underline-offset-4">Frequently asked questions</Link></li>
              <li><Link href="/return-policy" className="font-semibold underline underline-offset-4">Returns and warranty</Link></li>
            </ul>
          </div>
        </aside>
      </Container>
    </>
  );
}
