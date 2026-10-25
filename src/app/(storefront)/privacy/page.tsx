import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/store/content-ui";
import { getShopFacts } from "@/server/storefront/shop-facts";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal information Caidea collects when you order or contact us, why, and who sees it.",
  alternates: { canonical: "/privacy" },
};
export const revalidate = 300;
const PRIVACY_UPDATED = "25 October 2026";

export default function PrivacyPage() {
  const f = getShopFacts();
  const sections: LegalSection[] = [
    { id: "who", heading: "Who we are", body: <p>{f.name} sells phone replacement screens in Pakistan, online and at our counter. This page explains what we do with the personal information you give us.</p> },
    {
      id: "collect",
      heading: "What we collect",
      body: (
        <ul>
          <li><strong>When you order:</strong> your name, mobile number, email address and delivery address, what you ordered, and — for payments in advance — the transaction ID and payment slip you send us.</li>
          <li><strong>When you contact us:</strong> your name, phone and/or email, and your message.</li>
          <li><strong>At the counter:</strong> the items sold and, if you give them, your name and mobile number (technicians who get wholesale prices are registered with their shop name).</li>
        </ul>
      ),
    },
    { id: "why", heading: "Why we use it", body: <p>To take and deliver your order, confirm payment, answer your questions, handle warranty and returns, keep our accounts, and prevent fraud. We email you about your order only, and we do not send marketing email.</p> },
    {
      id: "share",
      heading: "Who sees it",
      body: (
        <>
          <p>Only our staff, who sign in with two-step verification, and the services we need to deliver your order:</p>
          <ul>
            <li>the <strong>courier</strong> (name, phone, address and, for cash on delivery, the amount to collect);</li>
            <li><strong>Gmail</strong>, which sends our order and reply emails.</li>
          </ul>
          <p>We do not sell your information and we do not run advertising or tracking scripts on this website.</p>
        </>
      ),
    },
    {
      id: "storage",
      heading: "Cookies and storage on your device",
      body: (
        <ul>
          <li>Your <strong>cart</strong> is kept in your browser only (it holds screen codes and quantities, not prices or personal details).</li>
          <li>After you order, a <strong>private cookie</strong> lets this browser show your order details and PDF for 30 days.</li>
          <li>Staff sign-in uses a session cookie. We use no advertising cookies.</li>
        </ul>
      ),
    },
    { id: "payments", heading: "Payment details", body: <p>We never ask for or store card numbers, PINs or passwords. Bank and wallet payments are made by you directly to our account; we keep the transaction ID and slip with the order so we can confirm it.</p> },
    { id: "keep", heading: "How long we keep it", body: <p>Order records are kept as long as we need them for warranty, accounting and legal obligations. Messages from the contact form are kept while we need them to answer you and for our records. Our database sits on a protected shop server with encrypted backups.</p> },
    { id: "rights", heading: "Your choices", body: <p>You can ask us to show, correct or delete the personal information we hold about you, except where we must keep it (for example an order we still owe warranty on). <Link href="/contact">Contact us</Link>{f.salesEmail ? ` or write to ${f.salesEmail}` : ""}.</p> },
    { id: "changes", heading: "Changes", body: <p>If we change how we use your information we will update this page and its date.</p> },
  ];
  return <LegalPage title="Privacy policy" lead="What we collect, why, and who sees it — without the legal fog." updated={PRIVACY_UPDATED} sections={sections} />;
}
