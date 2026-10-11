import { db } from "@/db/client";
import { COUNTER_DISCOUNT_ROLES, COUNTER_NON_CASH_ROLES, TECHNICIAN_APPROVER_ROLES } from "@/lib/permissions";
import { karachiDate, recentCounterSales } from "@/server/counter/pos";
import { requireStaff } from "@/server/dal";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import { PosTerminal } from "./pos-terminal";

export const metadata = { title: "Counter sale" };
export const dynamic = "force-dynamic";

/** Counter sale / POS — Milestone 9 (spec §6.4, §25). OWNER, MANAGER, CASHIER. */
export default async function CounterSalePage() {
  const staff = await requireStaff("counter");
  const s = getCheckoutSettings(db);
  const seesAll = TECHNICIAN_APPROVER_ROLES.includes(staff.role);
  const recent = recentCounterSales(db, { date: karachiDate(new Date()), cashierId: seesAll ? undefined : staff.id });
  return (
    <>
      <div className="-mt-4 mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 print:hidden">
        <h1 className="text-[1.5rem] leading-tight font-bold tracking-[-0.02em]">Counter sale</h1>
        <p className="text-midnight/65">{COUNTER_NON_CASH_ROLES.includes(staff.role) ? "Owner till: cash, JazzCash, Easypaisa, bank and card." : "Cash only at this till."}</p>
      </div>
      <PosTerminal
        staffName={staff.name}
        canNonCash={COUNTER_NON_CASH_ROLES.includes(staff.role)}
        canDiscount={COUNTER_DISCOUNT_ROLES.includes(staff.role)}
        canApprove={TECHNICIAN_APPROVER_ROLES.includes(staff.role)}
        shop={{ storeName: s.storeName, storePhone: s.storePhone, whatsapp: s.whatsapp }}
        recent={recent}
      />
    </>
  );
}
