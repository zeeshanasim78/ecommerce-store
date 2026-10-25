import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/store/content-ui";
import { etaText, getShopFacts } from "@/server/storefront/shop-facts";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "The terms that apply when you order phone screens from Caidea: prices, payment, delivery, warranty and returns.",
  alternates: { canonical: "/terms" },
};
export const revalidate = 300;
const TERMS_UPDATED = "25 October 2026";

export default function TermsPage() {
  const f = getShopFacts();
  const sections: LegalSection[] = [
    { id: "about", heading: "About these terms", body: <p>These terms apply to every order you place on this website and every purchase at our counter. By placing an order you agree to them. Please read them together with our <Link href="/return-policy">returns and warranty policy</Link> and <Link href="/privacy">privacy policy</Link>.</p> },
    {
      id: "prices",
      heading: "Prices and orders",
      body: (
        <>
          <p>All prices are in Pakistani rupees (PKR). The price you see when you place the order is the price you pay, plus any delivery charge shown at checkout. Prices and promotions can change at any time, but never for an order already placed.</p>
          <p>If we find a price or stock mistake we will tell you and either correct the order or cancel it with a full refund.</p>
        </>
      ),
    },
    { id: "stock", heading: "Stock", body: <p>The website and our counter share one stock. When you place an order the screens are set aside for you. If an order is not paid in time, or is cancelled, they go back on sale.</p> },
    {
      id: "payment",
      heading: "Payment",
      body: (
        <>
          <p>You can pay by cash on delivery for orders up to {f.codLimit}{f.codPaused ? " (currently paused)" : ""}, or in advance by bank transfer, JazzCash, Easypaisa or NayaPay.{f.freeDeliveryWhenPrepaid ? " Orders paid in advance get free delivery." : ""}</p>
          <p>For an advance payment, send the payment slip and transaction ID with your order number within <strong>24 hours</strong>. We confirm the payment before dispatch. An order we have not heard about within 24 hours is cancelled. We never ask for your card number, PIN or one-time passwords.</p>
        </>
      ),
    },
    { id: "delivery", heading: "Delivery", body: <p>We deliver across Pakistan by courier, usually {etaText(f)}. Times are estimates, not promises, and can be affected by the courier, weather or public holidays. Please check the parcel when it arrives and tell us at once if it is damaged. For cash on delivery, please be available to receive the parcel and pay the courier.</p> },
    { id: "returns", heading: "Warranty and returns", body: <p>Faulty screens are covered by the warranty shown on the product page; other returns follow our <Link href="/return-policy">returns policy</Link>. Physical damage, including damage during fitting, is not covered.</p> },
    { id: "choosing", heading: "Choosing the right screen", body: <p>Please check that the model code of your phone matches the screen before you order. Product pages list the models each screen fits, and we are happy to help you check. If we sent a different model from the one you ordered, we will replace it or refund you.</p> },
    { id: "coupons", heading: "Coupons and promotions", body: <p>A coupon code works as described when it is issued, within its dates and limits, and cannot be exchanged for cash. If an order is cancelled, a coupon that was used on it may become usable again.</p> },
    { id: "liability", heading: "Our responsibility", body: <p>We are responsible for supplying screens that match their description and work when delivered. To the extent the law allows, we are not liable for indirect losses, such as lost business while a phone is being repaired, and our liability for any order is limited to the price paid for it. Nothing in these terms limits rights you have under the law.</p> },
    { id: "law", heading: "Contact and governing law", body: <p>These terms are governed by the laws of Pakistan. Questions about an order? <Link href="/contact">Contact us</Link>{f.phone ? ` or call ${f.phone}` : ""}. We may update these terms from time to time; the date at the top shows the latest version, and orders are covered by the version in force when they were placed.</p> },
  ];
  return <LegalPage title="Terms of sale" lead="The rules for ordering from Caidea, in plain words." updated={TERMS_UPDATED} sections={sections} />;
}
