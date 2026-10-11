"use server";

import { db } from "@/db/client";
import { goTo } from "@/server/action-helpers";
import { auditContext } from "@/server/audit";
import { CounterSaleError, addTechnician, setTechnicianStatus } from "@/server/counter/pos";
import { requireStaff } from "@/server/dal";
import { text } from "@/server/forms";

/** Technicians (wholesale customers) — v1.13, M9. OWNER and MANAGER (requireStaff("technicians")); audited. */

const PAGE = "/admin/technicians";

export async function setTechnicianStatusAction(fd: FormData) {
  const staff = await requireStaff("technicians");
  const status = text(fd, "status");
  if (status !== "APPROVED" && status !== "REJECTED" && status !== "PENDING") goTo(PAGE, { error: "Unknown status." });
  const ctx = await auditContext();
  let msg: string;
  try {
    const t = setTechnicianStatus(db, text(fd, "id"), status as "APPROVED" | "REJECTED" | "PENDING", staff, ctx);
    msg = `${t.name} (${t.shopName}): ${t.status === "APPROVED" ? "approved — wholesale prices at the counter" : t.status === "REJECTED" ? "rejected — retail prices only" : "back to waiting"}.`;
  } catch (e) {
    if (e instanceof CounterSaleError) goTo(PAGE, { error: e.message });
    throw e;
  }
  goTo(PAGE, { saved: msg });
}

export async function addTechnicianFormAction(fd: FormData) {
  const staff = await requireStaff("technicians");
  const ctx = await auditContext();
  let msg: string;
  try {
    const t = addTechnician(db, { name: text(fd, "name"), shopName: text(fd, "shopName"), phone: text(fd, "phone"), city: text(fd, "city") }, staff, ctx);
    msg = `${t.name} added and approved for wholesale prices.`;
  } catch (e) {
    if (e instanceof CounterSaleError) goTo(PAGE, { error: e.message });
    throw e;
  }
  goTo(PAGE, { saved: msg });
}
