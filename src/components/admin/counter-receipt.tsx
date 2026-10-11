import { formatMoney } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import type { CounterReceipt as Receipt } from "@/server/counter/pos";
import { COUNTER_METHOD_LABEL } from "@/lib/counter";

/**
 * 80 mm thermal receipt (spec §6.4 step 3). Plain black-on-white text (midnight on white) in a
 * 72 mm printable column; the page that shows it sets `@page { size: 80mm auto; margin: 0 }`.
 * No interactivity, so it renders both on the till (after a sale) and on the reprint page.
 */

export type ShopHeader = { storeName: string; storePhone: string | null; whatsapp: string | null };

const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }).format(Date.parse(iso)) : null);

export function CounterReceipt({ receipt: r, shop }: { receipt: Receipt; shop: ShopHeader }) {
  const warranties = r.items.filter((i) => i.warrantyUntil);
  return (
    <div className="receipt mx-auto w-[72mm] bg-white font-sans text-[11px] leading-snug text-midnight" data-receipt={r.code}>
      <div className="text-center">
        <p className="font-display text-[18px] font-bold tracking-tight">{shop.storeName}</p>
        <p>Mobile display screens</p>
        {shop.storePhone && <p>Tel {shop.storePhone}</p>}
        {shop.whatsapp && shop.whatsapp !== shop.storePhone && <p>WhatsApp {shop.whatsapp}</p>}
      </div>

      <div className="mt-2 border-y border-dashed border-midnight py-1.5">
        <Row left="Receipt" right={r.code} strong />
        <Row left="Date" right={formatKarachi(r.placedAt)} />
        <Row left="Served by" right={r.cashierName} />
        {r.tier === "WHOLESALE" && <Row left="Price" right="Wholesale (technician)" />}
        {r.customerName && <Row left="Customer" right={r.technicianShop ? `${r.customerName}, ${r.technicianShop}` : r.customerName} />}
        {r.customerPhone && <Row left="Mobile" right={r.customerPhone} />}
      </div>

      <ul className="mt-1.5 flex flex-col gap-1.5">
        {r.items.map((i) => (
          <li key={i.sku}>
            <p className="font-semibold">{i.description}</p>
            <Row left={`${i.qty} × ${formatMoney(i.unitPaisa)}  ·  ${i.sku}`} right={formatMoney(i.lineTotalPaisa)} />
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-dashed border-midnight pt-1.5">
        {r.discountPaisa > 0 && (
          <>
            <Row left="Subtotal" right={formatMoney(r.subtotalPaisa)} />
            <Row left="Discount" right={`− ${formatMoney(r.discountPaisa)}`} />
          </>
        )}
        <Row left="TOTAL" right={formatMoney(r.totalPaisa)} strong big />
        <Row left="Paid by" right={COUNTER_METHOD_LABEL[r.method]} />
        {r.cashReceivedPaisa !== null && <Row left="Cash received" right={formatMoney(r.cashReceivedPaisa)} />}
        {r.changePaisa !== null && <Row left="Change" right={formatMoney(r.changePaisa)} strong />}
        {r.reference && <Row left="Transaction ID" right={r.reference} />}
      </div>

      <div className="mt-2 border-t border-dashed border-midnight pt-1.5">
        <p className="font-semibold">Warranty</p>
        {warranties.length ? (
          <ul>
            {warranties.map((i) => (
              <li key={i.sku}>
                {i.sku}: until {date(i.warrantyUntil)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No warranty on these items.</p>
        )}
        <p className="mt-1">
          Keep this receipt and bring it with the screen for any warranty claim. No warranty on physically damaged or broken glass.
        </p>
      </div>

      <p className="mt-2 text-center font-semibold">Thank you for shopping at {shop.storeName}</p>
    </div>
  );
}

function Row({ left, right, strong, big }: { left: string; right: string; strong?: boolean; big?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${strong ? "font-semibold" : ""} ${big ? "text-[14px]" : ""}`}>
      <span>{left}</span>
      <span className="text-right">{right}</span>
    </div>
  );
}
