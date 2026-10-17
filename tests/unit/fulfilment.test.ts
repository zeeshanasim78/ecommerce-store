import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, courierCities, deliveryZones, orderItems, orders, payments, products, productVariants, shipments, stockLedger, SYSTEM_USER_ID, user } from "@/db/schema";
import { classifyStatus, courierProvider, liveCourierDeps, readCourierConfig, type CourierDeps } from "@/server/couriers";
import { loadCourierCities, matchCity, setCourierCity } from "@/server/couriers/city-map";
import { localPhone } from "@/server/couriers/types";
import { findLedgerDrift } from "@/server/inventory/stock";
import { cancelOrder, confirmPayment, dispatchOrder, listOrders, orderCounts } from "@/server/orders/admin-orders";
import { placeOrder, type CheckoutInput } from "@/server/orders/checkout";
import { codOutstanding, confirmRemittance, discardRemittance, parseRemittanceCsv, remittanceDetails, rupeesToPaisa, uploadRemittance } from "@/server/orders/cod-remittance";
import { activeShipment, bookManyWithCourier, bookWithCourier, cancelBooking, createLoadSheet, loadSheetDetails, markDelivered, markInTransit, markPacked, receiveReturnedParcel, syncTracking } from "@/server/orders/fulfilment";
import { loadCustomerOrder } from "@/server/orders/order-details";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { writeSetting } from "@/server/settings/store-settings";
import { FAKE_LEOPARDS_KEY, FAKE_LEOPARDS_PASSWORD, FAKE_POSTEX_TOKEN, startFakeCourier, type FakeCourier } from "../helpers/fake-courier";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** v1.15 — Milestone 10 Phase B: couriers, delivery, returns to origin, load sheets, COD remittance (SPECIFICATION §27). */

let db: DB;
let lahore: string;
let fake: FakeCourier;
const CTX = { ip: "1.2.3.4", userAgent: "test" };
const STAFF = "staff-1";

beforeAll(async () => {
  fake = await startFakeCourier();
});
afterAll(() => fake.close());

const ENV = () => ({ LEOPARDS_API_KEY: FAKE_LEOPARDS_KEY, LEOPARDS_API_PASSWORD: FAKE_LEOPARDS_PASSWORD, POSTEX_API_TOKEN: FAKE_POSTEX_TOKEN, COURIER_TEST_BASE_URL: fake.url });
const deps = (): CourierDeps => liveCourierDeps(ENV());
const noKeys = (): CourierDeps => liveCourierDeps({});

function published(stock: number, suffix = "1") {
  const ids = createVariant(db, stock, suffix); // Rs 1,500 each
  db.update(products).set({ isPublished: true, warrantyDays: 30 }).where(eq(products.id, ids.productId)).run();
  return ids.variantId;
}
const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const orderRow = (id: string) => db.select().from(orders).where(eq(orders.id, id)).get()!;
const actions = (id: string) =>
  db
    .select({ a: adminAuditLog.action })
    .from(adminAuditLog)
    .where(and(eq(adminAuditLog.entity, "orders"), eq(adminAuditLog.entityId, id)))
    .all()
    .map((r) => r.a);
const form = (variantId: string, extra: Partial<CheckoutInput> = {}): CheckoutInput => ({
  idempotencyKey: crypto.randomUUID(),
  name: "Ayesha Khan",
  phone: "0300 1234567",
  email: "ayesha@example.com",
  line1: "House 12, Street 4, Gulberg III",
  cityId: lahore,
  method: "COD",
  lines: [{ variantId, qty: 1 }],
  ...extra,
});
function place(v: string, extra: Partial<CheckoutInput> = {}) {
  const r = placeOrder(db, form(v, extra));
  if (!r.ok) throw new Error(r.message);
  return r;
}
async function mapCities() {
  await loadCourierCities(db, "LEOPARDS", deps(), { actorId: STAFF }, CTX);
  await loadCourierCities(db, "POSTEX", deps(), { actorId: STAFF }, CTX);
}
/** COD order, packed and booked with Leopards through the fake courier. */
async function bookedCod(v: string, extra: Partial<CheckoutInput> = {}) {
  const r = place(v, extra);
  markPacked(db, r.orderId, { actorId: STAFF }, CTX);
  const b = await bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, deps());
  return { ...r, cn: b.cn };
}

const savedEnv = Object.fromEntries(PAYMENT_ENV_KEYS.map((k) => [k, process.env[k]]));
beforeEach(() => {
  db = testDb();
  fake.requests.length = 0;
  lahore = crypto.randomUUID();
  db.insert(deliveryZones).values({ id: lahore, city: "Lahore", province: "Punjab", shippingFeePaisa: 25_000, codFeePaisa: 5_000, etaMinDays: 1, etaMaxDays: 2, mapX: 1, mapY: 1 }).run();
  db.insert(deliveryZones).values({ city: "Sialkot", province: "Punjab", shippingFeePaisa: 30_000, etaMinDays: 2, etaMaxDays: 3, mapX: 2, mapY: 2 }).run();
  db.insert(user).values({ id: STAFF, name: "Mona Manager", email: "m@caidea.test", role: "MANAGER", isActive: true }).run();
  writeSetting(db, "enabled_payment_methods", ["COD", "JAZZCASH", "BANK_TRANSFER"], SYSTEM_USER_ID);
  for (const k of PAYMENT_ENV_KEYS) delete process.env[k];
  Object.assign(process.env, { COD_MAX_ORDER_PKR: "20000", JAZZCASH_ACCOUNT_TITLE: "Caidea Traders", JAZZCASH_ACCOUNT_NUMBER: "0300-1112223", BANK_NAME: "Meezan Bank", BANK_ACCOUNT_TITLE: "Caidea Traders", BANK_IBAN: "PK40MEZN0000001123456702" });
});
afterEach(() => {
  for (const k of PAYMENT_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

// ---------------------------------------------------------------------------------------------

describe("courier settings (environment file)", () => {
  it("off without keys; Leopards defaults to its staging server; keys never appear in the config", () => {
    expect(readCourierConfig("LEOPARDS", {}).configured).toBe(false);
    expect(readCourierConfig("POSTEX", {}).configured).toBe(false);
    const leo = readCourierConfig("LEOPARDS", { LEOPARDS_API_KEY: "ABCDEF123456", LEOPARDS_API_PASSWORD: "secret-pass" });
    expect(leo).toMatchObject({ configured: true, mode: "staging", baseUrl: "https://merchantapistaging.leopardscourier.com/api/" });
    expect(leo.warnings.join(" ")).toMatch(/STAGING/);
    expect(JSON.stringify(leo)).not.toMatch(/ABCDEF123456|secret-pass/);
    expect(readCourierConfig("LEOPARDS", { LEOPARDS_API_KEY: "ABCDEF123456", LEOPARDS_API_PASSWORD: "x", LEOPARDS_MODE: "live" }).baseUrl).toBe("https://merchantapi.leopardscourier.com/api/");
    expect(readCourierConfig("LEOPARDS", { LEOPARDS_API_KEY: "ABCDEF123456" })).toMatchObject({ configured: false, problems: [expect.stringMatching(/PASSWORD is empty/)] });
    expect(readCourierConfig("POSTEX", { POSTEX_API_TOKEN: FAKE_POSTEX_TOKEN })).toMatchObject({ configured: true, mode: "live", baseUrl: "https://api.postex.pk/services/integration/api/order/" });
  });

  it("the test courier must be on this machine — anything else is ignored", () => {
    const evil = readCourierConfig("POSTEX", { POSTEX_API_TOKEN: FAKE_POSTEX_TOKEN, COURIER_TEST_BASE_URL: "http://attacker.example:4010" });
    expect(evil.baseUrl).toBe("https://api.postex.pk/services/integration/api/order/");
    expect(evil.problems.join(" ")).toMatch(/only for automated tests/);
    const ok = readCourierConfig("POSTEX", { POSTEX_API_TOKEN: FAKE_POSTEX_TOKEN, COURIER_TEST_BASE_URL: "http://127.0.0.1:4010" });
    expect(ok).toMatchObject({ mode: "test", baseUrl: "http://127.0.0.1:4010/postex/" });
    expect(ok.warnings.join(" ")).toMatch(/TEST courier/);
  });

  it("courier wording → our shipment status", () => {
    const cases: [string, string | null][] = [
      ["Pickup Request not Send", "BOOKED"],
      ["Unbooked", "BOOKED"],
      ["Consignment Booked", "BOOKED"],
      ["At PostEx Warehouse", "PICKED_UP"],
      ["Arrived at Station", "IN_TRANSIT"],
      ["Package on Route", "IN_TRANSIT"],
      ["Delivery Under Review", "IN_TRANSIT"],
      ["Attempt Made", "IN_TRANSIT"],
      ["Out for Delivery", "OUT_FOR_DELIVERY"],
      ["Delivered", "DELIVERED"],
      ["DELIVERED", "DELIVERED"],
      ["Returned to Shipper", "RETURN_IN_PROGRESS"],
      ["Being Return", "RETURN_IN_PROGRESS"],
      ["Delivered to shipper", "RETURN_IN_PROGRESS"],
      ["Cancelled", null],
      ["Something new", null],
      ["", null],
    ];
    for (const [text, want] of cases) expect([text, classifyStatus(text)]).toEqual([text, want]);
    expect(localPhone("+923001234567")).toBe("03001234567");
  });
});

describe("adapters against the test courier (real HTTP)", () => {
  it("Leopards: cities, book, track, cancel — and a wrong key is a plain message", async () => {
    const leo = courierProvider("LEOPARDS", ENV());
    expect((await leo.cities()).find((c) => c.name === "Lahore")).toEqual({ code: "789", name: "Lahore" });
    const b = await leo.book({ orderCode: "CA-ORD-1", name: "A", phone: "03001234567", email: null, address: "House 1, Lahore", city: { code: "789", name: "Lahore" }, codPaisa: 155_000, weightGrams: 500, pieces: 1, contents: "1 × screen", instructions: "Fragile" });
    expect(b.cn).toMatch(/^LE\d+$/);
    expect(b.labelUrl).toMatch(/^https:\/\//);
    const sent = fake.requests.find((r) => r.path.includes("bookPacket"))!.body!;
    expect(sent).toMatchObject({ booked_packet_collect_amount: 1550, destination_city: 789, consignment_phone: "03001234567", booked_packet_order_id: "CA-ORD-1" });
    expect(JSON.stringify(fake.requests)).not.toContain(FAKE_LEOPARDS_KEY); // keys never recorded
    fake.setStatus(b.cn, "Arrived at Station");
    expect((await leo.track([b.cn])).get(b.cn)).toMatchObject({ status: "IN_TRANSIT", text: "Arrived at Station" });
    await expect(leo.cancel(b.cn)).rejects.toThrow(/already picked up/);
    const wrong = courierProvider("LEOPARDS", { ...ENV(), LEOPARDS_API_PASSWORD: "wrong" });
    await expect(wrong.cities()).rejects.toThrow(/Leopards: Invalid API Key or Password/);
  });

  it("PostEx: book (prepaid = 0 to collect), track, cancel, airway bill and load sheet PDFs", async () => {
    const px = courierProvider("POSTEX", ENV());
    const b = await px.book({ orderCode: "CA-ORD-2", name: "B", phone: "03001234567", email: null, address: "House 2", city: { code: "Karachi", name: "Karachi" }, codPaisa: 0, weightGrams: 500, pieces: 2, contents: "2 × screen", instructions: "Fragile" });
    expect(fake.requests.find((r) => r.path.endsWith("create-order"))!.body).toMatchObject({ invoicePayment: 0, cityName: "Karachi", items: 2, orderType: "Normal", orderRefNumber: "CA-ORD-2" });
    expect((await px.track([b.cn])).get(b.cn)).toMatchObject({ status: "BOOKED" });
    const label = await px.labelPdf!([b.cn]);
    expect(Buffer.from(label.pdf.slice(0, 4)).toString()).toBe("%PDF");
    expect((await px.loadSheet!([b.cn])).file!.fileName).toMatch(/load-sheet/);
    await px.cancel(b.cn);
    await expect(courierProvider("POSTEX", { ...ENV(), POSTEX_API_TOKEN: "WRONGTOKEN-0123456789" }).cities()).rejects.toThrow(/refused the API key/);
  });

  it("a courier error page is reported without leaking the request", async () => {
    await fetch(`${fake.url}/__control/fail`, { method: "POST", body: JSON.stringify({ times: 1 }) });
    await expect(courierProvider("LEOPARDS", ENV()).cities()).rejects.toThrow(/Leopards answered 500: Internal error/);
  });
});

describe("city matching", () => {
  it("matches by name, keeps staff choices, lists what it couldn't match", async () => {
    expect(matchCity("Lahore", [{ code: "1", name: "LAHORE" }])?.code).toBe("1");
    expect(matchCity("D.G. Khan", [{ code: "9", name: "DG Khan" }])?.code).toBe("9");
    expect(matchCity("Sialkot", [{ code: "1", name: "Lahore" }])).toBeNull();
    const r = await loadCourierCities(db, "LEOPARDS", deps(), { actorId: STAFF }, CTX);
    expect(r).toMatchObject({ matched: 1, unmatched: ["Sialkot"] });
    setCourierCity(db, "LEOPARDS", lahore, "475", { actorId: STAFF }, CTX); // staff override (wrong on purpose)
    await loadCourierCities(db, "LEOPARDS", deps(), { actorId: STAFF }, CTX);
    expect(db.select().from(courierCities).where(eq(courierCities.cityId, lahore)).get()).toMatchObject({ courierCityCode: "475", source: "MANUAL" });
    expect(() => setCourierCity(db, "LEOPARDS", lahore, "99999", { actorId: STAFF }, CTX)).toThrow(/Pick a city from the courier’s list/);
    await expect(loadCourierCities(db, "POSTEX", noKeys(), { actorId: STAFF }, CTX)).rejects.toThrow(/isn’t connected/);
  });
});

describe("NEW → CONFIRMED → PACKED → BOOKED → IN_TRANSIT → DELIVERED (BUILD_GUIDE M10 done-when)", () => {
  it("a prepaid order goes through every step, each in its history; warranty starts on delivery", async () => {
    await mapCities();
    const v = published(5);
    const r = place(v, { method: "BANK_TRANSFER" });
    expect(orderRow(r.orderId).fulfillmentStatus).toBe("NEW");
    expect(() => markPacked(db, r.orderId, { actorId: STAFF }, CTX)).toThrow(/Confirm the payment before packing/);
    confirmPayment(db, r.orderId, { actorId: STAFF }, CTX);
    await expect(bookWithCourier(db, r.orderId, "POSTEX", { actorId: STAFF }, CTX, deps())).rejects.toThrow(/Mark the order packed/);
    markPacked(db, r.orderId, { actorId: STAFF }, CTX);
    expect(() => markPacked(db, r.orderId, { actorId: STAFF }, CTX)).toThrow(/already packed/); // double click
    const b = await bookWithCourier(db, r.orderId, "POSTEX", { actorId: STAFF, weightGrams: 800, pieces: 1 }, CTX, deps());
    expect(activeShipment(db, r.orderId)).toMatchObject({ courier: "POSTEX", cnNumber: b.cn, bookedVia: "API", codAmountPaisa: 0, weightGrams: 800, status: "BOOKED" });
    expect(fake.requests.at(-1)!.body).toMatchObject({ invoicePayment: 0 }); // paid in advance: courier collects nothing
    markInTransit(db, r.orderId, { actorId: STAFF }, CTX);
    const at = new Date("2026-10-20T08:00:00Z");
    markDelivered(db, r.orderId, { actorId: STAFF }, CTX, at);
    expect(orderRow(r.orderId)).toMatchObject({ fulfillmentStatus: "DELIVERED", paymentStatus: "PAID" });
    expect(db.select().from(orderItems).where(eq(orderItems.orderId, r.orderId)).get()!.warrantyUntil).toBe("2026-11-19T08:00:00.000Z");
    expect(actions(r.orderId)).toEqual(["order.payment_confirmed", "order.packed", "order.booked", "order.in_transit", "order.delivered"]);
    expect(loadCustomerOrder(db, r.orderId)!.shipment).toMatchObject({ courier: "PostEx", cn: b.cn, deliveredAt: at.toISOString() });
    expect(() => markDelivered(db, r.orderId, { actorId: STAFF }, CTX)).toThrow(/already delivered/);
  });

  it("COD: the courier collects the order total; delivery = COD collected, payment pending", async () => {
    await mapCities();
    const v = published(5);
    const r = await bookedCod(v);
    const o = orderRow(r.orderId);
    expect(activeShipment(db, r.orderId)!.codAmountPaisa).toBe(o.totalPaisa);
    expect(fake.parcels.get(r.cn)!.cod).toBe(o.totalPaisa / 100);
    markDelivered(db, r.orderId, { actorId: STAFF }, CTX);
    expect(orderRow(r.orderId).paymentStatus).toBe("COD_COLLECTED");
    expect(db.select().from(payments).where(eq(payments.orderId, r.orderId)).get()!.status).toBe("PENDING");
    expect(codOutstanding(db)).toMatchObject({ totalOwedPaisa: o.totalPaisa, owed: [{ courier: "LEOPARDS", n: 1 }] });
  });

  it("booking needs the city matched and the courier connected; a courier refusal saves nothing", async () => {
    const v = published(5);
    const r = place(v);
    markPacked(db, r.orderId, { actorId: STAFF }, CTX);
    await expect(bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, deps())).rejects.toThrow(/Lahore isn’t matched to a Leopards city/);
    await expect(bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, noKeys())).rejects.toThrow(/isn’t connected yet/);
    await mapCities();
    await expect(bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF, weightGrams: 10 }, CTX, deps())).rejects.toThrow(/Weight: 50/);
    await fetch(`${fake.url}/__control/fail`, { method: "POST", body: JSON.stringify({ times: 1 }) });
    await expect(bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, deps())).rejects.toThrow(/Leopards answered 500/);
    expect(orderRow(r.orderId).fulfillmentStatus).toBe("PACKED");
    expect(db.select().from(shipments).all()).toHaveLength(0);
    expect(actions(r.orderId)).toContain("order.booking_failed");
  });

  it("if the order changes while the courier answers, the new booking is cancelled again", async () => {
    await mapCities();
    const v = published(5);
    const r = place(v);
    markPacked(db, r.orderId, { actorId: STAFF }, CTX);
    const real = deps();
    let cancelled = "";
    const racing: CourierDeps = {
      isConfigured: () => true,
      provider: (c) => ({
        ...real.provider(c),
        async book() {
          dispatchOrder(db, r.orderId, { courier: "TCS", cn: "TCS12345", actorId: STAFF }, CTX); // someone else dispatched it meanwhile
          return { cn: "LE999", labelUrl: null };
        },
        async cancel(cn) {
          cancelled = cn;
        },
      }),
    };
    await expect(bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, racing)).rejects.toThrow(/order changed.*LE999 was cancelled again/);
    expect(cancelled).toBe("LE999");
    expect(db.select().from(shipments).all().map((s) => s.cnNumber)).toEqual(["TCS12345"]);
  });

  it("bulk booking: each order succeeds or fails on its own", async () => {
    await mapCities();
    const v = published(10);
    const a = place(v);
    const b = place(v, { phone: "0321 7654321" });
    const c = place(v, { phone: "0333 1112223" });
    markPacked(db, a.orderId, { actorId: STAFF }, CTX);
    markPacked(db, b.orderId, { actorId: STAFF }, CTX);
    const res = await bookManyWithCourier(db, [a.orderId, b.orderId, c.orderId], "LEOPARDS", { actorId: STAFF }, CTX, deps());
    expect(res.map((x) => x.ok)).toEqual([true, true, false]);
    expect(res[2]).toMatchObject({ ok: false, code: c.code, error: expect.stringMatching(/Mark the order packed/) });
    expect(orderCounts(db)).toMatchObject({ courier: 2, pack: 1, book: 0 });
  });
});

describe("cancel a booking", () => {
  it("before pickup: cancelled at the courier too, order back to Packed, can be booked again", async () => {
    await mapCities();
    const v = published(5);
    const r = await bookedCod(v);
    const res = await cancelBooking(db, r.orderId, { actorId: STAFF }, CTX, deps());
    expect(res).toMatchObject({ courierCancelled: true, cn: r.cn });
    expect(fake.parcels.get(r.cn)!.cancelled).toBe(true);
    expect(orderRow(r.orderId).fulfillmentStatus).toBe("PACKED");
    expect(activeShipment(db, r.orderId)).toBeUndefined();
    const again = await bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, deps());
    expect(again.cn).not.toBe(r.cn);
    expect(loadCustomerOrder(db, r.orderId)!.shipment!.cn).toBe(again.cn);
    // once picked up it can't be cancelled
    fake.setStatus(again.cn, "Arrived at Station");
    await syncTracking(db, deps());
    await expect(cancelBooking(db, r.orderId, { actorId: STAFF }, CTX, deps())).rejects.toThrow(/already has the parcel/);
  });

  it("a pasted CN is cancelled here only (staff cancel it on the portal); the order can then be cancelled with stock back", async () => {
    const v = published(5);
    const r = place(v);
    dispatchOrder(db, r.orderId, { courier: "TCS", cn: "TCS777", actorId: STAFF }, CTX);
    expect(await cancelBooking(db, r.orderId, { actorId: STAFF }, CTX, noKeys())).toMatchObject({ manual: true, courierCancelled: false });
    cancelOrder(db, r.orderId, { reason: "Customer changed mind", actorId: STAFF }, CTX);
    expect(stockOf(v)).toBe(5);
  });
});

describe("tracking sync", () => {
  it("moves orders forward only, marks delivered (COD collected), flags returns, skips couriers without keys", async () => {
    await mapCities();
    const v = published(10);
    const a = await bookedCod(v);
    const b = await bookedCod(v, { phone: "0321 7654321" });
    const c = place(v, { phone: "0333 1112223" });
    dispatchOrder(db, c.orderId, { courier: "TCS", cn: "TCS1", actorId: STAFF }, CTX); // TCS has no adapter
    fake.setStatus(a.cn, "Delivered");
    fake.setStatus(b.cn, "Returned to Shipper");
    const s = await syncTracking(db, deps());
    expect(s).toMatchObject({ checked: 2, updated: 2, delivered: [a.code], returning: [b.code], errors: [] });
    expect(orderRow(a.orderId)).toMatchObject({ fulfillmentStatus: "DELIVERED", paymentStatus: "COD_COLLECTED" });
    expect(orderRow(b.orderId).fulfillmentStatus).toBe("IN_TRANSIT"); // stock comes back only when staff receive it
    expect(activeShipment(db, b.orderId)).toMatchObject({ status: "RETURN_IN_PROGRESS", lastTrackingEvent: "Returned to Shipper" });
    expect(stockOf(v)).toBe(7);
    fake.setStatus(b.cn, "Arrived at Station"); // couriers' history can wobble — never backwards
    await syncTracking(db, deps());
    expect(activeShipment(db, b.orderId)!.status).toBe("RETURN_IN_PROGRESS");
    expect(actions(a.orderId).at(-1)).toBe("order.delivered");
    const audit = db.select().from(adminAuditLog).where(and(eq(adminAuditLog.entityId, a.orderId), eq(adminAuditLog.action, "order.delivered"))).get()!;
    expect(audit.actorId).toBe(SYSTEM_USER_ID);
    expect(await syncTracking(db, noKeys())).toMatchObject({ checked: 0, errors: [] });
    expect(await syncTracking(db, noKeys(), { orderIds: [b.orderId] })).toMatchObject({ errors: [expect.stringMatching(/isn’t connected/)] });
  });
});

describe("parcel returned to the shop (RTO)", () => {
  it("good items back on sale through the engine, damaged ones stay off with a note; COD payment failed", async () => {
    await mapCities();
    const v = published(10);
    const v2 = published(10, "2");
    const r = place(v, { lines: [{ variantId: v, qty: 2 }, { variantId: v2, qty: 1 }] });
    markPacked(db, r.orderId, { actorId: STAFF }, CTX);
    await bookWithCourier(db, r.orderId, "LEOPARDS", { actorId: STAFF }, CTX, deps());
    const items = db.select().from(orderItems).where(eq(orderItems.orderId, r.orderId)).all();
    const first = items.find((i) => i.variantId === v)!;
    expect(() => receiveReturnedParcel(db, r.orderId, { restock: { [first.id]: 1 }, note: "", actorId: STAFF }, CTX)).toThrow(/Write what was wrong/);
    expect(() => receiveReturnedParcel(db, r.orderId, { restock: { [first.id]: 3 }, note: "x", actorId: STAFF }, CTX)).toThrow(/0 to 2/);
    const res = receiveReturnedParcel(db, r.orderId, { restock: { [first.id]: 1 }, note: "One screen cracked in transit", actorId: STAFF }, CTX);
    expect(res).toMatchObject({ restocked: 2, keptOff: 1, refundDue: false });
    expect(stockOf(v)).toBe(9);
    expect(stockOf(v2)).toBe(10);
    expect(orderRow(r.orderId)).toMatchObject({ fulfillmentStatus: "RETURNED_TO_ORIGIN", paymentStatus: "FAILED" });
    expect(activeShipment(db, r.orderId)).toMatchObject({ status: "RETURNED_TO_ORIGIN" });
    const rows = db.select().from(stockLedger).where(and(eq(stockLedger.referenceId, r.orderId), eq(stockLedger.transactionType, "ORDER_CANCEL_RESTOCK"))).all();
    expect(rows.map((x) => x.quantityChanged).sort()).toEqual([1, 1]);
    expect(rows[0]!.operatorId).toBe(STAFF);
    expect(findLedgerDrift(db)).toEqual([]);
    expect(() => receiveReturnedParcel(db, r.orderId, { restock: {}, note: "", actorId: STAFF }, CTX)).toThrow(/already back at the shop/); // twice = once
  });

  it("a paid order needs the refund tick", async () => {
    await mapCities();
    const v = published(5);
    const r = place(v, { method: "JAZZCASH" });
    confirmPayment(db, r.orderId, { actorId: STAFF }, CTX);
    markPacked(db, r.orderId, { actorId: STAFF }, CTX);
    await bookWithCourier(db, r.orderId, "POSTEX", { actorId: STAFF }, CTX, deps());
    expect(() => receiveReturnedParcel(db, r.orderId, { restock: {}, note: "", actorId: STAFF }, CTX)).toThrow(/Tick “I will refund/);
    receiveReturnedParcel(db, r.orderId, { restock: {}, note: "", refundConfirmed: true, actorId: STAFF }, CTX);
    expect(orderRow(r.orderId).paymentStatus).toBe("REFUNDED");
    expect(stockOf(v)).toBe(5);
  });
});

describe("load sheets", () => {
  it("one courier's booked parcels, numbered per day, each parcel on one sheet only", async () => {
    await mapCities();
    const v = published(10);
    const a = await bookedCod(v);
    const b = await bookedCod(v, { phone: "0321 7654321" });
    const c = place(v, { phone: "0333 1112223" });
    dispatchOrder(db, c.orderId, { courier: "TCS", cn: "TCS1", actorId: STAFF }, CTX);
    expect(() => createLoadSheet(db, { courier: "LEOPARDS", orderIds: [a.orderId, c.orderId], actorId: STAFF }, CTX)).toThrow(/booked with TCS/);
    const now = new Date("2026-10-17T06:00:00Z");
    const ls = createLoadSheet(db, { courier: "LEOPARDS", orderIds: [a.orderId, b.orderId], actorId: STAFF }, CTX, now);
    expect(ls.code).toBe("LS-261017-01");
    const d = loadSheetDetails(db, ls.id)!;
    expect(d.sheet).toMatchObject({ parcels: 2, codTotalPaisa: orderRow(a.orderId).totalPaisa * 2 });
    expect(d.parcels.map((p) => p.cn).sort()).toEqual([a.cn, b.cn].sort());
    expect(() => createLoadSheet(db, { courier: "LEOPARDS", orderIds: [a.orderId], actorId: STAFF }, CTX, now)).toThrow(/already on a load sheet/);
    expect(createLoadSheet(db, { courier: "TCS", orderIds: [c.orderId], actorId: STAFF }, CTX, now).code).toBe("LS-261017-02");
  });
});

describe("COD remittance", () => {
  it("reads the usual courier report layouts and rupee formats", () => {
    expect(rupeesToPaisa("Rs 12,500")).toBe(1_250_000);
    expect(rupeesToPaisa("1550.50")).toBe(155_050);
    expect(rupeesToPaisa("12,500/-")).toBe(1_250_000);
    expect(rupeesToPaisa("abc")).toBeNull();
    const p = parseRemittanceCsv("Leopards Payment Report\r\nDate: 17-10-2026\r\nSr,CN Number,Consignee,COD Amount,Charges,Net Amount\r\n1,le123,Ali,\"1,550\",200,1350\r\nTotal,,,1550,,\r\n");
    expect(p).toMatchObject({ cnColumn: "CN Number", amountColumn: "COD Amount", rows: [{ rowNo: 4, cn: "LE123", amountPaisa: 155_000 }] });
    expect(parseRemittanceCsv("trackingNumber,invoicePayment\n2001,1550\n").rows[0]).toMatchObject({ cn: "2001", amountPaisa: 155_000 });
    expect(() => parseRemittanceCsv("Order,Total\nX,1\n")).toThrow(/No consignment-number column/);
    expect(parseRemittanceCsv("Order,Ref,Paid\nX,LE5,10\n", { cnColumn: "Ref", amountColumn: "Paid" }).rows[0]).toMatchObject({ cn: "LE5", amountPaisa: 1000 });
    expect(() => parseRemittanceCsv("CN,COD Amount\nLE1,ten\n")).toThrow(/Row 2: amount “ten”/);
  });

  it("matches by CN: equal amounts applied, differences only when accepted with a reason, the rest skipped", async () => {
    await mapCities();
    const v = published(20);
    const a = await bookedCod(v); // delivered, amount matches
    const b = await bookedCod(v, { phone: "0321 7654321" }); // delivered, courier pays less
    const c = await bookedCod(v, { phone: "0333 1112223" }); // not marked delivered yet
    const d = place(v, { method: "JAZZCASH", phone: "0345 1112223" }); // prepaid
    confirmPayment(db, d.orderId, { actorId: STAFF }, CTX);
    markPacked(db, d.orderId, { actorId: STAFF }, CTX);
    const dShip = await bookWithCourier(db, d.orderId, "LEOPARDS", { actorId: STAFF }, CTX, deps());
    markDelivered(db, a.orderId, { actorId: STAFF }, CTX);
    markDelivered(db, b.orderId, { actorId: STAFF }, CTX);
    const total = orderRow(a.orderId).totalPaisa / 100;
    const csv = `CN,COD Amount\r\n${a.cn},${total}\r\n${b.cn},${total - 100}\r\n${c.cn},${total}\r\n${dShip.cn},0\r\nLE000000,500\r\n${a.cn},${total}\r\n`;
    const up = uploadRemittance(db, { courier: "LEOPARDS", fileName: "leopards-oct.csv", text: csv, reference: "CPR-123", actorId: STAFF }, CTX);
    expect(up.counts).toEqual({ MATCH: 1, AMOUNT_DIFFERS: 1, NOT_DELIVERED: 1, NOT_COD: 1, UNKNOWN_CN: 1, DUPLICATE_ROW: 1 });
    expect(orderRow(a.orderId).paymentStatus).toBe("COD_COLLECTED"); // nothing applied before confirming
    const lines = remittanceDetails(db, up.id)!.lines;
    const bLine = lines.find((l) => l.cn === b.cn)!;
    const cLine = lines.find((l) => l.cn === c.cn)!;
    expect(() => confirmRemittance(db, up.id, { accepted: { [bLine.id]: "" }, actorId: STAFF }, CTX)).toThrow(/write why you accept it/);
    const unknown = lines.find((l) => l.result === "UNKNOWN_CN")!;
    expect(() => confirmRemittance(db, up.id, { accepted: { [unknown.id]: "trust me" }, actorId: STAFF }, CTX)).toThrow(/can’t be accepted/);
    const res = confirmRemittance(db, up.id, { accepted: { [cLine.id]: "Courier confirms delivered on 18 Oct" }, actorId: STAFF }, CTX);
    expect(res).toMatchObject({ applied: 2, appliedPaisa: total * 200 });
    expect(orderRow(a.orderId)).toMatchObject({ paymentStatus: "COD_REMITTED", fulfillmentStatus: "DELIVERED" });
    expect(orderRow(c.orderId)).toMatchObject({ paymentStatus: "COD_REMITTED", fulfillmentStatus: "DELIVERED" }); // delivered first, then remitted
    expect(db.select().from(orderItems).where(eq(orderItems.orderId, c.orderId)).get()!.warrantyUntil).not.toBeNull();
    expect(orderRow(b.orderId).paymentStatus).toBe("COD_COLLECTED"); // difference not accepted → still owed
    expect(db.select().from(payments).where(eq(payments.orderId, a.orderId)).get()).toMatchObject({ status: "SUCCEEDED", providerRef: `COD-0001/${a.cn}`, verifiedBy: STAFF });
    expect(activeShipment(db, a.orderId)).toMatchObject({ remittedPaisa: total * 100 });
    expect(actions(a.orderId).at(-1)).toBe("order.cod_remitted");
    expect(() => confirmRemittance(db, up.id, { accepted: {}, actorId: STAFF }, CTX)).toThrow(/already confirmed/);
    expect(() => uploadRemittance(db, { courier: "LEOPARDS", fileName: "again.csv", text: csv, actorId: STAFF }, CTX)).toThrow(/already applied as COD-0001/);
    // a second report for the difference: b is accepted with a reason
    const up2 = uploadRemittance(db, { courier: "LEOPARDS", fileName: "adj.csv", text: `CN,COD Amount\n${b.cn},${total - 100}\n${a.cn},${total}\n`, actorId: STAFF }, CTX);
    expect(up2).toMatchObject({ code: "COD-0002", counts: { AMOUNT_DIFFERS: 1, ALREADY_REMITTED: 1 } });
    const l2 = remittanceDetails(db, up2.id)!.lines.find((l) => l.cn === b.cn)!;
    confirmRemittance(db, up2.id, { accepted: { [l2.id]: "Courier deducted Rs 100 return charge" }, actorId: STAFF }, CTX);
    expect(orderRow(b.orderId).paymentStatus).toBe("COD_REMITTED");
    expect(codOutstanding(db).totalOwedPaisa).toBe(0);
  });

  it("an unconfirmed upload can be discarded or replaced by the same file", async () => {
    await mapCities();
    const v = published(5);
    const a = await bookedCod(v);
    const csv = `CN,COD Amount\n${a.cn},1\n`;
    const up = uploadRemittance(db, { courier: "LEOPARDS", fileName: "x.csv", text: csv, actorId: STAFF }, CTX);
    const again = uploadRemittance(db, { courier: "LEOPARDS", fileName: "x.csv", text: csv, actorId: STAFF }, CTX);
    expect(again.code).toBe(up.code);
    discardRemittance(db, again.id, { actorId: STAFF }, CTX);
    expect(remittanceDetails(db, again.id)).toBeNull();
    expect(() => uploadRemittance(db, { courier: "SELF", fileName: "x.csv", text: csv, actorId: STAFF }, CTX)).toThrow(/Choose the courier/);
  });
});

describe("order lists", () => {
  it("filters follow the steps and search finds a CN", async () => {
    await mapCities();
    const v = published(10);
    const a = await bookedCod(v);
    const b = place(v, { phone: "0321 7654321" });
    markPacked(db, b.orderId, { actorId: STAFF }, CTX);
    place(v, { phone: "0333 1112223" });
    expect(orderCounts(db)).toMatchObject({ action: 2, pack: 1, book: 1, courier: 1, delivered: 0, all: 3 });
    expect(listOrders(db, { filter: "all", q: a.cn.toLowerCase() }).map((o) => o.id)).toEqual([a.orderId]);
    expect(listOrders(db, { filter: "courier" })[0]).toMatchObject({ courier: "LEOPARDS", cn: a.cn, city: "Lahore" });
  });
});
