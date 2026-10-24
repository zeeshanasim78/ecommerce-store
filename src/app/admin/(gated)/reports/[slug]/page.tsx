import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/ui";
import { ReportBody, ReportFilters } from "@/components/admin/report-view";
import { buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { requireStaff } from "@/server/dal";
import { parseRange, rangeQuery } from "@/server/reports/range";
import { parseOptions, reportBySlug } from "@/server/reports/registry";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const def = reportBySlug((await params).slug);
  return { title: def?.title ?? "Report" };
}

export default async function ReportPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  await requireStaff("reports");
  const { slug } = await params;
  const def = reportBySlug(slug);
  if (!def) notFound();
  const sp = await searchParams;
  const now = new Date();
  const range = parseRange(sp, now);
  const options = parseOptions(def, sp);
  const result = def.run(db, { range, options, now });

  const optionQuery = Object.entries(options).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join("");
  const exportQuery = `${def.usesRange ? rangeQuery(range) : ""}${optionQuery}`.replace(/^&/, "");

  return (
    <>
      <AdminHeader
        title={result.title}
        description={`${result.description} ${result.period}.`}
        actions={
          <>
            <a href={`/admin/reports/${def.slug}/export?${exportQuery}`} className={buttonClasses("outline")} download>
              Download CSV
            </a>
            <Link href="/admin/reports" className={buttonClasses("ghost")}>All reports</Link>
          </>
        }
      />
      <ReportFilters def={def} range={range} options={options} query={optionQuery} />
      <ReportBody result={result} />
    </>
  );
}
