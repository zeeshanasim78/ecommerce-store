import { and, desc, eq, sql } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { orderItems, returnItems, returns, vendorClaims, vendors } from "@/db/schema";
import { VENDOR_CLAIM_STATUSES } from "@/db/schema/returns";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { withStockTransaction } from "@/server/inventory/stock";
import { ReturnError } from "./returns";

/**
 * Supplier claims (SPECIFICATION §4.12, §28): a faulty unit sent back to the supplier is NOT put on
 * sale again. Its claim waits here — OPEN → SENT → CREDITED (the supplier’s credit note) or REJECTED.
 * OWNER/MANAGER (module `returns`). Audited. No stock moves: the unit never re-entered stock.
 */

export type ClaimStatus = (typeof VENDOR_CLAIM_STATUSES)[number];
export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = { OPEN: "To send", SENT: "Sent — waiting", CREDITED: "Credited", REJECTED: "Rejected" };

export type ClaimRow = {
  id: string;
  status: ClaimStatus;
  vendorId: string;
  vendorName: string;
  returnId: string;
  returnCode: string;
  product: string;
  sku: string;
  quantity: number;
  claimPaisa: number;
  creditPaisa: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  sentAt: string | null;
  resolvedAt: string | null;
};

export function listClaims(db: DB, opts: { status?: string; vendorId?: string; limit?: number } = {}): ClaimRow[] {
  const status = (VENDOR_CLAIM_STATUSES as readonly string[]).includes(opts.status ?? "") ? (opts.status as ClaimStatus) : undefined;
  return db
    .select({ c: vendorClaims, vendor: vendors.name, retId: returns.id, retCode: returns.code, qty: returnItems.quantity, snap: orderItems.productSnapshot })
    .from(vendorClaims)
    .innerJoin(vendors, eq(vendors.id, vendorClaims.vendorId))
    .innerJoin(returnItems, eq(returnItems.id, vendorClaims.returnItemId))
    .innerJoin(returns, eq(returns.id, returnItems.returnId))
    .innerJoin(orderItems, eq(orderItems.id, returnItems.orderItemId))
    .where(and(status ? eq(vendorClaims.status, status) : undefined, opts.vendorId ? eq(vendorClaims.vendorId, opts.vendorId) : undefined))
    .orderBy(desc(vendorClaims.createdAt), desc(returns.code))
    .limit(opts.limit ?? 300)
    .all()
    .map((r) => ({
      id: r.c.id,
      status: r.c.status,
      vendorId: r.c.vendorId,
      vendorName: r.vendor,
      returnId: r.retId,
      returnCode: r.retCode,
      product: `${r.snap.brand} ${r.snap.model} — ${r.snap.displayType}, ${r.snap.qualityGrade}, ${r.snap.color}`,
      sku: r.snap.sku,
      quantity: r.qty,
      claimPaisa: r.c.claimPaisa,
      creditPaisa: r.c.creditPaisa,
      reference: r.c.reference,
      notes: r.c.notes,
      createdAt: r.c.createdAt,
      sentAt: r.c.sentAt,
      resolvedAt: r.c.resolvedAt,
    }));
}

export type VendorClaimTotals = { open: number; sent: number; credited: number; rejected: number; owedPaisa: number; creditedPaisa: number };

/** What each supplier owes us in claims: still to send, waiting for their answer, credited so far. */
export function claimTotals(db: DB, vendorId?: string): VendorClaimTotals {
  const rows = db
    .select({ s: vendorClaims.status, n: sql<number>`count(*)`, claim: sql<number>`coalesce(sum(${vendorClaims.claimPaisa}), 0)`, credit: sql<number>`coalesce(sum(${vendorClaims.creditPaisa}), 0)` })
    .from(vendorClaims)
    .where(vendorId ? eq(vendorClaims.vendorId, vendorId) : undefined)
    .groupBy(vendorClaims.status)
    .all();
  const t: VendorClaimTotals = { open: 0, sent: 0, credited: 0, rejected: 0, owedPaisa: 0, creditedPaisa: 0 };
  for (const r of rows) {
    if (r.s === "OPEN") t.open = Number(r.n);
    if (r.s === "SENT") t.sent = Number(r.n);
    if (r.s === "CREDITED") t.credited = Number(r.n);
    if (r.s === "REJECTED") t.rejected = Number(r.n);
    if (r.s === "OPEN" || r.s === "SENT") t.owedPaisa += Number(r.claim);
    t.creditedPaisa += Number(r.credit);
  }
  return t;
}

const clean = (s: string | undefined, max: number) => (s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

/** One step on a claim. SEND: OPEN → SENT. CREDIT: OPEN/SENT → CREDITED with the credit received. REJECT: OPEN/SENT → REJECTED with a reason. */
export function updateClaim(
  db: DB,
  id: string,
  input: { actorId: string; action: string; reference?: string; creditPaisa?: number; notes?: string },
  ctx: AuditContext,
  now: Date = new Date(),
) {
  const reference = clean(input.reference, 60);
  const notes = clean(input.notes, 300);
  return withStockTransaction(db, (tx) => {
    const c = tx.select().from(vendorClaims).where(eq(vendorClaims.id, id)).get();
    if (!c) throw new ReturnError("Claim not found.");
    if (c.status === "CREDITED" || c.status === "REJECTED") throw new ReturnError("This claim is already settled.");
    const before = { status: c.status, creditPaisa: c.creditPaisa };
    if (input.action === "SEND") {
      if (c.status !== "OPEN") throw new ReturnError("This claim has already been sent.");
      tx.update(vendorClaims).set({ status: "SENT", sentAt: now.toISOString(), reference: reference || c.reference }).where(eq(vendorClaims.id, id)).run();
      writeAudit(tx, ctx, { actorId: input.actorId, action: "vendor_claim.sent", entity: "vendor_claims", entityId: id, before, after: { status: "SENT", reference: reference || undefined } });
      return { status: "SENT" as const };
    }
    if (input.action === "CREDIT") {
      const credit = input.creditPaisa ?? NaN;
      if (!Number.isInteger(credit) || credit <= 0) throw new ReturnError("Enter the credit the supplier gave, more than zero.");
      if (credit > c.claimPaisa) throw new ReturnError(`The credit can’t be more than the claim (Rs ${(c.claimPaisa / 100).toLocaleString("en-PK")}).`);
      tx.update(vendorClaims).set({ status: "CREDITED", creditPaisa: credit, resolvedAt: now.toISOString(), reference: reference || c.reference, notes: notes || c.notes }).where(eq(vendorClaims.id, id)).run();
      writeAudit(tx, ctx, { actorId: input.actorId, action: "vendor_claim.credited", entity: "vendor_claims", entityId: id, before, after: { status: "CREDITED", creditPaisa: credit, reference: reference || undefined } });
      return { status: "CREDITED" as const };
    }
    if (input.action === "REJECT") {
      if (notes.length < 3) throw new ReturnError("Write the supplier’s reason for rejecting the claim.");
      tx.update(vendorClaims).set({ status: "REJECTED", resolvedAt: now.toISOString(), notes }).where(eq(vendorClaims.id, id)).run();
      writeAudit(tx, ctx, { actorId: input.actorId, action: "vendor_claim.rejected", entity: "vendor_claims", entityId: id, before, after: { status: "REJECTED", notes } });
      return { status: "REJECTED" as const };
    }
    throw new ReturnError("Unknown claim step.");
  });
}
