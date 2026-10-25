import { eq } from "drizzle-orm";
import { JsonLd } from "@/components/store/json-ld";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { organizationLd } from "@/server/content/seo";
import { siteUrl } from "@/server/site-url";
import { getBannerPromotion } from "@/server/storefront/catalog";
import { getShopFacts } from "@/server/storefront/shop-facts";

/** Shop phone from settings; the seed's placeholder number is never shown. */
function storePhone(): string | null {
  const value = db.select({ value: settings.value }).from(settings).where(eq(settings.key, "store_phone")).get()?.value;
  return typeof value === "string" && /^\+92\d{10}$/.test(value) && !/^\+920+$/.test(value) ? value : null;
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const banner = getBannerPromotion();
  const facts = getShopFacts();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-midnight focus:px-5 focus:py-2.5 focus:text-canvas"
      >
        Skip to content
      </a>
      <JsonLd data={organizationLd(siteUrl(), { name: facts.name, phone: facts.phone, whatsapp: facts.whatsapp, salesEmail: facts.salesEmail })} />
      <SiteHeader bannerText={banner?.bannerText} phone={storePhone()} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
