import { notFound } from "next/navigation";
import { Logo } from "@/components/store/logo";
import { PAYMENT_TERMS_LABEL, PO_STATUS_LABEL, formatForeign } from "@/components/admin/purchasing-labels";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { loadPurchaseOrder } from "../load";
import { PrintButton } from "./print-button";

export const metadata = { title: "Print purchase order" };

/**
 * Printable PO (spec §7 "prints PO PDF"): the browser's Print → Save as PDF produces the file,
 * so no PDF library is needed. Only supplier-facing facts appear — no landed costs or margins.
 */
export default async function PrintPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("purchasing");
  const { id } = await params;
  const data = loadPurchaseOrder(id);
  if (!data) notFound();
  const { po, vendor, lines } = data;

  return (
    <article className="mx-auto max-w-3xl bg-white p-8 text-midnight ring-1 ring-midnight/10 print:p-0 print:ring-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <a href={`/admin/purchase-orders/${po.id}`} className="text-sm font-semibold underline underline-offset-4">
          ← Back to {po.code}
        </a>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between gap-6 border-b border-midnight/15 pb-6">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-midnight/70">Mobile display assemblies — Pakistan</p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">Purchase order</h1>
          <p className="mt-1 text-lg font-semibold tabular">{po.code}</p>
          <p className="text-sm text-midnight/70">{PO_STATUS_LABEL[po.status]}</p>
        </div>
      </header>

      <section className="grid gap-6 py-6 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-midnight/60">Supplier</h2>
          <p className="mt-1 font-semibold">{vendor.name}</p>
          <p className="text-sm">
            {[vendor.contactPerson, vendor.city, vendor.country].filter(Boolean).join(", ")}
            {vendor.phone ? <span className="block">{vendor.phone}</span> : null}
            {vendor.email ? <span className="block">{vendor.email}</span> : null}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:justify-self-end">
          <dt className="text-midnight/60">Date</dt>
          <dd>{formatKarachi(po.orderedAt ?? po.createdAt)}</dd>
          <dt className="text-midnight/60">Currency</dt>
          <dd>{po.currency}</dd>
          <dt className="text-midnight/60">Terms</dt>
          <dd>{PAYMENT_TERMS_LABEL[vendor.paymentTerms]}</dd>
          {po.expectedAt ? (
            <>
              <dt className="text-midnight/60">Expected</dt>
              <dd>{po.expectedAt}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-midnight/20 text-left">
            <th className="py-2 pr-3 font-semibold">#</th>
            <th className="py-2 pr-3 font-semibold">Item</th>
            <th className="py-2 pr-3 font-semibold">Code</th>
            <th className="py-2 pr-3 text-right font-semibold">Qty</th>
            <th className="py-2 pr-3 text-right font-semibold">Unit price</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.line.id} className="border-b border-midnight/10 align-top">
              <td className="py-2 pr-3 tabular">{i + 1}</td>
              <td className="py-2 pr-3">
                {l.brand} {l.model} display assembly — {l.grade}, {l.color}
                {l.variantLabel ? `, ${l.variantLabel}` : ""}
              </td>
              <td className="py-2 pr-3 tabular whitespace-nowrap">{l.variantSku}</td>
              <td className="py-2 pr-3 text-right tabular">{l.line.qtyOrdered}</td>
              <td className="py-2 pr-3 text-right tabular whitespace-nowrap">{formatForeign(l.line.unitCostForeign, po.currency)}</td>
              <td className="py-2 text-right tabular whitespace-nowrap">{formatForeign(l.lineValueForeign, po.currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} />
            <td className="pt-3 text-right tabular font-semibold">{lines.reduce((n, l) => n + l.line.qtyOrdered, 0)}</td>
            <td className="pt-3 pr-3 text-right font-semibold">Total</td>
            <td className="pt-3 text-right text-base font-bold tabular whitespace-nowrap">{formatForeign(data.goodsForeign, po.currency)}</td>
          </tr>
        </tfoot>
      </table>

      {po.notes ? (
        <section className="mt-8 text-sm">
          <h2 className="font-semibold text-midnight/60">Notes</h2>
          <p className="mt-1 whitespace-pre-line">{po.notes}</p>
        </section>
      ) : null}

      <footer className="mt-12 grid grid-cols-2 gap-10 text-sm">
        <div className="border-t border-midnight/30 pt-2">Authorised by Caidea</div>
        <div className="border-t border-midnight/30 pt-2">Supplier acknowledgement</div>
      </footer>
    </article>
  );
}
