"use server";

import { db } from "@/db/client";
import { goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { checked, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";
import {
  ReturnError,
  approveReturn,
  closeReturn,
  createReturn,
  inspectReturn,
  receiveReturn,
  recordRefund,
  rejectReturn,
} from "@/server/returns/returns";
import { updateClaim } from "@/server/returns/vendor-claims";

/**
 * Returns & warranty actions (M11, v1.16 §28). OWNER/MANAGER via requireStaff("returns").
 * The rules, stock and audit live in server/returns/*; these wrap them: read the form, go back to the page with a message.
 */

const ID = /^[0-9a-f-]{36}$/i;
const page = (id: string) => `/admin/returns/${id}`;

function idOf(fd: FormData, key = "id", back = "/admin/returns"): string {
  const id = text(fd, key);
  if (!ID.test(id)) goTo(back, { error: "Not found." });
  return id;
}
/** Rule errors go back to the page as a message (redirect() throws, so it runs outside the try). */
function run<T>(back: string, fn: () => T): T {
  let out: { ok: true; value: T } | { ok: false; error: string };
  try {
    out = { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof ReturnError) out = { ok: false, error: e.message };
    else throw e;
  }
  if (!out.ok) goTo(back, { error: out.error });
  return out.value;
}
const rupees = (s: string): number | undefined => {
  if (!s) return undefined;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export async function createReturnAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const orderId = idOf(fd, "orderId");
  const back = `/admin/returns/new?order=${encodeURIComponent(text(fd, "orderCode"))}`;
  const items = [...fd.keys()]
    .filter((k) => k.startsWith("qty_"))
    .map((k) => ({ orderItemId: k.slice(4), quantity: Number(text(fd, k) || 0) }))
    .filter((i) => ID.test(i.orderItemId));
  const ctx = await auditContext();
  const r = run(back, () => createReturn(db, { orderId, reason: text(fd, "reason"), description: text(fd, "description"), items, alreadyReceived: checked(fd, "received"), actorId: staff.id }, ctx));
  goTo(page(r.id), { saved: `${r.code} opened for ${r.orderCode}. ${r.warrantyText}` });
}

export async function receiveReturnAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd);
  const ctx = await auditContext();
  const code = run(page(id), () => receiveReturn(db, id, { actorId: staff.id }, ctx));
  goTo(page(id), { saved: `${code}: item received. Inspect it next.` });
}

export async function inspectReturnAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd);
  const conditions: Record<string, string> = {};
  for (const k of fd.keys()) if (k.startsWith("cond_")) conditions[k.slice(5)] = text(fd, k);
  const ctx = await auditContext();
  const code = run(page(id), () => inspectReturn(db, id, { actorId: staff.id, notes: text(fd, "notes"), conditions }, ctx));
  goTo(page(id), { saved: `${code}: inspection saved. Now decide: approve or reject.` });
}

export async function approveReturnAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd);
  const dispositions: Record<string, { disposition: string; vendorId?: string | null }> = {};
  for (const k of fd.keys()) if (k.startsWith("disp_")) dispositions[k.slice(5)] = { disposition: text(fd, k), vendorId: text(fd, `vendor_${k.slice(5)}`) || null };
  const amount = rupees(text(fd, "amount"));
  if (amount !== undefined && Number.isNaN(amount)) goTo(page(id), { error: "Enter the amount as a number." });
  const ctx = await auditContext();
  const r = run(page(id), () =>
    approveReturn(db, id, { actorId: staff.id, resolution: text(fd, "resolution"), dispositions, includeDelivery: checked(fd, "includeDelivery"), refundPaisa: amount, decisionNotes: text(fd, "decisionNotes"), overrideReason: text(fd, "overrideReason") }, ctx),
  );
  revalidateStorefront(); // stock may have changed
  goTo(page(id), { saved: `${r.code} approved${r.resolution === "REFUND" ? " — now pay the refund and record it" : r.resolution === "STORE_CREDIT" ? " — give the store credit, then close the return" : " — close it once the replacement is handed over"}.` });
}

export async function rejectReturnAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd);
  const ctx = await auditContext();
  const code = run(page(id), () => rejectReturn(db, id, { actorId: staff.id, notes: text(fd, "notes") }, ctx));
  goTo(page(id), { saved: `${code} rejected. Hand the item back to the customer, then close the return.` });
}

export async function recordRefundAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd);
  const ctx = await auditContext();
  const r = run(page(id), () => recordRefund(db, id, { actorId: staff.id, method: text(fd, "method"), reference: text(fd, "reference") }, ctx));
  goTo(page(id), { saved: `${r.code}: refund recorded and the return closed.${r.orderPayment === "REFUNDED" ? ` ${r.orderCode} is now fully refunded.` : r.orderPayment === "PARTIALLY_REFUNDED" ? ` ${r.orderCode} is partly refunded.` : ""}` });
}

export async function closeReturnAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd);
  const ctx = await auditContext();
  const code = run(page(id), () => closeReturn(db, id, { actorId: staff.id, note: text(fd, "note") }, ctx));
  goTo(page(id), { saved: `${code} closed.` });
}

export async function updateClaimAction(fd: FormData) {
  const staff = await requireStaff("returns");
  const id = idOf(fd, "id", "/admin/returns/claims");
  const credit = rupees(text(fd, "credit"));
  if (credit !== undefined && Number.isNaN(credit)) goTo("/admin/returns/claims", { error: "Enter the credit as a number." });
  const ctx = await auditContext();
  const r = run("/admin/returns/claims", () => updateClaim(db, id, { actorId: staff.id, action: text(fd, "step"), reference: text(fd, "reference"), creditPaisa: credit, notes: text(fd, "notes") }, ctx));
  goTo("/admin/returns/claims", { saved: r.status === "SENT" ? "Claim marked as sent." : r.status === "CREDITED" ? "Credit recorded." : "Claim marked as rejected." });
}
