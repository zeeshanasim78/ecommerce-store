import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CatalogTable } from "@/components/store/catalog-table";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { getBrandSummaries, getCategorySummaries, getFilterOptions, listCatalog } from "@/server/storefront/catalog";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Replacement OLED, AMOLED and LCD screens for Samsung, Apple, Xiaomi, Oppo, Vivo, Infinix and Tecno, in Pakistani rupees.",
};

type Search = { brand?: string; category?: string; q?: string; view?: string; display?: string; grade?: string; color?: string; stock?: string; page?: string };

const PAGE_SIZE = 24;

/** Keeps the other filters when one changes. */
function hrefWith(current: Search, patch: Partial<Search>) {
  // Changing any filter goes back to page 1 unless the page itself is being changed
  const next = { ...current, page: undefined, ...patch };
  const params = new URLSearchParams(Object.entries(next).filter((e): e is [string, string] => Boolean(e[1])));
  const qs = params.toString();
  return qs ? `/store?${qs}` : "/store";
}

export default async function StorePage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  // A submitted filter form also sends its empty fields (?q=&grade=…); tidy the address so it's short to share
  if (Object.values(raw).some((v) => v === "")) {
    const clean = new URLSearchParams(Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""));
    redirect(clean.size ? `/store?${clean}` : "/store");
  }
  const sp: Search = {
    brand: raw.brand?.slice(0, 60),
    category: raw.category?.slice(0, 60),
    q: raw.q?.trim().slice(0, 60) || undefined,
    view: raw.view === "table" ? "table" : undefined,
    display: raw.display?.slice(0, 60) || undefined,
    grade: raw.grade?.slice(0, 60) || undefined,
    color: raw.color?.slice(0, 40) || undefined,
    stock: raw.stock === "1" ? "1" : undefined,
  };
  const brands = getBrandSummaries();
  const categories = getCategorySummaries();
  const options = getFilterOptions();
  const all = listCatalog({ brand: sp.brand, category: sp.category, q: sp.q, displayType: sp.display, grade: sp.grade, color: sp.color, inStock: sp.stock === "1" });
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1));
  const products = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = Boolean(sp.q || sp.category || sp.display || sp.grade || sp.color || sp.stock);
  const activeBrand = brands.find((b) => b.slug === sp.brand);
  const activeCategory = categories.find((c) => c.slug === sp.category);

  return (
    <Container className="py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">
        {activeCategory?.name ?? (activeBrand ? `${activeBrand.name} screens` : "Catalogue")}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-midnight/75">
        {activeCategory?.description ?? "Every screen is graded and tested before it’s packed. Prices in Pakistani rupees."}
      </p>

      <div className="mt-10 flex flex-col gap-5">
        <nav aria-label="Brands" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex w-max gap-2">
            {[{ name: "All brands", slug: undefined as string | undefined }, ...brands.map((b) => ({ name: b.name, slug: b.slug as string | undefined }))].map((b) => (
              <li key={b.name}>
                <Link
                  href={hrefWith(sp, { brand: b.slug })}
                  aria-current={sp.brand === b.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-5 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors",
                    sp.brand === b.slug ? "bg-midnight text-canvas" : "bg-white ring-1 ring-midnight/12 hover:ring-midnight/35",
                  )}
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form className="grid gap-3 rounded-bezel bg-white p-4 ring-1 ring-midnight/8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]" role="search" action="/store">
          {sp.brand ? <input type="hidden" name="brand" value={sp.brand} /> : null}
          {sp.view ? <input type="hidden" name="view" value={sp.view} /> : null}
          <Input name="q" defaultValue={sp.q} placeholder="Model or code, e.g. A54 or SM-A546E" aria-label="Search screens" className="sm:col-span-2 lg:col-span-1" />
          <Select name="category" defaultValue={sp.category ?? ""} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="display" defaultValue={sp.display ?? ""} aria-label="Display type">
            <option value="">Any display</option>
            {options.displayTypes.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
          <Select name="grade" defaultValue={sp.grade ?? ""} aria-label="Quality grade">
            <option value="">Any grade</option>
            {options.grades.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
          <Select name="color" defaultValue={sp.color ?? ""} aria-label="Colour">
            <option value="">Any colour</option>
            {options.colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-5">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-[0.9375rem] font-medium">
              <input type="checkbox" name="stock" value="1" defaultChecked={sp.stock === "1"} className="size-5 accent-midnight" />
              In stock only
            </label>
            <div className="flex items-center gap-2">
              {filtered ? (
                <Link href={hrefWith({ brand: sp.brand, view: sp.view }, {})} className="px-3 text-sm font-semibold underline underline-offset-4">
                  Clear filters
                </Link>
              ) : null}
              <Button type="submit">Show screens</Button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-midnight/8 pt-5">
          <p className="text-[0.9375rem] text-midnight/70" aria-live="polite">
            {all.length} screen{all.length === 1 ? "" : "s"}
            {sp.q ? ` matching “${sp.q}”` : ""}
            {pages > 1 ? ` · page ${page} of ${pages}` : ""}
          </p>
          <div className="flex rounded-full bg-surface p-1" role="group" aria-label="View">
            {[
              { label: "Cards", view: undefined },
              { label: "Spec table", view: "table" },
            ].map((o) => (
              <Link
                key={o.label}
                href={hrefWith(sp, { view: o.view })}
                aria-current={sp.view === o.view ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors",
                  sp.view === o.view ? "bg-midnight text-canvas" : "text-midnight/70 hover:text-midnight",
                )}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-bezel bg-white p-10 text-center ring-1 ring-midnight/8">
            <p className="text-lg font-semibold">No screens match those filters.</p>
            <p className="mt-2 text-midnight/70">Try another brand, or search by the model code printed inside the phone’s SIM tray.</p>
            <Link href="/store" className="mt-5 inline-block font-semibold underline underline-offset-4">
              Clear filters
            </Link>
          </div>
        ) : sp.view === "table" ? (
          <CatalogTable products={products} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={page === 1 && i < 2} />
            ))}
          </div>
        )}
      </div>

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={hrefWith(sp, { page: String(page - 1) })} rel="prev" className="inline-flex h-10 items-center rounded-full bg-white px-5 font-semibold ring-1 ring-midnight/12 hover:ring-midnight/35">
              Previous
            </Link>
          ) : null}
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={hrefWith(sp, { page: n === 1 ? undefined : String(n) })}
              aria-current={n === page ? "page" : undefined}
              className={cn("inline-flex size-10 items-center justify-center rounded-full font-semibold tabular", n === page ? "bg-midnight text-canvas" : "bg-white ring-1 ring-midnight/12 hover:ring-midnight/35")}
            >
              {n}
            </Link>
          ))}
          {page < pages ? (
            <Link href={hrefWith(sp, { page: String(page + 1) })} rel="next" className="inline-flex h-10 items-center rounded-full bg-white px-5 font-semibold ring-1 ring-midnight/12 hover:ring-midnight/35">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Container>
  );
}
