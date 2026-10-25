import Link from "next/link";
import { AdminHeader, Notice, Status } from "@/components/admin/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { cn } from "@/lib/cn";
import { listAllServices } from "@/server/content/services";
import { requireStaff } from "@/server/dal";
import { moveServiceAction, toggleServiceAction } from "./actions";

export const metadata = { title: "Services page" };

export default async function ServicesAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; highlight?: string }> }) {
  await requireStaff("content");
  const { saved, error, highlight } = await searchParams;
  const items = listAllServices(db);
  return (
    <>
      <AdminHeader title="Services page" description="The cards on the Wholesale & Enterprise page (/services), in this order." actions={<ButtonLink href="/admin/services/new">Add service</ButtonLink>} />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {items.length === 0 ? (
        <p className="text-midnight/70">No services yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((s, i) => (
            <li key={s.id} className={cn("flex flex-wrap items-center gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8", highlight === s.id && "ring-2 ring-midnight")}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.title}</p>
                <p className="truncate text-sm text-midnight/65">{s.summary}</p>
              </div>
              <Status on={s.isActive} onLabel="Shown" offLabel="Hidden" />
              <div className="flex flex-wrap gap-2">
                <form action={moveServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" disabled={i === 0} className={buttonClasses("outline", "sm")} aria-label={`Move “${s.title}” up`}>Up</button>
                </form>
                <form action={moveServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button type="submit" disabled={i === items.length - 1} className={buttonClasses("outline", "sm")} aria-label={`Move “${s.title}” down`}>Down</button>
                </form>
                <form action={toggleServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="show" value={s.isActive ? "no" : "yes"} />
                  <button type="submit" className={buttonClasses("outline", "sm")}>{s.isActive ? "Hide" : "Show"}</button>
                </form>
                <Link href={`/admin/services/${s.id}`} className={buttonClasses("primary", "sm")}>Edit</Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
