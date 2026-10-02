import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/card";
import { getCategorySummaries } from "@/server/storefront/catalog";

export const metadata: Metadata = { title: "Categories" };
export const revalidate = 300;

export default function CategoriesPage() {
  const categories = getCategorySummaries();
  return (
    <Container className="py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Categories</h1>
      <p className="mt-3 max-w-2xl text-lg text-midnight/75">Browse screens by display type and part.</p>
      {categories.length === 0 ? (
        <p className="mt-10 text-midnight/70">
          Categories are on their way.{" "}
          <Link href="/store" className="font-semibold underline underline-offset-4">
            Browse every screen
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/store?category=${c.slug}`}
                className="group flex h-full flex-col rounded-bezel bg-white p-7 ring-1 ring-midnight/8 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(11_28_51/0.45)]"
              >
                <span className="font-display text-xl font-bold">{c.name}</span>
                {c.description ? <span className="mt-2 text-midnight/70">{c.description}</span> : null}
                <span className="mt-6 text-sm font-semibold">
                  {c.count} screen{c.count === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
