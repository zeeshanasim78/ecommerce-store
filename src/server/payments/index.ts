import { readGatewayConfig, type GatewayConfig } from "./config";
import { protocolGateway } from "./protocol";
import { GatewayError, type FetchLike, type PaymentGateway } from "./types";

export { readGatewayConfig, GATEWAY_ENV_KEYS, type GatewayConfig } from "./config";
export { GatewayError, SignatureError, type PaymentGateway, type GatewayEvent, type GatewayPaymentState, type GatewayStatus } from "./types";

type Env = Record<string, string | undefined>;

/** What the order code needs from the outside world — swapped for fakes in unit tests. */
export type GatewayDeps = { gateway: () => PaymentGateway; isConfigured: () => boolean };

/** The configured vendor's adapter. Throws GatewayError when online payment isn't set up. */
export function paymentGateway(env: Env = process.env, fetchImpl: FetchLike = fetch): PaymentGateway {
  const config: GatewayConfig = readGatewayConfig(env);
  if (!config.configured || !config.vendor) throw new GatewayError("Online payment isn’t set up (check AGGREGATOR_* in the environment file).");
  // One adapter per vendor. "test" speaks the Caidea gateway protocol to the pretend gateway on this machine;
  // a real vendor adds its own file here and its name to KNOWN_VENDORS in config.ts.
  return protocolGateway(config, env, fetchImpl);
}

/** The real gateway, configured from the environment file (read on every call, so a restart picks up edits). */
export function liveGatewayDeps(env: Env = process.env, fetchImpl: FetchLike = fetch): GatewayDeps {
  return { gateway: () => paymentGateway(env, fetchImpl), isConfigured: () => readGatewayConfig(env).configured };
}
