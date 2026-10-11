import { notFound } from "next/navigation";
import { CounterReceipt } from "@/components/admin/counter-receipt";
import { PrintableReceipt } from "@/components/admin/printable-receipt";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { TECHNICIAN_APPROVER_ROLES } from "@/lib/permissions";
import { loadCounterReceipt } from "@/server/counter/pos";
import { requireStaff } from "@/server/dal";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import { PrintButton } from "@/components/admin/print-button";

export const metadata = { title: "Receipt" };
export const dynamic = "force-dynamic";

/** Reprint a counter receipt. Cashiers see their own sales; managers and the owner see all. */
export default async function ReceiptPage({ params }: { params: Promise<{ code: string }> }) {
  const staff = await requireStaff("counter");
  const { code } = await params;
  if (!/^CA-POS-\d{6}-\d{4}$/i.test(code)) notFound();
  const r = loadCounterReceipt(db, { code });
  if (!r || (!TECHNICIAN_APPROVER_ROLES.includes(staff.role) && r.cashierId !== staff.id)) notFound();
  const s = getCheckoutSettings(db);
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-3 print:hidden">
        <PrintButton label="Print receipt" />
        <ButtonLink href="/admin/counter-sale" variant="outline">
          Back to the till
        </ButtonLink>
      </div>
      <div className="w-fit rounded-bezel bg-white p-4 ring-1 ring-midnight/8 print:rounded-none print:p-0 print:ring-0">
        <PrintableReceipt>
          <CounterReceipt receipt={r} shop={{ storeName: s.storeName, storePhone: s.storePhone, whatsapp: s.whatsapp }} />
        </PrintableReceipt>
      </div>
    </>
  );
}
