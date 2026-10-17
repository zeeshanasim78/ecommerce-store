import { API_COURIERS, type ApiCourier } from "@/db/schema/logistics";
import { readCourierConfig } from "./config";
import { leopardsProvider } from "./leopards";
import { postexProvider } from "./postex";
import type { CourierProvider, FetchLike } from "./types";

export { CourierError, classifyStatus, type CourierProvider, type TrackingResult, type BookingInput, type CourierCity } from "./types";
export { readCourierConfig, COURIER_ENV_KEYS, type CourierConfig } from "./config";

/** Dependencies the order code needs from the outside world — swapped for fakes in unit tests. */
export type CourierDeps = { provider: (c: ApiCourier) => CourierProvider; isConfigured: (c: ApiCourier) => boolean };

export const isApiCourier = (c: string): c is ApiCourier => (API_COURIERS as readonly string[]).includes(c);

export function courierProvider(courier: ApiCourier, env: Record<string, string | undefined> = process.env, fetchImpl: FetchLike = fetch): CourierProvider {
  return courier === "LEOPARDS" ? leopardsProvider(env, fetchImpl) : postexProvider(env, fetchImpl);
}

/** The real couriers, configured from the environment file (read on every call, so a restart picks up edits). */
export function liveCourierDeps(env: Record<string, string | undefined> = process.env, fetchImpl: FetchLike = fetch): CourierDeps {
  return { provider: (c) => courierProvider(c, env, fetchImpl), isConfigured: (c) => readCourierConfig(c, env).configured };
}
