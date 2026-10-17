"use server";

import { db } from "@/db/client";
import { goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { text } from "@/server/forms";
import { sendOrderEmail, type EmailKind } from "@/server/notify/order-emails";
import { and, eq, inArray, ne } from "drizzle-orm";
import { orders, settings, shipments } from "@/db/schema";
import { API_COURIERS, type ApiCourier } from "@/db/schema/logistics";
import { liveCourierDeps } from "@/server/couriers";
import { OrderActionError, cancelOrder, confirmPayment, dispatchOrder, markProofReceived } from "@/server/orders/admin-orders";
import { bookManyWithCourier, bookWithCourier, cancelBooking, createLoadSheet, markDelivered, markInTransit, markPacked, receiveReturnedParcel, syncTracking, type SyncSummary } from "@/server/orders/fulfilment";
import { revalidateStorefront } from "@/server/revalidate";

/**
 * Orders admin actions (M10 Phase A, v1.11 §23). OWNER/MANAGER via requireStaff("orders").
 * The rule checks, stock and audit live in server/orders/admin-orders.ts; the customer email is
 * sent after the change is saved and its result is shown to staff (and kept in the email log).
 */

const page = (id: string) => `/admin/orders/${id}`;
const ID = /^[0-9a-f-]{36}$/i;

function orderId(fd: FormData): string {
  const id = text(fd, "orderId");
  if (!ID.test(id)) goTo("/admin/orders", { error: "Order not found." });
  return id;
}

/** Runs a rule-checked change; rule errors go back to the page as a message. */
function run<T>(id: string, fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof OrderActionError) goTo(page(id), { error: e.message });
    throw e;
  }
}
async function runAsync<T>(back: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof OrderActionError) goTo(back, { error: e.message });
    throw e;
  }
}

async function emailNote(id: string, kind: EmailKind, actorId: string, extra: { refundDue?: boolean } = {}) {
  const r = await sendOrderEmail(db, { orderId: id, kind, actorId, ...extra });
  return r.sent ? ` Email sent to ${r.recipient}.` : ` Customer NOT emailed: ${r.detail}`;
}

export async function proofReceivedAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const code = run(id, () =>
    markProofReceived(
      db,
      id,
      {
        reference: text(fd, "reference"),
        via: text(fd, "via"),
        actorId: staff.id,
      },
      ctx,
    ),
  );
  goTo(page(id), {
    saved: `${code}: payment proof recorded. The order won’t expire now — check the money arrived, then confirm the payment.`,
  });
}

export async function confirmPaymentAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  if (fd.get("checked") !== "on")
    goTo(page(id), {
      error: "Tick the box to confirm you saw the money in the account.",
    });
  const ctx = await auditContext();
  const code = run(id, () => confirmPayment(db, id, { reference: text(fd, "reference"), actorId: staff.id }, ctx));
  goTo(page(id), {
    saved: `${code}: payment confirmed.${await emailNote(id, "PAYMENT_CONFIRMED", staff.id)}`,
  });
}

export async function dispatchAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const code = run(id, () => dispatchOrder(db, id, { courier: text(fd, "courier"), cn: text(fd, "cn"), actorId: staff.id }, ctx));
  goTo(page(id), {
    saved: `${code}: dispatched.${await emailNote(id, "DISPATCHED", staff.id)}`,
  });
}

export async function cancelAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const r = run(id, () =>
    cancelOrder(
      db,
      id,
      {
        reason: text(fd, "reason"),
        refundConfirmed: fd.get("refund") === "on",
        actorId: staff.id,
      },
      ctx,
    ),
  );
  revalidateStorefront(); // stock went back on sale
  const note = fd.get("notify") === "on" ? await emailNote(id, "CANCELLED", staff.id, { refundDue: r.refundDue }) : " Customer not emailed (box unticked).";
  goTo(page(id), {
    saved: `${r.code}: cancelled, stock returned.${r.refundDue ? " Remember to refund the customer." : ""}${note}`,
  });
}

const RESENDABLE: EmailKind[] = ["ORDER_PLACED", "PAYMENT_CONFIRMED", "DISPATCHED"];

/** Send an order email again (e.g. the customer didn't get it). Audited through the email log. */
export async function resendEmailAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const kind = text(fd, "kind") as EmailKind;
  if (!RESENDABLE.includes(kind)) goTo(page(id), { error: "Choose which email to send." });
  const r = await sendOrderEmail(db, { orderId: id, kind, actorId: staff.id });
  goTo(page(id), r.sent ? { saved: `Email sent to ${r.recipient}.` } : { error: r.detail });
}

// ---- v1.15 — Milestone 10 Phase B (SPECIFICATION §27) ------------------------------------------

const apiCourier = (fd: FormData): ApiCourier | null => {
  const c = text(fd, "courier");
  return (API_COURIERS as readonly string[]).includes(c) ? (c as ApiCourier) : null;
};
const whole = (fd: FormData, key: string): number | undefined => {
  const v = text(fd, key).replace(/,/g, "");
  return v ? Number(v) : undefined;
};

export async function packAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const code = run(id, () => markPacked(db, id, { actorId: staff.id }, ctx));
  goTo(page(id), { saved: `${code}: packed. Print the label and packing slip, then book the courier.` });
}

/** Book through Leopards / PostEx (API keys in the environment file), then email the customer. */
export async function bookAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const courier = apiCourier(fd);
  if (!courier) goTo(page(id), { error: "Choose Leopards or PostEx." });
  const ctx = await auditContext();
  const r = await runAsync(page(id), () => bookWithCourier(db, id, courier, { actorId: staff.id, weightGrams: whole(fd, "weight"), pieces: whole(fd, "pieces") }, ctx, liveCourierDeps()));
  goTo(page(id), { saved: `${r.code}: booked with ${courier === "LEOPARDS" ? "Leopards" : "PostEx"}, CN ${r.cn}. Print the label.${await emailNote(id, "DISPATCHED", staff.id)}` });
}

export async function cancelBookingAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const r = await runAsync(page(id), () => cancelBooking(db, id, { actorId: staff.id }, ctx, liveCourierDeps()));
  goTo(page(id), {
    saved: `${r.code}: booking ${r.cn ?? ""} cancelled — the order is packed again.${r.manual ? " This CN was typed in by hand: cancel it on the courier’s portal too." : r.courierCancelled ? " The courier booking was cancelled too." : ""}`,
  });
}

export async function inTransitAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const code = run(id, () => markInTransit(db, id, { actorId: staff.id }, ctx));
  goTo(page(id), { saved: `${code}: on the way.` });
}

export async function deliveredAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const ctx = await auditContext();
  const r = run(id, () => markDelivered(db, id, { actorId: staff.id }, ctx));
  goTo(page(id), { saved: `${r.code}: delivered.${r.cod ? " The courier now owes the shop this cash — it is cleared when you upload the courier’s COD payment report." : ""}` });
}

/** The courier brought the parcel back: put good items back on sale (Q69). */
export async function receiveReturnAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = orderId(fd);
  const restock: Record<string, number> = {};
  for (const [k, v] of fd.entries()) {
    const m = /^restock_([0-9a-f-]{36})$/i.exec(k);
    if (m && typeof v === "string") restock[m[1]!] = Number(v);
  }
  const ctx = await auditContext();
  const r = run(id, () => receiveReturnedParcel(db, id, { restock, note: text(fd, "note"), refundConfirmed: fd.get("refund") === "on", actorId: staff.id }, ctx));
  revalidateStorefront(); // returned stock is on sale again
  goTo(page(id), {
    saved: `${r.code}: parcel received back. ${r.restocked} item${r.restocked === 1 ? "" : "s"} back on sale${r.keptOff ? `, ${r.keptOff} kept off sale` : ""}.${r.refundDue ? " Remember to refund the customer." : ""}`,
  });
}

function trackingNote(s: SyncSummary) {
  const parts = [`Checked ${s.checked} parcel${s.checked === 1 ? "" : "s"}`, s.updated ? `${s.updated} updated` : "no change"];
  if (s.delivered.length) parts.push(`delivered: ${s.delivered.join(", ")}`);
  if (s.returning.length) parts.push(`coming back: ${s.returning.join(", ")}`);
  return `${parts.join(" · ")}.${s.errors.length ? ` ${s.errors.join(" ")}` : ""}`;
}
function rememberSync(s: SyncSummary, by: string) {
  const value = { at: new Date().toISOString(), by, ...s };
  db.insert(settings).values({ key: "tracking_sync_last", value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } }).run();
}

export async function refreshTrackingAction(fd: FormData) {
  await requireStaff("orders"); // tracking changes are recorded as the system (the courier said so)
  const id = orderId(fd);
  const ctx = await auditContext();
  const s = await syncTracking(db, liveCourierDeps(), { orderIds: [id] }, ctx);
  if (s.updated) revalidateStorefront();
  goTo(page(id), s.errors.length && !s.checked ? { error: s.errors.join(" ") } : { saved: trackingNote(s) });
}

/**
 * The tick-boxes on the order list: pack, book, print labels, make a load sheet, refresh tracking.
 * Each order is checked on its own; the result lists what worked and what didn't.
 */
export async function bulkAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const back = `/admin/orders?f=${encodeURIComponent(text(fd, "f") || "action")}`;
  const ids = [...new Set(fd.getAll("ids").filter((v): v is string => typeof v === "string" && ID.test(v)))].slice(0, 50);
  const op = text(fd, "op");
  const ctx = await auditContext();

  if (op === "track") {
    const s = await syncTracking(db, liveCourierDeps(), ids.length ? { orderIds: ids } : {}, ctx);
    rememberSync(s, staff.name);
    if (s.updated) revalidateStorefront();
    goTo(back, { saved: trackingNote(s) });
  }
  if (!ids.length) goTo(back, { error: "Tick at least one order first." });
  if (op === "labels" || op === "slips") goTo(`/admin/orders/labels?ids=${ids.join(",")}&what=${op === "labels" ? "both" : "slip"}&back=${encodeURIComponent(back)}`);

  if (op === "pack") {
    const packed: { id: string; code: string }[] = [];
    const failed: string[] = [];
    for (const id of ids) {
      try {
        packed.push({ id, code: markPacked(db, id, { actorId: staff.id }, ctx) });
      } catch (e) {
        if (!(e instanceof OrderActionError)) throw e;
        const code = db.select({ code: orders.code }).from(orders).where(eq(orders.id, id)).get()?.code ?? "?";
        failed.push(`${code}: ${e.message}`);
      }
    }
    if (failed.length || !packed.length) goTo(back, { ...(packed.length ? { saved: `Packed: ${packed.map((p) => p.code).join(", ")}.` } : {}), error: failed.join(" · ") });
    // Straight to printing their labels and packing slips
    goTo(`/admin/orders/labels?ids=${packed.map((p) => p.id).join(",")}&back=${encodeURIComponent("/admin/orders?f=book")}`);
  }

  if (op === "book_LEOPARDS" || op === "book_POSTEX") {
    const courier = op === "book_LEOPARDS" ? "LEOPARDS" : "POSTEX";
    const results = await bookManyWithCourier(db, ids, courier, { actorId: staff.id, weightGrams: whole(fd, "weight") }, ctx, liveCourierDeps());
    const ok = results.filter((r) => r.ok);
    let emailed = 0;
    for (const r of ok) if ((await sendOrderEmail(db, { orderId: r.orderId, kind: "DISPATCHED", actorId: staff.id })).sent) emailed += 1;
    const bad = results.filter((r): r is Extract<typeof r, { ok: false }> => !r.ok);
    const msg = `${ok.length} booked with ${courier === "LEOPARDS" ? "Leopards" : "PostEx"}${ok.length ? ` (${ok.map((r) => (r.ok ? `${r.code} → ${r.cn}` : "")).join(", ")}); ${emailed} customer${emailed === 1 ? "" : "s"} emailed` : ""}.`;
    goTo("/admin/orders?f=courier", bad.length ? { saved: msg, error: bad.map((b) => `${b.code}: ${b.error}`).join(" · ") } : { saved: msg });
  }

  if (op === "loadsheet") {
    const couriers = db
      .selectDistinct({ c: shipments.courier })
      .from(shipments)
      .where(and(inArray(shipments.orderId, ids), ne(shipments.status, "CANCELLED")))
      .all();
    if (couriers.length !== 1) goTo(back, { error: couriers.length ? "Tick parcels of one courier only — each rider gets their own load sheet." : "The ticked orders aren’t booked with a courier." });
    let ls: { id: string; code: string };
    try {
      ls = createLoadSheet(db, { courier: couriers[0]!.c, orderIds: ids, actorId: staff.id }, ctx);
    } catch (e) {
      if (e instanceof OrderActionError) goTo(back, { error: e.message });
      throw e;
    }
    goTo(`/admin/orders/load-sheets/${ls.id}`);
  }
  goTo(back, { error: "Choose what to do with the ticked orders." });
}
