import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Barcode } from "@/components/admin/barcode";
import { PrintButton } from "@/components/admin/print-button";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { readCourierConfig } from "@/server/couriers";
import { requireStaff } from "@/server/dal";
import { loadSheetDetails } from "@/server/orders/fulfilment";
import { COURIER_LABEL } from "@/server/orders/order-details";
import { getCheckoutSettings } from "@/server/settings/store-settings";

export const metadata = { title: "Load sheet" };
export const dynamic = "force-dynamic";

const rs = (n: number) => formatMoney(paisa(n));

/** Printable load sheet (A4): the parcels one courier's rider takes, signed by both sides (Q73). */
export default async function LoadSheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("orders");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = loadSheetDetails(db, id);
  if (!d) notFound();
  const by = db.select({ name: user.name }).from(user).where(eq(user.id, d.sheet.createdBy)).get()?.name ?? "";
  const s = getCheckoutSettings(db);
  const courierPdf = d.sheet.courier === "POSTEX" && readCourierConfig("POSTEX").configured;
  const pieces = d.parcels.reduce((n, p) => n + p.pieces, 0);

  return (
    <>
      <style>{`@page { size: A4; margin: 12mm; } @media print { html, body { background: #FFFFFF !important; } }`}</style>
      <div className="mb-6 flex flex-wrap gap-3 print:hidden">
        <PrintButton label="Print load sheet" />
        {courierPdf ? (
          <a href={`/admin/orders/load-sheets/${id}/courier`} className={buttonClasses("outline", "sm")}>
            PostEx load sheet (PDF)
          </a>
        ) : null}
        <ButtonLink href="/admin/orders/load-sheets" variant="outline" size="sm">
          All load sheets
        </ButtonLink>
      </div>

      <article className="max-w-[190mm] bg-white p-8 text-[0.9375rem] text-midnight ring-1 ring-midnight/10 print:p-0 print:ring-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-midnight pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Load sheet {d.sheet.code}</h1>
            <p>
              {s.storeName} → {COURIER_LABEL[d.sheet.courier] ?? d.sheet.courier} · {formatKarachi(d.sheet.createdAt)} · made by {by}
            </p>
          </div>
          <Barcode value={d.sheet.code} height={40} className="h-12 w-48" />
        </header>

        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-midnight/40 text-sm">
              <th className="py-2 pr-2 font-semibold">#</th>
              <th className="py-2 pr-2 font-semibold">CN</th>
              <th className="py-2 pr-2 font-semibold">Order</th>
              <th className="py-2 pr-2 font-semibold">Consignee, city</th>
              <th className="py-2 pr-2 text-right font-semibold">Pcs</th>
              <th className="py-2 text-right font-semibold">COD</th>
            </tr>
          </thead>
          <tbody>
            {d.parcels.map((p, i) => (
              <tr key={p.code} className="border-b border-midnight/12 align-top">
                <td className="tabular py-2 pr-2">{i + 1}</td>
                <td className="tabular py-2 pr-2 font-semibold">{p.cn ?? "—"}</td>
                <td className="tabular py-2 pr-2">{p.code}</td>
                <td className="py-2 pr-2">
                  {p.name}, {p.address?.city}
                </td>
                <td className="tabular py-2 pr-2 text-right">{p.pieces}</td>
                <td className="tabular py-2 text-right">{p.cod ? rs(p.cod) : "Paid"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={4} className="py-3">
                {d.parcels.length} parcel{d.parcels.length === 1 ? "" : "s"}
              </td>
              <td className="tabular py-3 text-right">{pieces}</td>
              <td className="tabular py-3 text-right">{rs(d.sheet.codTotalPaisa)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-14 grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="border-t border-midnight pt-2 font-semibold">Handed over by ({s.storeName})</p>
            <p className="mt-6 border-t border-midnight/40 pt-2">Name and signature</p>
          </div>
          <div>
            <p className="border-t border-midnight pt-2 font-semibold">Received by (rider)</p>
            <p className="mt-6 border-t border-midnight/40 pt-2">Name, rider code and signature</p>
            <p className="mt-6 border-t border-midnight/40 pt-2">Date and time</p>
          </div>
        </div>
      </article>
    </>
  );
}
