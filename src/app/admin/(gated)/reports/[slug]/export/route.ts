import { db } from "@/db/client";
import { requireStaff } from "@/server/dal";
import { parseRange } from "@/server/reports/range";
import { parseOptions, reportBySlug, reportCsv, reportFileName } from "@/server/reports/registry";

/** CSV download of a report with the page's period and options (spec §7, BUILD_GUIDE M12). Read-only GET. */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  await requireStaff("reports");
  const def = reportBySlug((await ctx.params).slug);
  if (!def) return new Response("Not found", { status: 404 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const now = new Date();
  const range = parseRange(sp, now);
  const result = def.run(db, { range, options: parseOptions(def, sp), now });
  return new Response(reportCsv(result), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportFileName(def.slug, def.usesRange ? range : null, now)}"`,
      "Cache-Control": "no-store",
    },
  });
}
