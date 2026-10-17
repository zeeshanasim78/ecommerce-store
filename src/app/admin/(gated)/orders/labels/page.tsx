import Link from "next/link";
import { Barcode } from "@/components/admin/barcode";
import { PrintButton } from "@/components/admin/print-button";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { loadLabels } from "@/server/orders/labels";

export const metadata = { title: "Labels" };
export const dynamic = "force-dynamic";

const ID = /^[0-9a-f-]{36}$/i;
const rs = (n: number) => formatMoney(paisa(n));

/**
 * Shipping labels (100 × 150 mm) and packing slips for one or more orders (M10 Phase B, Q73).
 * Each label and slip is its own printed page; print on a 4 × 6 in label printer, or on A4/A5
 * paper (the browser scales it). `?what=label` or `?what=slip` prints only one of them.
 */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string; what?: string; back?: string }> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const ids = (sp.ids ?? "").split(",").filter((x) => ID.test(x));
  const what = sp.what === "label" || sp.what === "slip" ? sp.what : "both";
  const { labels, sender } = loadLabels(db, ids);
  const back = sp.back && /^\/admin\/orders[\w/?=&%.-]*$/.test(sp.back) ? sp.back : ids.length === 1 ? `/admin/orders/${ids[0]}` : "/admin/orders";

  return (
    <>
      <style>{`@page { size: 100mm 150mm; margin: 0; } @media print { html, body { background: #FFFFFF !important; } }`}</style>
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton label={`Print ${labels.length} ${what === "slip" ? "packing slip" : what === "label" ? "label" : "label + packing slip"}${labels.length === 1 ? "" : "s"}`} />
        <ButtonLink href={back} variant="outline" size="sm">
          Back
        </ButtonLink>
        <span className="text-sm text-midnight/65">
          Show:{" "}
          {(["both", "label", "slip"] as const).map((w) => (
            <Link key={w} href={`/admin/orders/labels?ids=${ids.join(",")}&what=${w}`} aria-current={w === what ? "page" : undefined} className={`ml-2 underline-offset-4 ${w === what ? "font-semibold" : "underline"}`}>
              {w === "both" ? "Labels + slips" : w === "label" ? "Labels" : "Packing slips"}
            </Link>
          ))}
        </span>
      </div>
      {labels.length === 0 ? <p className="text-midnight/70">No packed or dispatched orders were chosen.</p> : null}

      <div className="labels flex flex-wrap gap-6 print:block">
        {labels.map((l) => (
          <div key={l.orderId} className="contents">
            {what !== "slip" ? (
              <section aria-label={`Label ${l.code}`} className="label-page flex h-[150mm] w-[100mm] flex-col overflow-hidden bg-white p-[4mm] text-[3.4mm] leading-snug text-midnight ring-1 ring-midnight/15 print:ring-0">
                <div className="flex items-start justify-between gap-2 border-b-2 border-midnight pb-[2mm]">
                  <div>
                    <p className="text-[2.6mm] font-semibold tracking-wide uppercase">From</p>
                    <p className="font-display text-[4.2mm] font-bold">{sender.name}</p>
                    <p>{[sender.city, sender.phone].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[4.2mm] font-bold">{l.courier ?? "—"}</p>
                    <p className="tabular text-[2.8mm]">{formatKarachi(l.placedAt).split(",")[0]}</p>
                  </div>
                </div>

                <div className="mt-[2mm] flex-1">
                  <p className="text-[2.6mm] font-semibold tracking-wide uppercase">To</p>
                  <p className="font-display text-[5mm] leading-tight font-bold">{l.name}</p>
                  <p className="tabular text-[4mm] font-semibold">{l.phone}</p>
                  {l.address.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p className="mt-[1mm] font-display text-[6mm] font-bold tracking-wide uppercase">{l.city}</p>
                </div>

                <div className={`my-[2mm] rounded-[2mm] border-2 border-midnight px-[3mm] py-[2mm] text-center ${l.codPaisa > 0 ? "bg-midnight text-white" : ""}`}>
                  {l.codPaisa > 0 ? (
                    <p className="font-display text-[6mm] font-bold">COLLECT {rs(l.codPaisa)}</p>
                  ) : (
                    <p className="font-display text-[5mm] font-bold">PAID — collect nothing</p>
                  )}
                  <p className="text-[2.8mm]">
                    {l.pieces} piece{l.pieces === 1 ? "" : "s"}
                    {l.weightGrams ? ` · ${(l.weightGrams / 1000).toLocaleString("en-PK")} kg` : ""} · Fragile: phone screen
                  </p>
                </div>

                <div className="text-center">
                  <Barcode value={l.cn ?? l.code} height={50} className="mx-auto h-[16mm] w-full" />
                  <p className="tabular text-[3.6mm] font-bold tracking-wider">{l.cn ? `CN ${l.cn}` : l.code}</p>
                  {l.cn ? <p className="tabular text-[2.8mm]">Order {l.code}</p> : null}
                </div>
              </section>
            ) : null}

            {what !== "label" ? (
              <section aria-label={`Packing slip ${l.code}`} className="label-page flex h-[150mm] w-[100mm] flex-col overflow-hidden bg-white p-[5mm] text-[3.2mm] leading-snug text-midnight ring-1 ring-midnight/15 print:ring-0">
                <div className="flex items-start justify-between border-b-2 border-midnight pb-[2mm]">
                  <div>
                    <p className="font-display text-[4.6mm] font-bold">Packing slip</p>
                    <p className="tabular font-semibold">{l.code}</p>
                  </div>
                  <Barcode value={l.code} height={40} className="h-[10mm] w-[40mm]" />
                </div>
                <p className="mt-[2mm]">
                  {l.name} · {l.city}
                </p>
                <table className="mt-[3mm] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-midnight/40 text-[2.8mm] uppercase">
                      <th className="py-[1mm] pr-[1mm] font-semibold">✓</th>
                      <th className="py-[1mm] pr-[1mm] font-semibold">Qty</th>
                      <th className="py-[1mm] font-semibold">Screen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.items.map((i) => (
                      <tr key={i.sku + i.detail} className="border-b border-midnight/15 align-top">
                        <td className="py-[1.5mm] pr-[1mm]">
                          <span className="inline-block size-[3.5mm] border border-midnight" aria-hidden />
                        </td>
                        <td className="tabular py-[1.5mm] pr-[1mm] font-bold">{i.qty}</td>
                        <td className="py-[1.5mm]">
                          <span className="font-semibold">{i.name}</span>
                          <span className="block text-[2.8mm]">{i.detail}</span>
                          <span className="tabular block text-[2.6mm]">{i.sku}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {l.notes ? <p className="mt-[2mm] text-[2.8mm]">Customer note: {l.notes}</p> : null}
                <div className="mt-auto grid grid-cols-2 gap-[4mm] pt-[4mm] text-[2.8mm]">
                  <p className="border-t border-midnight pt-[1mm]">Packed by</p>
                  <p className="border-t border-midnight pt-[1mm]">Checked by</p>
                </div>
                <p className="mt-[2mm] text-center text-[2.6mm]">Screen protected in foam, box sealed. Thank you for buying from {sender.name}.</p>
              </section>
            ) : null}
          </div>
        ))}
      </div>
      <style>{`@media print { .label-page { break-before: page; page-break-before: always; margin: 0; } .labels > :first-child > .label-page:first-child { break-before: auto; page-break-before: auto; } }`}</style>
    </>
  );
}
