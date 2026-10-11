import Link from "next/link";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { PrintButton } from "@/components/admin/print-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { COUNTER_METHODS, COUNTER_METHOD_LABEL } from "@/lib/counter";
import { TECHNICIAN_APPROVER_ROLES } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { CounterSaleError, counterDaySummary, karachiDate, recentCounterSales } from "@/server/counter/pos";
import { requireStaff } from "@/server/dal";

export const metadata = { title: "End of day" };
export const dynamic = "force-dynamic";

/**
 * End-of-day counter summary per cashier (spec §7 Counter Sale, BUILD_GUIDE M9).
 * Cashiers see only their own sales; managers and the owner see every cashier.
 * "Cash in drawer" = total of cash sales (change has already been handed back).
 */
export default async function CounterSummaryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const staff = await requireStaff("counter");
  const seesAll = TECHNICIAN_APPROVER_ROLES.includes(staff.role);
  const today = karachiDate(new Date());
  const sp = await searchParams;
  let date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  if (date > today) date = today;

  let summary;
  try {
    summary = counterDaySummary(db, { date, cashierId: seesAll ? undefined : staff.id });
  } catch (e) {
    if (!(e instanceof CounterSaleError)) throw e;
    date = today;
    summary = counterDaySummary(db, { date, cashierId: seesAll ? undefined : staff.id });
  }
  const sales = recentCounterSales(db, { date, cashierId: seesAll ? undefined : staff.id, limit: 500 });
  const a = summary.all;
  const longDate = new Intl.DateTimeFormat("en-PK", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(Date.parse(`${date}T00:00:00Z`));

  return (
    <>
      <AdminHeader
        title="End of day"
        description={`${longDate} · ${seesAll ? "all cashiers" : `your sales, ${staff.name}`}. Count the cash drawer against “Cash in drawer”.`}
        actions={
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <form className="flex items-center gap-2">
              <label htmlFor="date" className="sr-only">
                Date
              </label>
              <Input id="date" type="date" name="date" defaultValue={date} max={today} className="h-9 w-44" />
              <Button type="submit" size="sm" variant="outline">
                Show
              </Button>
            </form>
            <PrintButton label="Print" />
            <ButtonLink href="/admin/counter-sale" size="sm" variant="outline">
              Back to the till
            </ButtonLink>
          </div>
        }
      />

      {a.sales === 0 ? (
        <Notice tone="error">No counter sales on this day.</Notice>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Sales" value={String(a.sales)} sub={`${a.items} item${a.items === 1 ? "" : "s"}`} />
            <Stat label="Total taken" value={formatMoney(a.totalPaisa)} />
            <Stat label="Cash in drawer" value={formatMoney(a.cashPaisa)} sub="cash sales after change, plus your opening float" dark />
            <Stat label="Discounts given" value={formatMoney(a.discountPaisa)} sub={`${a.discounts} sale${a.discounts === 1 ? "" : "s"}`} />
          </dl>

          <h2 className="mt-10 text-lg font-bold">By cashier</h2>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Cashier</TH>
                  <TH>First – last sale</TH>
                  <TH className="text-right">Sales</TH>
                  <TH className="text-right">Items</TH>
                  {COUNTER_METHODS.filter((m) => a.byMethod[m]).map((m) => (
                    <TH key={m} className="text-right">
                      {COUNTER_METHOD_LABEL[m]}
                    </TH>
                  ))}
                  <TH className="text-right">Wholesale</TH>
                  <TH className="text-right">Discounts</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <tbody>
                {summary.cashiers.map((c) => (
                  <TR key={c.cashierId}>
                    <TD className="font-semibold">{c.cashierName}</TD>
                    <TD className="whitespace-nowrap">
                      {formatKarachi(c.firstSaleAt).split(", ").pop()} – {formatKarachi(c.lastSaleAt).split(", ").pop()}
                    </TD>
                    <TD className="text-right">{c.sales}</TD>
                    <TD className="text-right">{c.items}</TD>
                    {COUNTER_METHODS.filter((m) => a.byMethod[m]).map((m) => (
                      <TD key={m} className="text-right whitespace-nowrap">
                        {c.byMethod[m] ? formatMoney(c.byMethod[m]!.totalPaisa) : "—"}
                      </TD>
                    ))}
                    <TD className="text-right whitespace-nowrap">{c.wholesaleSales ? `${formatMoney(c.wholesalePaisa)} (${c.wholesaleSales})` : "—"}</TD>
                    <TD className="text-right whitespace-nowrap">{c.discounts ? formatMoney(c.discountPaisa) : "—"}</TD>
                    <TD className="text-right font-semibold whitespace-nowrap">{formatMoney(c.totalPaisa)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>

          <h2 className="mt-10 text-lg font-bold">Sales</h2>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Receipt</TH>
                  <TH>Time</TH>
                  {seesAll && <TH>Cashier</TH>}
                  <TH>Paid by</TH>
                  <TH className="text-right">Items</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <tbody>
                {sales.map((s) => (
                  <TR key={s.orderId}>
                    <TD>
                      <Link href={`/admin/counter-sale/receipt/${s.code}`} className="font-semibold underline-offset-4 hover:underline">
                        {s.code}
                      </Link>
                      {s.tier === "WHOLESALE" && <span className="ml-2 text-xs text-midnight/60">wholesale</span>}
                    </TD>
                    <TD className="whitespace-nowrap">{formatKarachi(s.placedAt).split(", ").pop()}</TD>
                    {seesAll && <TD>{s.cashier}</TD>}
                    <TD>{COUNTER_METHOD_LABEL[s.method]}</TD>
                    <TD className="text-right">{s.items}</TD>
                    <TD className="text-right font-semibold whitespace-nowrap">{formatMoney(s.totalPaisa)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}

function Stat({ label, value, sub, dark }: { label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <div className={dark ? "rounded-bezel bg-midnight p-5 text-canvas" : "rounded-bezel bg-white p-5 ring-1 ring-midnight/8"}>
      <dt className={dark ? "text-sm text-canvas/75" : "text-sm text-midnight/65"}>{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold">{value}</dd>
      {sub && <dd className={dark ? "text-sm text-canvas/65" : "text-sm text-midnight/55"}>{sub}</dd>}
    </div>
  );
}
