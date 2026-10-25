import type { ShopFacts } from "@/server/storefront/shop-facts";

/** Questions on /faqs. Plain text so the page and the FAQPage structured data say exactly the same thing. */
export type Faq = { q: string; a: string; link?: { href: string; label: string } };
export type FaqGroup = { id: string; title: string; items: Faq[] };

export function faqGroups(f: ShopFacts, eta: string): FaqGroup[] {
  const advance = f.freeDeliveryWhenPrepaid ? " Orders paid in advance get free delivery." : "";
  return [
    {
      id: "ordering",
      title: "Ordering and payment",
      items: [
        {
          q: "How can I pay?",
          a: `Cash on delivery is available for orders up to ${f.codLimit}${f.codPaused ? " (it is paused at the moment, so please pay in advance)" : ""}. For larger orders, or if you prefer, choose “Place order & pay in advance” and pay by bank transfer, JazzCash, Easypaisa or NayaPay.${advance}`,
        },
        {
          q: "What happens after I choose “pay in advance”?",
          a: "You get an order number straight away. Pay into the account shown, write the order number in the transfer remarks, and send the payment slip and transaction ID with the order number by WhatsApp or email within 24 hours. We confirm the payment by email and dispatch. If we hear nothing within 24 hours the order is cancelled and the screens go back on sale.",
        },
        { q: "Do I need an account?", a: "No. You check out as a guest with your name, mobile number, email and delivery address. We email you the order details." },
        {
          q: "How do I track my order?",
          a: "Open Track order, enter your order number and the phone number you ordered with. Once your parcel is with the courier you will also see its tracking number there and in your email.",
          link: { href: "/order", label: "Track an order" },
        },
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      items: [
        { q: "How long does delivery take?", a: `Usually ${eta}, depending on your city. Orders are packed and handed to the courier after payment is confirmed (cash on delivery orders are confirmed with you first).` },
        { q: "Which cities do you deliver to?", a: "We deliver across Pakistan by courier. Checkout lists the cities we serve and shows the delivery charge for yours before you place the order." },
        { q: "Can I collect from the shop instead?", a: "Yes. Buy at our counter and you pay the shelf price, with no delivery charge. The website and the counter share the same stock, so call first if you want a particular screen kept ready." },
      ],
    },
    {
      id: "screens",
      title: "Choosing a screen",
      items: [
        { q: "How do I know a screen fits my phone?", a: "Match the exact model code (for example SM-A546E in Settings → About phone), not just the name. Each product page lists the model codes it fits. If you are not sure, send us the code before you order." },
        { q: "What is the difference between the grades?", a: "OEM Original is the factory part supplied as a service part. OLED A Grade is an aftermarket OLED panel. Compatible A Grade is our best LCD or incell replacement. Every unit is tested before it is packed." },
        { q: "Will the in-display fingerprint reader work?", a: "Only with OLED and AMOLED panels. An LCD replacement cannot read a fingerprint through the screen." },
      ],
    },
    {
      id: "warranty",
      title: "Warranty and returns",
      items: [
        { q: "What warranty do the screens have?", a: "The warranty period is shown on every product page and printed on counter receipts. It starts the day your order is delivered, or the day you buy at the counter. It covers faults such as a dead display, lines or touch problems; it does not cover physical damage or broken glass.", link: { href: "/return-policy", label: "Read the returns policy" } },
        { q: "Can I return a screen I no longer need?", a: "Yes, within 7 days of delivery (or of buying at the counter) if it is unused, undamaged and in its packaging. A fault covered by warranty is handled under the warranty instead." },
        { q: "How do I start a return?", a: `Contact us with your order number. ${f.phone ? "Call or WhatsApp us, or " : ""}use the contact form. Our staff open the return, tell you where to send or bring the screen, and inspect it when it arrives.`, link: { href: "/contact", label: "Contact us" } },
      ],
    },
    {
      id: "wholesale",
      title: "Repair shops",
      items: [
        { q: "Do you have wholesale prices?", a: "Yes. Approved repair technicians pay wholesale prices at our counter. Get in touch with your shop name and mobile number and we will register you.", link: { href: "/services", label: "Wholesale and enterprise" } },
      ],
    },
  ];
}
