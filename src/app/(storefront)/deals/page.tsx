import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Container } from "@/components/ui/card";
import { formatKarachi } from "@/lib/time";
import { getActivePromotions, listCatalog } from "@/server/storefront/catalog";

export const metadata: Metadata = { title: "Deals" };
export const revalidate = 300;

export default function DealsPage() {
  const promos = getActivePromotions().filter((p) => p.bannerText);
  const discounted = listCatalog({ discountedOnly: true }).sort((a, b) => b.price.percentOff - a.price.percentOff);

  return (
    <Container className="py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Deals</h1>
      <p className="mt-3 max-w-2xl text-lg text-midnight/75">Screens on sale right now. Prices already include the discount.</p>

      {promos.length ? (
        <ul className="mt-8 flex flex-col gap-3">
          {promos.map((p) => (
            <li key={p.id} className="ambient-dark rounded-bezel bg-midnight p-6 text-canvas">
              <p className="font-display text-xl font-bold">{p.bannerText}</p>
              <p className="mt-1 text-sm text-canvas/65">Ends {formatKarachi(p.endsAt)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {discounted.length === 0 ? (
        <div className="mt-10 rounded-bezel bg-white p-10 text-center ring-1 ring-midnight/8">
          <p className="text-lg font-semibold">No deals running right now.</p>
          <p className="mt-2 text-midnight/70">New offers usually start around Eid and the start of each month.</p>
          <Link href="/store" className="mt-5 inline-block font-semibold underline underline-offset-4">
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {discounted.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      )}
    </Container>
  );
}
