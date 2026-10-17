"use server";

import { db } from "@/db/client";
import { CsvParseError } from "@/lib/csv";
import { goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { file, text } from "@/server/forms";
import { OrderActionError } from "@/server/orders/admin-orders";
import { MAX_REMITTANCE_BYTES, confirmRemittance, discardRemittance, uploadRemittance } from "@/server/orders/cod-remittance";

/** COD remittance (M10 Phase B, Q71). OWNER/MANAGER via the `orders` module. */

const LIST = "/admin/orders/remittance";
const ID = /^[0-9a-f-]{36}$/i;

export async function uploadRemittanceAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const f = file(fd, "file");
  if (!f) goTo(LIST, { error: "Choose the courier’s payment report (CSV file)." });
  if (f.size > MAX_REMITTANCE_BYTES) goTo(LIST, { error: "The file is larger than 1 MB — split it into smaller files." });
  if (/\.(xlsx?|xls|ods|pdf)$/i.test(f.name)) goTo(LIST, { error: "Save the report as CSV first (Excel: File → Save As → CSV UTF-8), then upload that file." });
  const ctx = await auditContext();
  let r: { id: string };
  try {
    r = uploadRemittance(db, { courier: text(fd, "courier"), fileName: f.name, text: await f.text(), reference: text(fd, "reference"), cnColumn: text(fd, "cnColumn"), amountColumn: text(fd, "amountColumn"), actorId: staff.id }, ctx);
  } catch (e) {
    if (e instanceof OrderActionError || e instanceof CsvParseError) goTo(LIST, { error: e.message });
    throw e;
  }
  goTo(`${LIST}/${r.id}`, { saved: "Uploaded. Nothing is changed yet — check the rows, then confirm." });
}

export async function confirmRemittanceAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = text(fd, "remittanceId");
  if (!ID.test(id)) goTo(LIST, { error: "Remittance not found." });
  const accepted: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    const m = /^accept_([0-9a-f-]{36})$/i.exec(k);
    if (m && v === "on") accepted[m[1]!] = text(fd, `reason_${m[1]}`);
  }
  const ctx = await auditContext();
  let r: { code: string; applied: number; skipped: string[] };
  try {
    r = confirmRemittance(db, id, { accepted, actorId: staff.id }, ctx);
  } catch (e) {
    if (e instanceof OrderActionError) goTo(`${LIST}/${id}`, { error: e.message });
    throw e;
  }
  goTo(`${LIST}/${id}`, { saved: `${r.code}: ${r.applied} parcel${r.applied === 1 ? "" : "s"} marked as paid by the courier.${r.skipped.length ? ` Skipped (changed since upload): ${r.skipped.join(", ")}.` : ""}` });
}

export async function discardRemittanceAction(fd: FormData) {
  const staff = await requireStaff("orders");
  const id = text(fd, "remittanceId");
  if (!ID.test(id)) goTo(LIST, { error: "Remittance not found." });
  const ctx = await auditContext();
  let code: string;
  try {
    code = discardRemittance(db, id, { actorId: staff.id }, ctx);
  } catch (e) {
    if (e instanceof OrderActionError) goTo(`${LIST}/${id}`, { error: e.message });
    throw e;
  }
  goTo(LIST, { saved: `${code} discarded — nothing was changed.` });
}
