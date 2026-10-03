"use server";

import { db } from "@/db/client";
import { goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { text } from "@/server/forms";
import { sendOrderEmail, type EmailKind } from "@/server/notify/order-emails";
import { OrderActionError, cancelOrder, confirmPayment, dispatchOrder, markProofReceived } from "@/server/orders/admin-orders";
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
