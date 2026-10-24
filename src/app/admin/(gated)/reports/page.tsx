import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/server/dal";
import { REPORTS } from "@/server/reports/registry";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireStaff("reports");
  return (
    <>
      <AdminHeader title="Reports" description="Sales, margin, stock position, cash owed by couriers and more. Every report has a Download CSV button." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.slug} href={`/admin/reports/${r.slug}`} className="group">
            <Card className="h-full p-6 transition-shadow group-hover:shadow-[0_14px_30px_-20px_rgb(11_28_51/0.4)]">
              <h2 className="text-lg font-bold">{r.title}</h2>
              <p className="mt-2 text-midnight/70">{r.blurb}</p>
              <p className="mt-4 text-sm font-semibold text-midnight/60">{r.usesRange ? "Choose a period" : "Shows the position now"}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
