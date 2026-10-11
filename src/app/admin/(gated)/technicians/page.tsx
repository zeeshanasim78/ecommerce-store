import Link from "next/link";
import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { listTechnicians, type Technician } from "@/server/counter/pos";
import { requireStaff } from "@/server/dal";
import { addTechnicianFormAction, setTechnicianStatusAction } from "./actions";

export const metadata = { title: "Technicians" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Technician["status"], string> = { PENDING: "Waiting", APPROVED: "Approved", REJECTED: "Rejected" };
const FILTERS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Waiting" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
] as const;

/** Repair technicians who may buy at wholesale prices at the counter (spec §4.3, Q10, Q54). */
export default async function TechniciansPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; saved?: string; error?: string }> }) {
  await requireStaff("technicians");
  const sp = await searchParams;
  const status = sp.status === "PENDING" || sp.status === "APPROVED" || sp.status === "REJECTED" ? sp.status : undefined;
  const list = listTechnicians(db, { status, q: sp.q });
  const waiting = status ? null : list.filter((t) => t.status === "PENDING").length;

  return (
    <>
      <AdminHeader title="Technicians" description="Repair technicians get wholesale prices at the counter once approved. Cashiers can register a technician at the till; they wait here until a manager or the owner approves them." />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {waiting ? <Notice tone="error">{waiting} technician{waiting === 1 ? " is" : "s are"} waiting for approval.</Notice> : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `?status=${f.key}` : "?"} aria-current={(status ?? "") === f.key ? "page" : undefined} className="rounded-full border border-midnight/20 px-4 py-1.5 text-sm font-semibold aria-[current=page]:bg-midnight aria-[current=page]:text-canvas">
            {f.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={sp.q} placeholder="Name, shop or mobile" aria-label="Search technicians" className="h-9 w-56" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {list.length === 0 ? (
        <p className="rounded-bezel bg-white px-6 py-10 text-center text-midnight/60 ring-1 ring-midnight/8">No technicians here yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Technician</TH>
              <TH>Mobile</TH>
              <TH>City</TH>
              <TH>Status</TH>
              <TH className="text-right">Change</TH>
            </TR>
          </THead>
          <tbody>
            {list.map((t) => (
              <TR key={t.id}>
                <TD>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-midnight/60">{t.shopName}</p>
                </TD>
                <TD className="whitespace-nowrap">{t.phoneDisplay}</TD>
                <TD>{t.city ?? "—"}</TD>
                <TD>
                  <Badge tone={t.status === "APPROVED" ? "stock" : t.status === "PENDING" ? "low" : "out"}>{STATUS_LABEL[t.status]}</Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    {t.status !== "APPROVED" && (
                      <form action={setTechnicianStatusAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                    )}
                    {t.status !== "REJECTED" && (
                      <form action={setTechnicianStatusAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <Button type="submit" size="sm" variant="outline">
                          Reject
                        </Button>
                      </form>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <div className="mt-10">
        <Section title="Add a technician" description="Added here, they are approved straight away.">
          <form action={addTechnicianFormAction} className="grid gap-4 sm:grid-cols-2">
            <Field id="t-name" label="Name">
              <Input id="t-name" name="name" required minLength={2} maxLength={80} />
            </Field>
            <Field id="t-shop" label="Repair shop">
              <Input id="t-shop" name="shopName" required minLength={2} maxLength={80} />
            </Field>
            <Field id="t-phone" label="Mobile">
              <Input id="t-phone" name="phone" required inputMode="tel" placeholder="0300 1234567" />
            </Field>
            <Field id="t-city" label="City (optional)">
              <Input id="t-city" name="city" maxLength={60} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Add technician</Button>
            </div>
          </form>
        </Section>
      </div>
    </>
  );
}
