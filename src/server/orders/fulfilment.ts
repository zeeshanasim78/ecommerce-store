import { and, desc, eq, inArray, isNotNull, isNull, like, notInArray, sql } from "drizzle-orm";
import type { DB, Tx } from "@/db/connection";
import { courierCities, deliveryZones, loadSheets, orderItems, orders, payments, productVariants, products, shipments, SYSTEM_USER_ID } from "@/db/schema";
import { API_COURIERS, COURIERS, type ApiCourier, type Courier } from "@/db/schema/logistics";
import { formatMoney, paisa } from "@/lib/money";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { CourierError, isApiCourier, type BookingInput, type CourierDeps, type TrackingResult } from "@/server/couriers";
import { SHIPMENT_RANK, localPhone, type ShipmentStatus } from "@/server/couriers/types";
import { karachiDate } from "@/server/counter/pos";
import { applyStockMovement, withStockTransaction } from "@/server/inventory/stock";
import { OrderActionError } from "./admin-orders";

/**
 * Milestone 10 Phase B (SPECIFICATION §9, §27): packing, courier booking, tracking, delivery,
 * parcels returned to the shop, and load sheets. OWNER/MANAGER (module `orders`).
 *
 *   NEW → CONFIRMED → PACKED → BOOKED → IN_TRANSIT → DELIVERED
 *                                  └──────────────→ RETURNED_TO_ORIGIN (Receive returned parcel)
 *
 * Same rules as Phase A (admin-orders.ts): each change re-reads the order inside one BEGIN IMMEDIATE
 * transaction (a double click or two staff at once apply it once), writes admin_audit_log, and moves
 * stock only through the stock engine. Courier API calls are made OUTSIDE transactions (spec §6.2):
 * book first, then save; if the order changed meanwhile, the new courier booking is cancelled again.
 * Free of Next.js imports so it can be unit-tested; the Server Actions wrap it.
 */

type Order = typeof orders.$inferSelect;
type Shipment = typeof shipments.$inferSelect;

export const DEFAULT_WEIGHT_GRAMS = 500; // Q67
export const TERMINAL_SHIPMENT: ShipmentStatus[] = ["DELIVERED", "RETURNED_TO_ORIGIN", "CANCELLED"];
const WITH_COURIER = ["BOOKED", "IN_TRANSIT"] as const;

const snap = (o: Order) => ({ paymentStatus: o.paymentStatus, fulfillmentStatus: o.fulfillmentStatus });
const payable = (o: Order) => o.paymentMethod === "COD" || o.paymentStatus === "PAID";
const courierName = (c: string) => ({ LEOPARDS: "Leopards", POSTEX: "PostEx", TCS: "TCS", TRAX: "Trax", SELF: "own rider" })[c] ?? c;

function load(tx: Tx | DB, orderId: string): Order {
  const o = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!o || o.channel !== "ONLINE") throw new OrderActionError("Order not found.");
  return o;
}

/** The shipment that counts: the newest one that wasn't cancelled. */
export function activeShipment(db: Tx | DB, orderId: string): Shipment | undefined {
  return db
    .select()
    .from(shipments)
    .where(and(eq(shipments.orderId, orderId), sql`${shipments.status} <> 'CANCELLED'`))
    .orderBy(desc(shipments.bookedAt), desc(sql`${shipments}.rowid`))
    .get();
}

function notWithCourierYet(o: Order, what: string): never {
  if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is cancelled.");
  if (o.fulfillmentStatus === "NEW") throw new OrderActionError("Confirm the payment first.");
  if (o.fulfillmentStatus === "CONFIRMED" || o.fulfillmentStatus === "PACKED") throw new OrderActionError(`This order hasn’t been handed to a courier yet — ${what}.`);
  if (o.fulfillmentStatus === "DELIVERED") throw new OrderActionError("This order is already delivered.");
  throw new OrderActionError("This parcel is already back at the shop.");
}

// ---- Pack -----------------------------------------------------------------------------------

/** CONFIRMED (COD, or paid) → PACKED. */
export function markPacked(db: DB, orderId: string, input: { actorId: string }, ctx: AuditContext) {
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is cancelled.");
    if (o.fulfillmentStatus === "PACKED") throw new OrderActionError("This order is already packed.");
    if (o.fulfillmentStatus !== "CONFIRMED") throw new OrderActionError(o.fulfillmentStatus === "NEW" ? "Confirm the payment before packing." : "This order is already with the courier.");
    if (!payable(o)) throw new OrderActionError("Confirm the payment before packing.");
    tx.update(orders).set({ fulfillmentStatus: "PACKED" }).where(eq(orders.id, o.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "order.packed", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "PACKED" } });
    return o.code;
  });
}

// ---- Book with a courier's API ----------------------------------------------------------------

export type BookOptions = { weightGrams?: number; pieces?: number };

function cleanWeight(opts: BookOptions) {
  const weightGrams = opts.weightGrams ?? DEFAULT_WEIGHT_GRAMS;
  const pieces = opts.pieces ?? 1;
  if (!Number.isInteger(weightGrams) || weightGrams < 50 || weightGrams > 30_000) throw new OrderActionError("Weight: 50 to 30,000 grams.");
  if (!Number.isInteger(pieces) || pieces < 1 || pieces > 20) throw new OrderActionError("Pieces: 1 to 20.");
  return { weightGrams, pieces };
}

/** Everything the courier needs, read from the order. Throws OrderActionError with what to fix. */
export function bookingInput(db: DB | Tx, orderId: string, courier: ApiCourier, opts: BookOptions = {}): { order: Order; input: BookingInput } {
  const { weightGrams, pieces } = cleanWeight(opts);
  const o = load(db, orderId);
  if (o.fulfillmentStatus === "CANCELLED") throw new OrderActionError("This order is cancelled.");
  if (o.fulfillmentStatus === "CONFIRMED") throw new OrderActionError("Mark the order packed before booking the courier.");
  if (o.fulfillmentStatus === "NEW") throw new OrderActionError("Confirm the payment first.");
  if (o.fulfillmentStatus !== "PACKED") throw new OrderActionError("This order is already with a courier.");
  if (!payable(o)) throw new OrderActionError("Confirm the payment before booking.");
  const a = o.shippingAddress;
  if (!a || !o.guestPhone) throw new OrderActionError("This order has no delivery address or phone.");
  const zone = o.cityId ? db.select().from(deliveryZones).where(eq(deliveryZones.id, o.cityId)).get() : undefined;
  if (!zone) throw new OrderActionError("This order has no delivery city.");
  const map = db.select().from(courierCities).where(and(eq(courierCities.courier, courier), eq(courierCities.cityId, zone.id))).get();
  if (!map) throw new OrderActionError(`${zone.city} isn’t matched to a ${courierName(courier)} city yet — open Online orders → Couriers and load the city list.`);
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).all();
  const contents = items
    .map((i) => `${i.quantity} × ${i.productSnapshot.brand} ${i.productSnapshot.model} screen`)
    .join("; ")
    .slice(0, 200);
  const cod = o.paymentMethod === "COD" ? o.totalPaisa : 0;
  return {
    order: o,
    input: {
      orderCode: o.code,
      name: (o.guestName ?? a.name).slice(0, 80),
      phone: localPhone(o.guestPhone),
      email: o.guestEmail,
      address: [a.line1, a.line2, a.area, a.city, a.postalCode].filter(Boolean).join(", ").slice(0, 250),
      city: { code: map.courierCityCode, name: map.courierCityName },
      codPaisa: cod,
      weightGrams,
      pieces,
      contents,
      instructions: `Mobile phone screen — fragile, handle with care. Order ${o.code}. ${cod ? `Collect ${formatMoney(paisa(cod))}.` : "Paid in advance — collect nothing."}`.slice(0, 250),
    },
  };
}

const booking = new Set<string>(); // one booking per order at a time (single server process, spec §6.2)

export type BookResult = { code: string; cn: string; labelUrl: string | null };

/**
 * Books the parcel through the courier's API, then saves the shipment: PACKED → BOOKED.
 * If the order changed while the courier was answering (another person dispatched or cancelled it),
 * the new courier booking is cancelled again and nothing is saved.
 */
export async function bookWithCourier(db: DB, orderId: string, courier: ApiCourier, opts: BookOptions & { actorId: string }, ctx: AuditContext, deps: CourierDeps, now: Date = new Date()): Promise<BookResult> {
  if (!deps.isConfigured(courier)) throw new OrderActionError(`${courierName(courier)} isn’t connected yet (no API keys in the environment file). Book on the courier’s portal and use “Dispatch with a CN” instead.`);
  if (booking.has(orderId)) throw new OrderActionError("This order is being booked right now — wait a moment and refresh.");
  booking.add(orderId);
  try {
    const { order, input } = bookingInput(db, orderId, courier, opts);
    let result: { cn: string; labelUrl: string | null };
    try {
      result = await deps.provider(courier).book(input);
    } catch (e) {
      if (e instanceof CourierError) {
        withStockTransaction(db, (tx) => writeAudit(tx, ctx, { actorId: opts.actorId, action: "order.booking_failed", entity: "orders", entityId: order.id, after: { courier, error: e.message } }));
        throw new OrderActionError(e.message);
      }
      throw e;
    }
    try {
      withStockTransaction(db, (tx) => {
        const o = load(tx, orderId);
        if (o.fulfillmentStatus !== "PACKED") throw new OrderActionError("The order changed while the courier was booking it.");
        tx.insert(shipments)
          .values({
            orderId: o.id,
            courier,
            cnNumber: result.cn,
            labelUrl: result.labelUrl,
            weightGrams: input.weightGrams,
            pieces: input.pieces,
            codAmountPaisa: input.codPaisa,
            status: "BOOKED",
            bookedVia: "API",
            bookedAt: now.toISOString(),
            createdBy: opts.actorId,
          })
          .run();
        tx.update(orders).set({ fulfillmentStatus: "BOOKED" }).where(eq(orders.id, o.id)).run();
        writeAudit(tx, ctx, { actorId: opts.actorId, action: "order.booked", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "BOOKED", courier, cn: result.cn, via: "API", weightGrams: input.weightGrams, pieces: input.pieces, codPaisa: input.codPaisa } });
      });
    } catch (e) {
      // Saved nothing: undo the courier booking so the parcel isn't booked twice
      let undone = false;
      try {
        await deps.provider(courier).cancel(result.cn);
        undone = true;
      } catch {
        /* reported below */
      }
      const why = e instanceof OrderActionError ? e.message : "Saving the booking failed.";
      throw new OrderActionError(`${why} ${undone ? `The ${courierName(courier)} booking ${result.cn} was cancelled again.` : `Cancel ${courierName(courier)} booking ${result.cn} on the courier’s portal.`}`);
    }
    return { code: order.code, ...result };
  } finally {
    booking.delete(orderId);
  }
}

/** Books several packed orders one after another; each succeeds or fails on its own. */
export type BulkBookResult = ({ orderId: string; ok: true } & BookResult) | { orderId: string; ok: false; code: string; error: string };
export async function bookManyWithCourier(db: DB, orderIds: string[], courier: ApiCourier, opts: BookOptions & { actorId: string }, ctx: AuditContext, deps: CourierDeps): Promise<BulkBookResult[]> {
  const out: BulkBookResult[] = [];
  for (const id of orderIds.slice(0, 50)) {
    try {
      out.push({ orderId: id, ok: true, ...(await bookWithCourier(db, id, courier, opts, ctx, deps)) });
    } catch (e) {
      if (!(e instanceof OrderActionError)) throw e;
      const code = db.select({ code: orders.code }).from(orders).where(eq(orders.id, id)).get()?.code ?? id;
      out.push({ orderId: id, ok: false, code, error: e.message });
    }
  }
  return out;
}

// ---- Cancel a booking ---------------------------------------------------------------------------

/** Courier hasn't picked the parcel up yet: cancel the booking (through the API if it was booked there). BOOKED → PACKED. */
export async function cancelBooking(db: DB, orderId: string, input: { actorId: string }, ctx: AuditContext, deps: CourierDeps, now: Date = new Date()) {
  const o = load(db, orderId);
  if (o.fulfillmentStatus !== "BOOKED") throw new OrderActionError(o.fulfillmentStatus === "IN_TRANSIT" ? "The courier already has the parcel — it can’t be cancelled now. Wait for it to come back, then receive the returned parcel." : "This order has no courier booking to cancel.");
  const ship = activeShipment(db, orderId);
  if (!ship) throw new OrderActionError("This order has no courier booking to cancel.");
  if (ship.status !== "BOOKED") throw new OrderActionError("The courier already has the parcel — it can’t be cancelled now.");
  let courierCancelled = false;
  if (ship.bookedVia === "API" && isApiCourier(ship.courier) && ship.cnNumber) {
    if (!deps.isConfigured(ship.courier)) throw new OrderActionError(`${courierName(ship.courier)} isn’t connected (no API keys) — cancel the booking on the courier’s portal first.`);
    try {
      await deps.provider(ship.courier).cancel(ship.cnNumber);
      courierCancelled = true;
    } catch (e) {
      if (e instanceof CourierError) throw new OrderActionError(`${e.message} Nothing was changed.`);
      throw e;
    }
  }
  return withStockTransaction(db, (tx) => {
    const fresh = load(tx, orderId);
    const s = tx.select().from(shipments).where(eq(shipments.id, ship.id)).get()!;
    if (fresh.fulfillmentStatus !== "BOOKED" || s.status !== "BOOKED") throw new OrderActionError("The order changed meanwhile — refresh the page.");
    tx.update(shipments).set({ status: "CANCELLED", cancelledAt: now.toISOString() }).where(eq(shipments.id, s.id)).run();
    tx.update(orders).set({ fulfillmentStatus: "PACKED" }).where(eq(orders.id, fresh.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "order.booking_cancelled", entity: "orders", entityId: fresh.id, before: snap(fresh), after: { fulfillmentStatus: "PACKED", courier: s.courier, cn: s.cnNumber, courierCancelled } });
    return { code: fresh.code, cn: s.cnNumber, courierCancelled, manual: s.bookedVia === "MANUAL" };
  });
}

// ---- With the courier: on the way, delivered --------------------------------------------------

/** BOOKED → IN_TRANSIT (staff saw the courier collect it, or the tracking says so). */
export function markInTransit(db: DB, orderId: string, input: { actorId: string }, ctx: AuditContext) {
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (o.fulfillmentStatus !== "BOOKED") {
      if (o.fulfillmentStatus === "IN_TRANSIT") throw new OrderActionError("This order is already on the way.");
      notWithCourierYet(o, "book it first");
    }
    const s = activeShipment(tx, o.id);
    if (s && SHIPMENT_RANK[s.status] < SHIPMENT_RANK.IN_TRANSIT) tx.update(shipments).set({ status: "IN_TRANSIT" }).where(eq(shipments.id, s.id)).run();
    tx.update(orders).set({ fulfillmentStatus: "IN_TRANSIT" }).where(eq(orders.id, o.id)).run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "order.in_transit", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "IN_TRANSIT" } });
    return o.code;
  });
}

/**
 * Delivered, inside an open transaction (shared by staff, the tracking sync and COD remittance):
 * shipment DELIVERED; COD → "collected by the courier"; warranty starts today (Q68).
 */
function deliverInTx(tx: Tx, o: Order, at: Date) {
  const s = activeShipment(tx, o.id);
  if (s) tx.update(shipments).set({ status: "DELIVERED", deliveredAt: at.toISOString() }).where(eq(shipments.id, s.id)).run();
  const cod = o.paymentMethod === "COD";
  tx.update(orders)
    .set({ fulfillmentStatus: "DELIVERED", ...(cod && o.paymentStatus === "COD_PENDING" ? { paymentStatus: "COD_COLLECTED" as const } : {}) })
    .where(eq(orders.id, o.id))
    .run();
  if (cod) tx.update(payments).set({ status: "PENDING" }).where(and(eq(payments.orderId, o.id), eq(payments.status, "INITIATED"))).run();
  // Warranty from the delivery date (spec §4.8 warranty_until; used by M11 Returns)
  for (const i of tx
    .select({ id: orderItems.id, days: products.warrantyDays })
    .from(orderItems)
    .innerJoin(productVariants, eq(productVariants.id, orderItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(orderItems.orderId, o.id))
    .all()) {
    tx.update(orderItems)
      .set({ warrantyUntil: i.days > 0 ? new Date(at.getTime() + i.days * 86_400_000).toISOString() : null })
      .where(eq(orderItems.id, i.id))
      .run();
  }
  return { cod, shipment: s ?? null };
}

/** BOOKED / IN_TRANSIT → DELIVERED. */
export function markDelivered(db: DB, orderId: string, input: { actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (!(WITH_COURIER as readonly string[]).includes(o.fulfillmentStatus)) notWithCourierYet(o, "it can’t be delivered yet");
    const { cod } = deliverInTx(tx, o, now);
    writeAudit(tx, ctx, { actorId: input.actorId, action: "order.delivered", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "DELIVERED", ...(cod ? { paymentStatus: "COD_COLLECTED" } : {}) } });
    return { code: o.code, cod, codPaisa: cod ? o.totalPaisa : 0 };
  });
}

// ---- Parcel came back to the shop (RTO) -------------------------------------------------------

export type ReturnInput = {
  /** order_items.id → how many go back on sale (0…quantity). Items not listed: all back on sale. */
  restock: Record<string, number>;
  note: string;
  refundConfirmed?: boolean;
  actorId: string;
};

/**
 * The courier brought the parcel back and staff have checked it (spec §9 "Receive RTO", Q69).
 * Items in good condition go back on sale through the stock engine (ORDER_CANCEL_RESTOCK); damaged
 * ones stay off sale (they already left stock when the order was placed) and are noted.
 */
export function receiveReturnedParcel(db: DB, orderId: string, input: ReturnInput, ctx: AuditContext, now: Date = new Date()) {
  const note = input.note
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 300);
  return withStockTransaction(db, (tx) => {
    const o = load(tx, orderId);
    if (!(WITH_COURIER as readonly string[]).includes(o.fulfillmentStatus)) notWithCourierYet(o, "there’s nothing to receive back");
    const items = tx.select().from(orderItems).where(eq(orderItems.orderId, o.id)).all();
    let restocked = 0;
    let keptOff = 0;
    for (const item of items) {
      const want = input.restock[item.id] ?? item.quantity;
      if (!Number.isInteger(want) || want < 0 || want > item.quantity) throw new OrderActionError(`Back on sale: 0 to ${item.quantity} for ${item.productSnapshot.brand} ${item.productSnapshot.model}.`);
      if (want > 0)
        applyStockMovement(tx, {
          variantId: item.variantId,
          delta: want,
          type: "ORDER_CANCEL_RESTOCK",
          referenceType: "ORDER",
          referenceId: o.id,
          operatorId: input.actorId,
          unitCostPaisa: item.unitCostPaisa,
          notes: `${o.code}: returned by the courier (RTO)${note ? ` — ${note}` : ""}`.slice(0, 300),
        });
      restocked += want;
      keptOff += item.quantity - want;
    }
    if (keptOff > 0 && note.length < 3) throw new OrderActionError("Write what was wrong with the items you’re keeping off sale.");
    const refundDue = o.paymentStatus === "PAID";
    if (refundDue && !input.refundConfirmed) throw new OrderActionError("This order was paid in advance. Tick “I will refund the customer” to receive it back.");
    const s = activeShipment(tx, o.id);
    if (s) tx.update(shipments).set({ status: "RETURNED_TO_ORIGIN", rtoAt: now.toISOString() }).where(eq(shipments.id, s.id)).run();
    const paymentStatus = refundDue ? ("REFUNDED" as const) : o.paymentMethod === "COD" ? ("FAILED" as const) : o.paymentStatus;
    tx.update(orders).set({ fulfillmentStatus: "RETURNED_TO_ORIGIN", paymentStatus }).where(eq(orders.id, o.id)).run();
    tx.update(payments)
      .set({ status: refundDue ? "REFUNDED" : "FAILED" })
      .where(eq(payments.orderId, o.id))
      .run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "order.returned_to_origin", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "RETURNED_TO_ORIGIN", paymentStatus, restocked, keptOff, note: note || null, refundDue } });
    return { code: o.code, restocked, keptOff, refundDue };
  });
}

// ---- Tracking -----------------------------------------------------------------------------------

/**
 * Applies one tracking answer. The shipment only moves forward; the order follows:
 * picked up / on the way / out for delivery / coming back → IN_TRANSIT, delivered → DELIVERED.
 * A return is only flagged — stock comes back when staff receive the parcel (Q69, Q70).
 */
export function applyTracking(db: DB, shipmentId: string, t: TrackingResult, ctx: AuditContext, now: Date = new Date()) {
  return withStockTransaction(db, (tx) => {
    const s = tx.select().from(shipments).where(eq(shipments.id, shipmentId)).get();
    if (!s) return { changed: false as const };
    const text = t.text.slice(0, 200) || s.lastTrackingEvent;
    tx.update(shipments).set({ lastTrackingEvent: text, trackingCheckedAt: now.toISOString() }).where(eq(shipments.id, s.id)).run();
    if (!t.status || TERMINAL_SHIPMENT.includes(s.status) || t.status === "RETURNED_TO_ORIGIN" || t.status === "CANCELLED") return { changed: false as const };
    if (SHIPMENT_RANK[t.status] <= SHIPMENT_RANK[s.status]) return { changed: false as const };
    const o = tx.select().from(orders).where(eq(orders.id, s.orderId)).get();
    if (!o || !(WITH_COURIER as readonly string[]).includes(o.fulfillmentStatus)) return { changed: false as const };
    tx.update(shipments).set({ status: t.status }).where(eq(shipments.id, s.id)).run();
    if (t.status === "DELIVERED") {
      deliverInTx(tx, o, now);
      writeAudit(tx, ctx, { actorId: SYSTEM_USER_ID, action: "order.delivered", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "DELIVERED", courierSays: text, by: "tracking" } });
      return { changed: true as const, orderStatus: "DELIVERED" as const, returning: false };
    }
    if (o.fulfillmentStatus === "BOOKED") {
      tx.update(orders).set({ fulfillmentStatus: "IN_TRANSIT" }).where(eq(orders.id, o.id)).run();
      writeAudit(tx, ctx, { actorId: SYSTEM_USER_ID, action: "order.in_transit", entity: "orders", entityId: o.id, before: snap(o), after: { fulfillmentStatus: "IN_TRANSIT", courierSays: text, by: "tracking" } });
    }
    return { changed: true as const, orderStatus: "IN_TRANSIT" as const, returning: t.status === "RETURN_IN_PROGRESS" };
  });
}

export type SyncSummary = { checked: number; updated: number; delivered: string[]; returning: string[]; errors: string[] };

/**
 * Asks Leopards / PostEx about every open shipment (cron every 2 h, or "Refresh tracking").
 * Couriers without keys are skipped. Network calls happen before any transaction.
 */
export async function syncTracking(db: DB, deps: CourierDeps, opts: { orderIds?: string[] } = {}, ctx: AuditContext = { ip: "cron", userAgent: null }, now: Date = new Date()): Promise<SyncSummary> {
  const rows = db
    .select({ id: shipments.id, courier: shipments.courier, cn: shipments.cnNumber, code: orders.code })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .where(
      and(
        inArray(shipments.courier, [...API_COURIERS]),
        notInArray(shipments.status, TERMINAL_SHIPMENT),
        isNotNull(shipments.cnNumber),
        inArray(orders.fulfillmentStatus, [...WITH_COURIER]),
        opts.orderIds ? inArray(orders.id, opts.orderIds) : undefined,
      ),
    )
    .all();
  const summary: SyncSummary = { checked: 0, updated: 0, delivered: [], returning: [], errors: [] };
  for (const courier of API_COURIERS) {
    const mine = rows.filter((r) => r.courier === courier);
    if (!mine.length) continue;
    if (!deps.isConfigured(courier)) {
      if (opts.orderIds) summary.errors.push(`${courierName(courier)} isn’t connected (no API keys) — check the tracking on the courier’s website.`);
      continue;
    }
    let results: Map<string, TrackingResult>;
    try {
      results = await deps.provider(courier).track(mine.map((r) => r.cn!));
    } catch (e) {
      if (e instanceof CourierError) {
        summary.errors.push(e.message);
        continue;
      }
      throw e;
    }
    for (const r of mine) {
      const t = results.get(r.cn!.toUpperCase());
      if (!t) continue;
      summary.checked += 1;
      const res = applyTracking(db, r.id, t, ctx, now);
      if (res.changed) {
        summary.updated += 1;
        if (res.orderStatus === "DELIVERED") summary.delivered.push(r.code);
        if (res.returning) summary.returning.push(r.code);
      }
    }
  }
  return summary;
}

// ---- Load sheets ----------------------------------------------------------------------------------

/** LS-261017-01: Karachi date + that day's running number. */
function nextLoadSheetCode(tx: Tx, now: Date) {
  const prefix = `LS-${karachiDate(now).slice(2).replaceAll("-", "")}-`;
  const last = tx.select({ code: loadSheets.code }).from(loadSheets).where(like(loadSheets.code, `${prefix}%`)).orderBy(desc(loadSheets.code)).get();
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(2, "0")}`;
}

/**
 * One load sheet for parcels handed to one courier's rider: every order must be booked with that
 * courier and not yet on another load sheet.
 */
export function createLoadSheet(db: DB, input: { courier: string; orderIds: string[]; actorId: string }, ctx: AuditContext, now: Date = new Date()) {
  const courier = input.courier as Courier;
  if (!(COURIERS as readonly string[]).includes(courier)) throw new OrderActionError("Choose the courier.");
  const ids = [...new Set(input.orderIds)].slice(0, 200);
  if (!ids.length) throw new OrderActionError("Tick the parcels the rider is taking.");
  return withStockTransaction(db, (tx) => {
    const list = tx
      .select({ ship: shipments, code: orders.code, status: orders.fulfillmentStatus })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .where(and(inArray(shipments.orderId, ids), sql`${shipments.status} <> 'CANCELLED'`))
      .all();
    const byOrder = new Map(list.map((r) => [r.ship.orderId, r]));
    const problems: string[] = [];
    for (const id of ids) {
      const r = byOrder.get(id);
      const code = r?.code ?? tx.select({ code: orders.code }).from(orders).where(eq(orders.id, id)).get()?.code ?? "?";
      if (!r || r.status !== "BOOKED") problems.push(`${code} isn’t booked and waiting for pickup`);
      else if (r.ship.courier !== courier) problems.push(`${code} is booked with ${courierName(r.ship.courier)}`);
      else if (r.ship.loadsheetId) problems.push(`${code} is already on a load sheet`);
    }
    if (problems.length) throw new OrderActionError(`No load sheet made: ${problems.slice(0, 5).join("; ")}.`);
    const ships = ids.map((id) => byOrder.get(id)!.ship);
    const id = crypto.randomUUID();
    const code = nextLoadSheetCode(tx, now);
    const codTotal = ships.reduce((sum, s) => sum + s.codAmountPaisa, 0);
    tx.insert(loadSheets).values({ id, code, courier, parcels: ships.length, codTotalPaisa: codTotal, createdBy: input.actorId, createdAt: now.toISOString() }).run();
    tx.update(shipments)
      .set({ loadsheetId: id })
      .where(
        and(
          inArray(
            shipments.id,
            ships.map((s) => s.id),
          ),
          isNull(shipments.loadsheetId),
        ),
      )
      .run();
    writeAudit(tx, ctx, { actorId: input.actorId, action: "load_sheet.create", entity: "load_sheets", entityId: id, after: { code, courier, parcels: ships.length, codTotalPaisa: codTotal } });
    return { id, code };
  });
}

export function loadSheetDetails(db: DB, id: string) {
  const sheet = db.select().from(loadSheets).where(eq(loadSheets.id, id)).get();
  if (!sheet) return null;
  const parcels = db
    .select({ cn: shipments.cnNumber, cod: shipments.codAmountPaisa, pieces: shipments.pieces, weight: shipments.weightGrams, code: orders.code, name: orders.guestName, address: orders.shippingAddress })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .where(eq(shipments.loadsheetId, id))
    .orderBy(orders.code)
    .all();
  return { sheet, parcels };
}

export function recentLoadSheets(db: DB, limit = 20) {
  return db.select().from(loadSheets).orderBy(desc(loadSheets.createdAt), desc(loadSheets.code)).limit(limit).all();
}
