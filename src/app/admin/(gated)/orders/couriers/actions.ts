"use server";

import { db } from "@/db/client";
import { API_COURIERS, type ApiCourier } from "@/db/schema/logistics";
import { goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { liveCourierDeps } from "@/server/couriers";
import { CityMapError, loadCourierCities, setCourierCity } from "@/server/couriers/city-map";
import { requireStaff } from "@/server/dal";
import { text } from "@/server/forms";

/** Couriers page (M10 Phase B): load each courier's city list and match our delivery cities. OWNER/MANAGER. */

const PAGE = "/admin/orders/couriers";
const courierOf = (fd: FormData): ApiCourier | null => {
  const c = text(fd, "courier");
  return (API_COURIERS as readonly string[]).includes(c) ? (c as ApiCourier) : null;
};

/** Also the connection test: it is the simplest call that needs valid keys. */
export async function loadCitiesAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const courier = courierOf(fd);
  if (!courier) goTo(PAGE, { error: "Choose a courier." });
  const ctx = await auditContext();
  let r: { total: number; matched: number; unmatched: string[] };
  try {
    r = await loadCourierCities(db, courier, liveCourierDeps(), { actorId: staff.id }, ctx);
  } catch (e) {
    if (e instanceof CityMapError) goTo(PAGE, { error: e.message });
    throw e;
  }
  goTo(PAGE, {
    saved: `Connected to ${courier === "LEOPARDS" ? "Leopards" : "PostEx"}: ${r.total} cities loaded, ${r.matched} of our cities matched.${r.unmatched.length ? ` Pick these by hand: ${r.unmatched.join(", ")}.` : ""}`,
  });
}

export async function setCityAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const courier = courierOf(fd);
  const zoneId = text(fd, "zoneId");
  if (!courier || !/^[0-9a-f-]{36}$/i.test(zoneId)) goTo(PAGE, { error: "City not found." });
  const ctx = await auditContext();
  let city: string;
  try {
    city = setCourierCity(db, courier, zoneId, text(fd, "code"), { actorId: staff.id }, ctx);
  } catch (e) {
    if (e instanceof CityMapError) goTo(PAGE, { error: e.message });
    throw e;
  }
  goTo(PAGE, { saved: `${city}: saved.` });
}
