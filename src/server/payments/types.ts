/**
 * Online payment gateway (aggregator) — SPECIFICATION §8 and §31 (M14).
 *
 * One interface, one file per vendor. The adapters only talk HTTP, check signatures and translate
 * shapes; every rule about orders (what counts as paid, amount checks, de-duplication, cancelling)
 * lives in server/payments/online.ts. Adapters are never called inside a database transaction
 * (spec §6.2: no network calls while holding the write lock).
 *
 * All amounts in this interface are integer paisa. An adapter whose vendor speaks rupees converts
 * at its own boundary.
 */

export type GatewayStatus = "SUCCEEDED" | "FAILED" | "PENDING" | "REFUNDED";

export type CreatePaymentInput = {
  /** Our payment row id — the merchant reference the gateway echoes back in every callback. */
  reference: string;
  orderCode: string;
  amountPaisa: number;
  currency: "PKR";
  customer: { name: string; phone: string; email: string | null };
  /** Where the customer's browser comes back to. Display only: never proof of payment. */
  returnUrl: string;
  cancelUrl: string;
  /** Where the gateway posts its signed server-to-server callback. */
  callbackUrl: string;
};

/** A callback (webhook) whose signature has been verified. */
export type GatewayEvent = {
  /** Unique per gateway event — the de-duplication key (spec §4.10). */
  eventId: string;
  /** Our payment row id (the `reference` sent when the payment was created). */
  reference: string;
  providerRef: string | null;
  status: GatewayStatus;
  amountPaisa: number;
  currency: string;
};

/** The gateway's answer when we ask it directly (server to server). */
export type GatewayPaymentState = {
  reference: string;
  providerRef: string | null;
  status: GatewayStatus;
  amountPaisa: number;
  currency: string;
};

export interface PaymentGateway {
  /** Short vendor name, e.g. "test". */
  vendor: string;
  createPayment(input: CreatePaymentInput): Promise<{ providerRef: string; redirectUrl: string }>;
  /**
   * Checks the signature and freshness of a callback on the RAW body and returns the event.
   * Synchronous and free of side effects. Throws SignatureError when the callback is not genuine.
   */
  verifyCallback(input: { rawBody: string; headers: { get(name: string): string | null }; now: Date }): GatewayEvent;
  /** Asks the gateway what happened to a payment (reconciliation, return page). */
  queryStatus(input: { reference: string; providerRef: string | null }): Promise<GatewayPaymentState>;
  /** Pays money back to the customer (full or partial). Optional: not every vendor offers it. */
  refund?(input: { reference: string; providerRef: string; amountPaisa: number }): Promise<{ refundRef: string }>;
  /** Cheap authenticated call used by "Test connection". */
  ping(): Promise<void>;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** The gateway refused, couldn't be reached or answered something we can't read. Message is safe for staff. */
export class GatewayError extends Error {}

/** A callback whose signature, timestamp or format is wrong. Never reveals which, to the sender. */
export class SignatureError extends Error {}
