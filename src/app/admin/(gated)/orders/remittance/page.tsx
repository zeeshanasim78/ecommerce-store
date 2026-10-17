import Link from "next/link";
import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { codOutstanding, listRemittances } from "@/server/orders/cod-remittance";
import { COURIER_LABEL } from "@/server/orders/order-details";
import { uploadRemittanceAction } from "./actions";

export const metadata = { title: "COD remittance" };
export const dynamic = "force-dynamic";

const rs = (n: number) => formatMoney(paisa(n));
const STATUS: Record<string, string> = { DRAFT: "Not confirmed yet", CONFIRMED: "Confirmed", DISCARDED: "Discarded" };

/** COD the couriers owe the shop, and their payment reports (M10 Phase B, spec §9, Q71). */
export default async function RemittancePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const out = codOutstanding(db);
  const reports = listRemittances(db);

  return (
    <>
      <AdminHeader
        title="COD remittance"
        description="Cash the couriers collected on delivery and still owe the shop. When a courier pays, upload its payment report: each row is matched to the parcel by its CN."
        actions={
          <ButtonLink href="/admin/orders?f=delivered" variant="outline">
            Delivered orders
          </ButtonLink>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-bezel bg-midnight px-6 py-5 text-canvas">
          <p className="text-sm font-medium text-canvas/75">Couriers owe the shop</p>
          <p className="tabular mt-1 font-display text-3xl font-bold">{rs(out.totalOwedPaisa)}</p>
          <p className="text-sm text-canvas/75">
            {out.delivered.length} delivered COD parcel{out.delivered.length === 1 ? "" : "s"}
          </p>
        </div>
        {out.owed.map((o) => (
          <div key={o.courier} className="rounded-bezel bg-white px-6 py-5 ring-1 ring-midnight/8">
            <p className="text-sm font-medium text-midnight/65">{COURIER_LABEL[o.courier] ?? o.courier} owes</p>
            <p className="tabular mt-1 font-display text-2xl font-bold">{rs(o.cod)}</p>
            <p className="text-sm text-midnight/65">
              {o.n} parcel{o.n === 1 ? "" : "s"}
            </p>
          </div>
        ))}
        {out.withCourier.map((w) => (
          <div key={`w-${w.courier}`} className="rounded-bezel bg-surface px-6 py-5">
            <p className="text-sm font-medium text-midnight/65">Still out with {COURIER_LABEL[w.courier] ?? w.courier}</p>
            <p className="tabular mt-1 font-display text-2xl font-bold">{rs(w.cod)}</p>
            <p className="text-sm text-midnight/65">
              {w.n} COD parcel{w.n === 1 ? "" : "s"} not delivered yet
            </p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Section title="Delivered, waiting for the courier’s payment">
            {out.delivered.length === 0 ? (
              <p className="text-midnight/70">Nothing owed.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Order</TH>
                    <TH>Courier · CN</TH>
                    <TH>Delivered</TH>
                    <TH className="text-right">COD</TH>
                  </tr>
                </THead>
                <tbody>
                  {out.delivered.map((d) => (
                    <TR key={d.orderId}>
                      <TD>
                        <Link href={`/admin/orders/${d.orderId}`} className="font-semibold tabular underline-offset-4 hover:underline">
                          {d.code}
                        </Link>
                      </TD>
                      <TD className="tabular">
                        {COURIER_LABEL[d.courier] ?? d.courier} {d.cn ?? "—"}
                      </TD>
                      <TD>{formatKarachi(d.deliveredAt)}</TD>
                      <TD className="tabular text-right font-semibold">{rs(d.cod)}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </Section>

          <Section title="Payment reports">
            {reports.length === 0 ? (
              <p className="text-midnight/70">None uploaded yet.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Report</TH>
                    <TH>Courier</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Applied</TH>
                  </tr>
                </THead>
                <tbody>
                  {reports.map((r) => (
                    <TR key={r.id}>
                      <TD>
                        <Link href={`/admin/orders/remittance/${r.id}`} className="font-semibold tabular underline-offset-4 hover:underline">
                          {r.code}
                        </Link>
                        <span className="block text-sm text-midnight/60">
                          {r.fileName} · {formatKarachi(r.createdAt)}
                        </span>
                      </TD>
                      <TD>{COURIER_LABEL[r.courier] ?? r.courier}</TD>
                      <TD className={r.status === "DRAFT" ? "font-semibold text-terracotta" : undefined}>{STATUS[r.status]}</TD>
                      <TD className="tabular text-right">{r.status === "CONFIRMED" ? `${r.appliedCount} · ${rs(r.appliedPaisa)}` : `${r.rows} rows`}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </Section>
        </div>

        <Section title="Upload a payment report" description="The CSV the courier sends with its payment (save Excel files as CSV first). Nothing changes until you check the rows and confirm.">
          <form action={uploadRemittanceAction} className="flex flex-col gap-4">
            <Field id="courier" label="Courier">
              <Select id="courier" name="courier" defaultValue="LEOPARDS" required>
                <option value="LEOPARDS">Leopards Courier</option>
                <option value="POSTEX">PostEx</option>
                <option value="TCS">TCS</option>
                <option value="TRAX">Trax</option>
              </Select>
            </Field>
            <Field id="reference" label="Courier’s payment reference (optional)" hint="e.g. the CPR / invoice number or bank transfer ID">
              <Input id="reference" name="reference" maxLength={60} autoComplete="off" />
            </Field>
            <Field id="file" label="Report (CSV)">
              <Input id="file" name="file" type="file" accept=".csv,text/csv" required className="h-auto py-2" />
            </Field>
            <details className="text-[0.9375rem]">
              <summary className="cursor-pointer font-semibold">Column names (only if the upload can’t find them)</summary>
              <p className="mt-2 text-sm text-midnight/70">Usually found by themselves (“CN”, “Tracking Number”, “COD Amount”, “Invoice Payment”…). Type the exact column headings if not. Use the COD amount column, not the net amount after charges.</p>
              <div className="mt-3 grid gap-3">
                <Field id="cnColumn" label="CN column">
                  <Input id="cnColumn" name="cnColumn" maxLength={60} />
                </Field>
                <Field id="amountColumn" label="COD amount column">
                  <Input id="amountColumn" name="amountColumn" maxLength={60} />
                </Field>
              </div>
            </details>
            <div>
              <Button type="submit">Upload and check</Button>
            </div>
          </form>
        </Section>
      </div>
    </>
  );
}
