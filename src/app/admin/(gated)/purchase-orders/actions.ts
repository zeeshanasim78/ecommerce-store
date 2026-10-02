"use server";

import { db } from "@/db/client";
import { VENDOR_CURRENCIES } from "@/db/schema/purchasing";
import { attempt, goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { optionalText, text } from "@/server/forms";
import { majorToMinor } from "@/server/purchasing/costing";
import {
  addPoLine,
  cancelPo,
  closePoShort,
  createDraftPo,
  markOrdered,
  receivePo,
  removePoLine,
  updatePoHeader,
  updatePoLine,
  type PoHeaderInput,
} from "@/server/purchasing/purchase-orders";
import { revalidateStorefront } from "@/server/revalidate";

/** Every PO action: OWNER/MANAGER with 2FA (spec §7), then the tested rules in server/purchasing. */
async function staffAndCtx() {
  const staff = await requireStaff("purchasing");
  return { actor: { id: staff.id }, ctx: await auditContext() };
}

const poPath = (id: string) => `/admin/purchase-orders/${id}`;

/** Whole number from a form field, or null. */
function wholeNumber(fd: FormData, key: string): number | null {
  const v = text(fd, key);
  return /^\d{1,7}$/.test(v) ? Number(v) : null;
}

export async function createPurchaseOrder(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const vendorId = text(formData, "vendorId");
  const r = attempt(() => createDraftPo(db, vendorId, actor, ctx));
  if (!r.ok) goTo("/admin/purchase-orders/new", { error: r.error });
  goTo(poPath(r.value.id), { saved: `${r.value.code} created as a draft. Add the screens you’re ordering.` });
}

export async function savePoHeader(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const id = text(formData, "id");
  const input: PoHeaderInput = {};

  const currency = text(formData, "currency");
  if (currency) {
    if (!(VENDOR_CURRENCIES as readonly string[]).includes(currency)) goTo(poPath(id), { error: "Choose a currency." });
    input.currency = currency as PoHeaderInput["currency"];
    const fx = Number(text(formData, "fxRateToPkr"));
    if (currency !== "PKR") {
      if (!Number.isFinite(fx) || fx <= 0) goTo(poPath(id), { error: "Enter the exchange rate: how many rupees for 1 " + currency + "." });
      input.fxRateToPkr = Math.round(fx * 10_000) / 10_000;
    }
  }
  for (const [field, key] of [
    ["shipping", "shippingCostPaisa"],
    ["customs", "customsDutyPaisa"],
    ["other", "otherLandedCostPaisa"],
  ] as const) {
    if (formData.has(field)) {
      const v = majorToMinor(text(formData, field) || "0");
      if (v === null) goTo(poPath(id), { error: "Costs must be amounts in rupees, like 2500 or 2500.50." });
      input[key] = v!;
    }
  }
  if (formData.has("expectedAt")) {
    const d = text(formData, "expectedAt");
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) goTo(poPath(id), { error: "Choose a valid expected date." });
    input.expectedAt = d || null;
  }
  if (formData.has("notes")) input.notes = optionalText(formData, "notes")?.slice(0, 2000) ?? null;

  const r = attempt(() => updatePoHeader(db, id, input, actor, ctx));
  if (!r.ok) goTo(poPath(id), { error: r.error });
  goTo(poPath(id), { saved: "Purchase order saved." });
}

function readLine(fd: FormData, poId: string) {
  const qty = wholeNumber(fd, "qtyOrdered");
  const cost = majorToMinor(text(fd, "unitCost"));
  if (!qty || qty < 1) goTo(poPath(poId), { error: "Quantity must be a whole number, at least 1." });
  if (cost === null) goTo(poPath(poId), { error: "Unit cost must be an amount like 42.50." });
  return { qtyOrdered: qty!, unitCostForeign: cost! };
}

export async function addLine(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const poId = text(formData, "poId");
  const line = readLine(formData, poId);
  const r = attempt(() => addPoLine(db, poId, { variantId: text(formData, "variantId"), ...line }, actor, ctx));
  if (!r.ok) goTo(poPath(poId), { error: r.error });
  goTo(poPath(poId), { saved: "Line added." });
}

export async function updateLine(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const poId = text(formData, "poId");
  const line = readLine(formData, poId);
  const r = attempt(() => updatePoLine(db, text(formData, "lineId"), line, actor, ctx));
  if (!r.ok) goTo(poPath(poId), { error: r.error });
  goTo(poPath(poId), { saved: "Line updated." });
}

export async function removeLine(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const poId = text(formData, "poId");
  const r = attempt(() => removePoLine(db, text(formData, "id"), actor, ctx));
  if (!r.ok) goTo(poPath(poId), { error: r.error });
  goTo(poPath(poId), { saved: "Line removed." });
}

export async function orderPo(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const id = text(formData, "id");
  const r = attempt(() => markOrdered(db, id, actor, ctx));
  if (!r.ok) goTo(poPath(id), { error: r.error });
  goTo(poPath(id), { saved: "Marked as ordered. Lines are now locked; receive goods here when they arrive." });
}

export async function receiveGoods(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const id = text(formData, "id");
  const receipts = formData
    .getAll("lineId")
    .filter((v): v is string => typeof v === "string")
    .map((lineId) => {
      const raw = text(formData, `qty:${lineId}`);
      const qty = raw === "" ? 0 : /^\d{1,7}$/.test(raw) ? Number(raw) : -1;
      return { lineId, qty, receivedBefore: Number(text(formData, `before:${lineId}`)) };
    });
  if (receipts.some((r) => r.qty < 0)) goTo(poPath(id), { error: "Received quantities must be whole numbers." });

  const r = attempt(() => receivePo(db, id, receipts, actor, ctx));
  if (!r.ok) goTo(poPath(id), { error: r.error });
  revalidateStorefront(); // new stock shows on the shop straight away
  const { status, unitsReceived } = r.value;
  goTo(poPath(id), {
    saved: `${unitsReceived} unit${unitsReceived === 1 ? "" : "s"} added to stock. ${status === "RECEIVED" ? "Everything on this PO has arrived." : "Still waiting for the rest."}`,
  });
}

export async function cancelPurchaseOrder(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const id = text(formData, "id");
  const r = attempt(() => cancelPo(db, id, text(formData, "reason").slice(0, 300), actor, ctx));
  if (!r.ok) goTo(poPath(id), { error: r.error });
  goTo(poPath(id), { saved: "Purchase order cancelled." });
}

export async function closeShort(formData: FormData) {
  const { actor, ctx } = await staffAndCtx();
  const id = text(formData, "id");
  const r = attempt(() => closePoShort(db, id, text(formData, "reason").slice(0, 300), actor, ctx));
  if (!r.ok) goTo(poPath(id), { error: r.error });
  goTo(poPath(id), { saved: "Purchase order closed. The missing units won’t be expected any more." });
}
