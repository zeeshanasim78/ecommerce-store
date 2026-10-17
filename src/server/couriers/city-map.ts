import { and, asc, eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { courierCities, deliveryZones, settings } from "@/db/schema";
import type { ApiCourier } from "@/db/schema/logistics";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { withStockTransaction } from "@/server/inventory/stock";
import { CourierError, type CourierCity, type CourierDeps } from "./index";

/**
 * Our delivery cities (delivery_zones) ↔ each courier's city list (spec §9 `cities()`).
 * "Load the city list" asks the courier for its cities, keeps the list (so staff can pick by hand)
 * and matches every city by name. A city staff picked by hand is never overwritten.
 */

export class CityMapError extends Error {}

const listKey = (c: ApiCourier): "courier_cities_leopards" | "courier_cities_postex" => (c === "LEOPARDS" ? "courier_cities_leopards" : "courier_cities_postex");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function storedCourierCities(db: DB, courier: ApiCourier): { cities: CourierCity[]; loadedAt: string | null } {
  const row = db.select().from(settings).where(eq(settings.key, listKey(courier))).get();
  const v = row?.value as { cities?: CourierCity[] } | undefined;
  return { cities: Array.isArray(v?.cities) ? v.cities : [], loadedAt: row?.updatedAt ?? null };
}

/** Best match for one of our cities in the courier's list, or null when unsure. */
export function matchCity(ours: string, list: CourierCity[]): CourierCity | null {
  const n = norm(ours);
  const exact = list.filter((c) => norm(c.name) === n);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) return null;
  const close = list.filter((c) => norm(c.name).startsWith(n) || (n.length >= 5 && n.startsWith(norm(c.name)) && norm(c.name).length >= 5));
  return close.length === 1 ? close[0]! : null;
}

export async function loadCourierCities(db: DB, courier: ApiCourier, deps: CourierDeps, input: { actorId: string }, ctx: AuditContext) {
  if (!deps.isConfigured(courier)) throw new CityMapError("This courier isn’t connected yet — add its API keys to the environment file and restart.");
  let list: CourierCity[];
  try {
    list = await deps.provider(courier).cities();
  } catch (e) {
    if (e instanceof CourierError) throw new CityMapError(e.message);
    throw e;
  }
  list = list.slice(0, 3000).sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) throw new CityMapError("The courier sent an empty city list — nothing was changed.");
  return withStockTransaction(db, (tx) => {
    tx.insert(settings)
      .values({ key: listKey(courier), value: { cities: list }, updatedBy: input.actorId })
      .onConflictDoUpdate({ target: settings.key, set: { value: { cities: list }, updatedAt: new Date().toISOString(), updatedBy: input.actorId } })
      .run();
    const zones = tx.select().from(deliveryZones).where(eq(deliveryZones.isActive, true)).all();
    let matched = 0;
    const unmatched: string[] = [];
    for (const z of zones) {
      const current = tx.select().from(courierCities).where(and(eq(courierCities.courier, courier), eq(courierCities.cityId, z.id))).get();
      if (current?.source === "MANUAL" && list.some((c) => c.code === current.courierCityCode)) {
        matched += 1;
        continue;
      }
      const m = matchCity(z.city, list);
      if (!m) {
        if (current) tx.delete(courierCities).where(eq(courierCities.id, current.id)).run();
        unmatched.push(z.city);
        continue;
      }
      matched += 1;
      if (current) tx.update(courierCities).set({ courierCityCode: m.code, courierCityName: m.name, source: "AUTO", updatedAt: new Date().toISOString(), updatedBy: input.actorId }).where(eq(courierCities.id, current.id)).run();
      else tx.insert(courierCities).values({ courier, cityId: z.id, courierCityCode: m.code, courierCityName: m.name, source: "AUTO", updatedBy: input.actorId }).run();
    }
    writeAudit(tx, ctx, { actorId: input.actorId, action: "courier.cities_loaded", entity: "courier_cities", entityId: courier, after: { cities: list.length, matched, unmatched } });
    return { total: list.length, matched, unmatched };
  });
}

/** Staff pick the courier's city for one of ours (or clear it with an empty code). */
export function setCourierCity(db: DB, courier: ApiCourier, zoneId: string, code: string, input: { actorId: string }, ctx: AuditContext) {
  const zone = db.select().from(deliveryZones).where(eq(deliveryZones.id, zoneId)).get();
  if (!zone) throw new CityMapError("City not found.");
  const choice = code ? storedCourierCities(db, courier).cities.find((c) => c.code === code) : null;
  if (code && !choice) throw new CityMapError("Pick a city from the courier’s list (load the list first).");
  return withStockTransaction(db, (tx) => {
    const current = tx.select().from(courierCities).where(and(eq(courierCities.courier, courier), eq(courierCities.cityId, zoneId))).get();
    if (!choice) {
      if (current) tx.delete(courierCities).where(eq(courierCities.id, current.id)).run();
    } else if (current) {
      tx.update(courierCities).set({ courierCityCode: choice.code, courierCityName: choice.name, source: "MANUAL", updatedAt: new Date().toISOString(), updatedBy: input.actorId }).where(eq(courierCities.id, current.id)).run();
    } else {
      tx.insert(courierCities).values({ courier, cityId: zoneId, courierCityCode: choice.code, courierCityName: choice.name, source: "MANUAL", updatedBy: input.actorId }).run();
    }
    writeAudit(tx, ctx, { actorId: input.actorId, action: "courier.city_set", entity: "courier_cities", entityId: zoneId, before: current ? { code: current.courierCityCode, name: current.courierCityName } : null, after: choice ? { courier, code: choice.code, name: choice.name } : { courier, cleared: true } });
    return zone.city;
  });
}

/** Every active delivery city with its match for each courier. */
export function cityMapTable(db: DB) {
  const zones = db.select({ id: deliveryZones.id, city: deliveryZones.city, defaultCourier: deliveryZones.defaultCourier }).from(deliveryZones).where(eq(deliveryZones.isActive, true)).orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.city)).all();
  const maps = db.select().from(courierCities).all();
  return zones.map((z) => ({
    ...z,
    LEOPARDS: maps.find((m) => m.cityId === z.id && m.courier === "LEOPARDS") ?? null,
    POSTEX: maps.find((m) => m.cityId === z.id && m.courier === "POSTEX") ?? null,
  }));
}
