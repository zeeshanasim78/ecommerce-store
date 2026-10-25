import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/store/content-ui";
import { getShopFacts } from "@/server/storefront/shop-facts";

export const metadata: Metadata = {
  title: "Returns and warranty policy",
  description: "How warranty claims, faulty or wrong screens, change-of-mind returns and refunds work at Caidea.",
  alternates: { canonical: "/return-policy" },
};
export const revalidate = 300;

// Mirrors the rules built in Milestone 11 (SPECIFICATION §28, CLARIFICATIONS Q75–Q88). Change both together.
const RETURN_POLICY_UPDATED = "25 October 2026";

export default function ReturnPolicyPage() {
  const f = getShopFacts();
  const sections: LegalSection[] = [
    {
      id: "warranty",
      heading: "Warranty",
      body: (
        <>
          <p>Every screen has a warranty period, shown on its product page and printed on counter receipts. It starts on the day your order is <strong>delivered</strong>, or the day you buy at the counter.</p>
          <p>The warranty covers faults in the screen itself: a display that stays dark, lines or patches, ghost touches or touch that does not respond. It does not cover physical damage.</p>
        </>
      ),
    },
    {
      id: "faulty",
      heading: "Faulty, wrong or damaged-in-transit screens",
      body: (
        <>
          <p>If a screen arrives dead, is not the model you ordered, or is damaged in transit, tell us as soon as you can. For these three reasons we also refund the delivery charge (and cash-on-delivery fee), once per order.</p>
          <p>For any other fault, the screen must still be inside its warranty period.</p>
        </>
      ),
    },
    {
      id: "change-of-mind",
      heading: "Changed your mind",
      body: (
        <p>You can return a screen within <strong>7 days</strong> of delivery (or of buying it at the counter) if it is unused, undamaged and in its original packaging. Delivery charges are not refunded for a change of mind. After 7 days we can only accept a return at our discretion.</p>
      ),
    },
    {
      id: "not-covered",
      heading: "What is not covered",
      body: (
        <ul>
          <li>Cracked or broken glass, bent frames, water or liquid damage, burn marks and other physical damage after delivery.</li>
          <li>Damage caused while the screen was being fitted, or by a repair carried out by someone else.</li>
          <li>Screens that have been opened, altered or have had their parts removed.</li>
          <li>A fault found only after the warranty period has ended.</li>
        </ul>
      ),
    },
    {
      id: "how",
      heading: "How to return a screen",
      body: (
        <ol>
          <li>
            <Link href="/contact">Contact us</Link>
            {f.phone ? ` or call ${f.phone}` : ""} with your order number (or counter receipt) and a short description of the problem.
          </li>
          <li>Our staff open the return and tell you where to send or bring the screen. Keep the packaging.</li>
          <li>We check the screen when it arrives. We may ask for a photo or video of the fault first.</li>
        </ol>
      ),
    },
    {
      id: "outcome",
      heading: "Inspection and what happens next",
      body: (
        <>
          <p>After inspection we either approve the return (a <strong>refund</strong>, a <strong>replacement</strong>, or <strong>store credit</strong>) or explain why we cannot, for example because the damage is physical or the warranty has ended.</p>
          <p>A good screen that comes back unused goes back on sale. A faulty screen never does; we send it back to our supplier. A replacement depends on stock: if we have none of that model, we offer a refund instead.</p>
        </>
      ),
    },
    {
      id: "refunds",
      heading: "Refunds",
      body: (
        <>
          <p>We refund the price you paid for the screen, after any discount or coupon. Where you paid by cash on delivery or at the counter we refund in cash at the shop, or to your bank or wallet account. For bank and wallet refunds we record the transaction ID and can send it to you on request.</p>
          <p>Store credit is a voucher noted against your order; it is not an account balance.</p>
        </>
      ),
    },
  ];
  return <LegalPage title="Returns and warranty policy" lead="What is covered, how long you have, and how a return works from start to refund." updated={RETURN_POLICY_UPDATED} sections={sections} />;
}
