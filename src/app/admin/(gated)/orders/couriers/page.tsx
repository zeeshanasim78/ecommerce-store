import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { API_COURIERS } from "@/db/schema/logistics";
import { formatKarachi } from "@/lib/time";
import { readCourierConfig } from "@/server/couriers";
import { cityMapTable, storedCourierCities } from "@/server/couriers/city-map";
import { requireStaff } from "@/server/dal";
import { COURIER_LABEL } from "@/server/orders/order-details";
import { loadCitiesAction, setCityAction } from "./actions";

export const metadata = { title: "Couriers" };
export const dynamic = "force-dynamic";

/**
 * Courier connections (M10 Phase B, Q66). The API keys live only in the environment file and are
 * never shown here — just whether they are set, which server is used, and any problem with them.
 */
export default async function CouriersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const configs = API_COURIERS.map((c) => ({ ...readCourierConfig(c), list: storedCourierCities(db, c) }));
  const table = cityMapTable(db);

  return (
    <>
      <AdminHeader
        title="Couriers"
        description="Leopards and PostEx can be booked and tracked from Online orders once their API keys are in the environment file. TCS, Trax and your own rider are always entered by hand (paste the CN)."
        actions={
          <ButtonLink href="/admin/orders" variant="outline">
            Online orders
          </ButtonLink>
        }
      />
      {sp.saved ? <Notice>{sp.saved}</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {configs.map((c) => (
          <Section key={c.courier} title={c.label}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={c.configured ? "stock" : "out"}>{c.configured ? "Connected" : "Not connected"}</Badge>
              {c.configured ? <Badge tone={c.mode === "live" ? "stock" : "low"}>{c.mode === "live" ? "Live" : c.mode === "staging" ? "Test server (staging)" : "Test courier on this machine"}</Badge> : null}
            </div>
            {!c.configured && !c.problems.length ? (
              <p className="text-[0.9375rem] text-midnight/75">
                Add {c.courier === "LEOPARDS" ? "LEOPARDS_API_KEY and LEOPARDS_API_PASSWORD (and LEOPARDS_MODE=live for real bookings)" : "POSTEX_API_TOKEN (and POSTEX_PICKUP_ADDRESS_CODE if you have several pickup addresses)"} to the environment file, then restart the shop. Until then, book on the courier’s portal and paste the CN.
              </p>
            ) : null}
            {c.problems.map((p) => (
              <p key={p} className="text-[0.9375rem] font-medium text-terracotta">
                {p}
              </p>
            ))}
            {c.warnings.map((w) => (
              <p key={w} className="text-[0.9375rem] text-midnight/80">
                {w}
              </p>
            ))}
            <p className="text-sm text-midnight/65">
              City list: {c.list.cities.length ? `${c.list.cities.length} cities, loaded ${formatKarachi(c.list.loadedAt)}` : "not loaded yet"}.
            </p>
            {c.configured ? (
              <form action={loadCitiesAction}>
                <input type="hidden" name="courier" value={c.courier} />
                <Button type="submit" variant="outline" size="sm">
                  {c.list.cities.length ? "Test connection and reload cities" : "Test connection and load cities"}
                </Button>
              </form>
            ) : null}
          </Section>
        ))}
      </div>

      <Section title="Our delivery cities → courier cities" description="Each courier names its cities its own way. Loading the list matches them by name; pick any that didn’t match. A city you pick by hand is kept when the list is reloaded.">
        <Table>
          <THead>
            <tr>
              <TH>Our city</TH>
              {configs.map((c) => (
                <TH key={c.courier}>{c.label}</TH>
              ))}
            </tr>
          </THead>
          <tbody>
            {table.map((z) => (
              <TR key={z.id}>
                <TD>
                  <span className="font-semibold">{z.city}</span>
                  <span className="block text-sm text-midnight/60">Usual courier: {COURIER_LABEL[z.defaultCourier] ?? z.defaultCourier}</span>
                </TD>
                {configs.map((c) => {
                  const m = z[c.courier];
                  return (
                    <TD key={c.courier}>
                      {c.list.cities.length ? (
                        <form action={setCityAction} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="courier" value={c.courier} />
                          <input type="hidden" name="zoneId" value={z.id} />
                          <Select name="code" defaultValue={m?.courierCityCode ?? ""} aria-label={`${c.label} city for ${z.city}`} className="h-9 max-w-52 text-sm">
                            <option value="">— not matched —</option>
                            {c.list.cities.map((x) => (
                              <option key={x.code} value={x.code}>
                                {x.name}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" variant="ghost" size="sm">
                            Save
                          </Button>
                          {m ? <span className="w-full text-xs text-midnight/55">{m.source === "MANUAL" ? "picked by hand" : "matched by name"}</span> : null}
                        </form>
                      ) : (
                        <span className="text-sm text-midnight/55">{m ? m.courierCityName : "Load the city list first"}</span>
                      )}
                    </TD>
                  );
                })}
              </TR>
            ))}
          </tbody>
        </Table>
      </Section>
    </>
  );
}
