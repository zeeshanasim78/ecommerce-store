import { eq } from "drizzle-orm";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { getBannerPromotion } from "@/server/storefront/catalog";

/** Shop phone from settings; the seed's placeholder number is never shown. */
function storePhone(): string | null {
  const value = db.select({ value: settings.value }).from(settings).where(eq(settings.key, "store_phone")).get()?.value;
  return typeof value === "string" && /^\+92\d{10}$/.test(value) && !/^\+920+$/.test(value) ? value : null;
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const banner = getBannerPromotion();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-midnight focus:px-5 focus:py-2.5 focus:text-canvas"
      >
        Skip to content
      </a>
      <SiteHeader bannerText={banner?.bannerText} phone={storePhone()} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
