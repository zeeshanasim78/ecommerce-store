import Link from "next/link";
import { AdminHeader, Notice, Status } from "@/components/admin/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { cn } from "@/lib/cn";
import { listAdminTestimonials } from "@/server/content/testimonials";
import { requireStaff } from "@/server/dal";
import { archiveTestimonialAction, moveTestimonialAction, toggleTestimonialAction } from "./actions";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; highlight?: string; show?: string }> }) {
  await requireStaff("content");
  const { saved, error, highlight, show } = await searchParams;
  const archived = show === "archived";
  const items = listAdminTestimonials(db, archived);
  const live = items.filter((t) => t.isPublished).length;

  return (
    <>
      <AdminHeader
        title="Testimonials"
        description={archived ? "Archived testimonials. Restore one to edit it again." : `Customer quotes shown on the home, About and Wholesale pages, in this order. ${live} shown.`}
        actions={<ButtonLink href="/admin/testimonials/new">Add testimonial</ButtonLink>}
      />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <nav aria-label="Filter" className="mb-6 flex gap-2">
        <Link href="/admin/testimonials" className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold", !archived ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10")}>Current</Link>
        <Link href="/admin/testimonials?show=archived" className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold", archived ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10")}>Archived</Link>
      </nav>
      {items.length === 0 ? (
        <p className="text-midnight/70">{archived ? "Nothing archived." : "No testimonials yet."}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((t, i) => (
            <li key={t.id} className={cn("flex flex-wrap items-center gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8", highlight === t.id && "ring-2 ring-midnight")}>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium">“{t.quote}”</p>
                <p className="mt-1 truncate text-sm text-midnight/65">
                  {t.authorName}
                  {t.authorRole || t.city ? ` — ${[t.authorRole, t.city].filter(Boolean).join(", ")}` : ""}
                  {t.rating ? ` · ${t.rating}★` : ""}
                </p>
              </div>
              <Status on={t.isPublished} onLabel="Shown" offLabel="Hidden" />
              <div className="flex flex-wrap gap-2">
                {archived ? (
                  <form action={archiveTestimonialAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="archive" value="no" />
                    <button type="submit" className={buttonClasses("outline", "sm")}>Restore</button>
                  </form>
                ) : (
                  <>
                    <form action={moveTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" disabled={i === 0} className={buttonClasses("outline", "sm")} aria-label={`Move ${t.authorName}’s testimonial up`}>Up</button>
                    </form>
                    <form action={moveTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" disabled={i === items.length - 1} className={buttonClasses("outline", "sm")} aria-label={`Move ${t.authorName}’s testimonial down`}>Down</button>
                    </form>
                    <form action={toggleTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="publish" value={t.isPublished ? "no" : "yes"} />
                      <button type="submit" className={buttonClasses("outline", "sm")}>{t.isPublished ? "Hide" : "Show"}</button>
                    </form>
                    <Link href={`/admin/testimonials/${t.id}`} className={buttonClasses("primary", "sm")}>Edit</Link>
                    <form action={archiveTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className={cn(buttonClasses("ghost", "sm"), "text-terracotta")}>Archive</button>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
