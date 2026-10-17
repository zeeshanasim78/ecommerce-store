import type { ApiCourier } from "@/db/schema/logistics";
import type { SHIPMENT_STATUSES } from "@/db/schema/logistics";

/**
 * Courier adapters — SPECIFICATION §9 and §27 (M10 Phase B).
 * Each courier with an API (Leopards, PostEx) implements CourierProvider. The adapters only talk
 * HTTP and translate shapes; every rule about orders lives in server/orders/fulfilment.ts.
 * Adapters are never called inside a database transaction (spec §6.2: no network calls while
 * holding the write lock).
 */

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type CourierCity = { code: string; name: string };

export type BookingInput = {
  /** Our order number — sent as the courier's order reference. */
  orderCode: string;
  name: string;
  /** 03xxxxxxxxx (couriers want the local format). */
  phone: string;
  email: string | null;
  address: string;
  city: CourierCity;
  /** 0 for prepaid orders. Whole rupees are sent to the courier. */
  codPaisa: number;
  weightGrams: number;
  pieces: number;
  /** Short description of the contents, e.g. "2 × Samsung Galaxy S23 Ultra screen". */
  contents: string;
  instructions: string;
};

export type BookingResult = { cn: string; labelUrl: string | null };

export type TrackingEvent = { at: string | null; text: string };
export type TrackingResult = {
  cn: string;
  /** Our shipment status, or null when the courier's wording isn't recognised (kept as text only). */
  status: ShipmentStatus | null;
  /** The courier's own words for the latest status. */
  text: string;
  events: TrackingEvent[];
};

export type PdfFile = { pdf: Uint8Array; fileName: string };

export interface CourierProvider {
  id: ApiCourier;
  /** Cities the courier delivers to (for mapping our delivery_zones). */
  cities(): Promise<CourierCity[]>;
  book(input: BookingInput): Promise<BookingResult>;
  /** Several CNs at once where the courier allows it. Unknown CNs are simply missing from the map. */
  track(cns: string[]): Promise<Map<string, TrackingResult>>;
  cancel(cn: string): Promise<void>;
  /** The courier's own label / airway bill as a PDF, when it isn't a public link. */
  labelPdf?(cns: string[]): Promise<PdfFile>;
  /** The courier's own load sheet. */
  loadSheet?(cns: string[]): Promise<{ ref: string | null; file: PdfFile | null }>;
}

/** Anything that went wrong talking to a courier. The message is safe to show staff (no secrets). */
export class CourierError extends Error {
  constructor(
    message: string,
    readonly courier: ApiCourier,
  ) {
    super(message);
    this.name = "CourierError";
  }
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Courier wording → our shipment status. Couriers describe the same step in many ways
 * ("Pickup Request Sent", "Arrived at Station", "Package on Route", "Delivery Under Review"…),
 * so this reads the words rather than a fixed list of codes. Order matters: the most specific
 * phrases first ("out for delivery" and "delivery under review" are not "delivered").
 * Anything unknown returns null — the text is kept and nothing changes.
 */
export function classifyStatus(raw: string | null | undefined): ShipmentStatus | null {
  const s = (raw ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return null;
  if (/\bcancel/.test(s)) return null; // courier-side cancellation: staff decide (Cancel booking / book again)
  if (/return|\brto\b|deliver(ed)? (back )?to (shipper|origin|merchant|consignor)/.test(s)) return "RETURN_IN_PROGRESS";
  if (/out for delivery|on delivery|with rider|assigned to rider/.test(s)) return "OUT_FOR_DELIVERY";
  if (/under review|undeliver|not delivered|attempt|refused|failed/.test(s)) return "IN_TRANSIT";
  if (/\bdelivered\b/.test(s)) return "DELIVERED";
  if (/picked|pickup done|collected from|received at origin|at postex warehouse/.test(s)) return "PICKED_UP";
  if (/transit|arrived|departed|dispatched|on route|en route|in process|hub|station|warehouse|sorting|shipped/.test(s)) return "IN_TRANSIT";
  if (/unbooked|booked|pickup request|at merchant|consignment created|order created|pending/.test(s)) return "BOOKED";
  return null;
}

/** How far along a shipment is — tracking never moves a shipment backwards. */
export const SHIPMENT_RANK: Record<ShipmentStatus, number> = {
  BOOKED: 0,
  PICKED_UP: 1,
  IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  RETURN_IN_PROGRESS: 4,
  DELIVERED: 5,
  RETURNED_TO_ORIGIN: 6,
  CANCELLED: 7,
};

/** "+923001234567" → "03001234567" (the format both couriers ask for). */
export const localPhone = (e164: string) => (e164.startsWith("+92") ? `0${e164.slice(3)}` : e164.replace(/\D/g, ""));

/** Whole rupees for the courier's COD field. Paisa totals are whole rupees in practice; round to be safe. */
export const codRupees = (p: number) => Math.round(p / 100);
