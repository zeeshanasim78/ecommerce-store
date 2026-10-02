import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { AdminHeader, ConfirmDelete, Notice, Status } from "@/components/admin/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { heroSlides, products } from "@/db/schema";
import { MAX_HERO_SLIDES } from "@/db/schema/catalog";
import { cn } from "@/lib/cn";
import { requireStaff } from "@/server/dal";
import { deleteSlide, moveSlide, toggleSlide } from "./actions";

export const metadata = { title: "Hero carousel" };

export default async function HeroAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; highlight?: string }> }) {
  await requireStaff("hero");
  const { saved, error, highlight } = await searchParams;
  const slides = db
    .select({ slide: heroSlides, product: { brand: products.brand, model: products.model } })
    .from(heroSlides)
    .leftJoin(products, eq(products.id, heroSlides.productId))
    .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt))
    .all();
  const live = slides.filter((s) => s.slide.isActive).length;

  return (
    <>
      <AdminHeader
        title="Hero carousel"
        description={`Slides rotate every 4 seconds at the top of the home page, in this order. ${live} of ${MAX_HERO_SLIDES} live.`}
        actions={<ButtonLink href="/admin/hero/new">New slide</ButtonLink>}
      />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {slides.length === 0 ? (
        <p className="text-midnight/70">No slides yet. Add one to replace the default hero.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {slides.map(({ slide, product }, i) => (
            <li
              key={slide.id}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8",
                highlight === slide.id && "ring-2 ring-midnight",
              )}
            >
              <span className="tabular grid size-9 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{slide.heading}</p>
                <p className="truncate text-sm text-midnight/65">
                  {slide.visualType === "IMAGE" ? "Image" : "3D screen"}
                  {product ? ` of ${product.brand} ${product.model}` : ""} — button “{slide.ctaLabel}” to {slide.ctaHref}
                </p>
              </div>
              <Status on={slide.isActive} onLabel="Live" />
              <div className="flex flex-wrap gap-2">
                <form action={moveSlide}>
                  <input type="hidden" name="id" value={slide.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" disabled={i === 0} className={buttonClasses("outline", "sm")} aria-label={`Move “${slide.heading}” up`}>
                    Up
                  </button>
                </form>
                <form action={moveSlide}>
                  <input type="hidden" name="id" value={slide.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button type="submit" disabled={i === slides.length - 1} className={buttonClasses("outline", "sm")} aria-label={`Move “${slide.heading}” down`}>
                    Down
                  </button>
                </form>
                <form action={toggleSlide}>
                  <input type="hidden" name="id" value={slide.id} />
                  <button type="submit" className={buttonClasses("outline", "sm")}>
                    {slide.isActive ? "Hide" : "Make live"}
                  </button>
                </form>
                <Link href={`/admin/hero/${slide.id}`} className={buttonClasses("primary", "sm")}>
                  Edit
                </Link>
                <ConfirmDelete action={deleteSlide} id={slide.id} what="this slide" />
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
