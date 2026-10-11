"use server";

import { z } from "zod";
import { db } from "@/db/client";
import { auditContext } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import {
  CounterSaleError,
  TicketLineSchema,
  addTechnician,
  completeCounterSale,
  findTechnician,
  loadCounterReceipt,
  quoteTicket,
  searchCounterItems,
  setTechnicianStatus,
  type CounterItem,
  type CounterReceipt,
  type CounterSaleResult,
  type Technician,
  type TicketQuote,
} from "@/server/counter/pos";
import { revalidateStorefront } from "@/server/revalidate";

/**
 * Counter sale (POS) actions — Milestone 9, SPECIFICATION.md §6.4, §25.
 * Every action checks the signed-in staff member first (requireStaff("counter")); the owner-only and
 * manager-only rules (non-cash payments, discounts, approving technicians) are enforced again inside
 * server/counter/pos.ts, so a hand-made request can't get round the screen.
 */

export type ActionResult<T> = { ok: true; value: T } | { ok: false; message: string; kind?: CounterSaleError["kind"] };

function fail(e: unknown): { ok: false; message: string; kind?: CounterSaleError["kind"] } {
  if (e instanceof CounterSaleError) return { ok: false, message: e.message, kind: e.kind };
  throw e;
}

export async function searchItemsAction(query: string): Promise<CounterItem[]> {
  await requireStaff("counter");
  return typeof query === "string" ? searchCounterItems(db, query) : [];
}

const QuoteInput = z.object({ lines: z.array(TicketLineSchema).max(50), tier: z.enum(["RETAIL", "WHOLESALE"]) });
export async function quoteTicketAction(input: { lines: { variantId: string; qty: number }[]; tier: "RETAIL" | "WHOLESALE" }): Promise<TicketQuote | null> {
  await requireStaff("counter");
  const parsed = QuoteInput.safeParse(input);
  return parsed.success ? quoteTicket(db, parsed.data.lines, parsed.data.tier) : null;
}

export async function findTechnicianAction(phone: string): Promise<Technician | null> {
  await requireStaff("counter");
  return typeof phone === "string" ? findTechnician(db, phone) : null;
}

export async function addTechnicianAction(input: { name: string; shopName: string; phone: string; city?: string }): Promise<ActionResult<Technician>> {
  const staff = await requireStaff("counter");
  const ctx = await auditContext();
  try {
    return { ok: true, value: addTechnician(db, input, staff, ctx) };
  } catch (e) {
    return fail(e);
  }
}

export async function approveTechnicianAction(customerId: string): Promise<ActionResult<Technician>> {
  const staff = await requireStaff("counter");
  const ctx = await auditContext();
  try {
    return { ok: true, value: setTechnicianStatus(db, String(customerId), "APPROVED", staff, ctx) };
  } catch (e) {
    return fail(e);
  }
}

export async function completeSaleAction(input: unknown): Promise<ActionResult<{ sale: CounterSaleResult; receipt: CounterReceipt }>> {
  const staff = await requireStaff("counter");
  const ctx = await auditContext();
  let sale: CounterSaleResult;
  try {
    sale = completeCounterSale(db, input, staff, ctx);
  } catch (e) {
    return fail(e);
  }
  // Counter and website share one stock pool: refresh the shop pages after the commit (spec §6.4 step 4)
  if (!sale.repeated) revalidateStorefront();
  return { ok: true, value: { sale, receipt: loadCounterReceipt(db, { orderId: sale.orderId })! } };
}
