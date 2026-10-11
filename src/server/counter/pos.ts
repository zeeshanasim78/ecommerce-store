import { and, asc, desc, eq, gt, gte, inArray, isNull, like, lt, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB, Tx } from "@/db/connection";
import { customers, orderItems, orders, payments, productVariants, products, promotions, user } from "@/db/schema";
import type { ProductSnapshot } from "@/db/schema/orders";
import { COUNTER_METHODS, type CounterMethod } from "@/lib/counter";
import { paisa, toPaisa, type Paisa } from "@/lib/money";
import { formatPkMobile, normalisePkMobile } from "@/lib/phone";
import { COUNTER_DISCOUNT_ROLES, COUNTER_NON_CASH_ROLES, TECHNICIAN_APPROVER_ROLES, type StaffRole } from "@/lib/permissions";
import { writeAudit, type AuditContext } from "@/server/audit-log";
import { InsufficientStockError, applyStockMovement, withStockTransaction } from "@/server/inventory/stock";
import { effectivePrice } from "@/server/pricing/price";

/**
 * Counter sale (POS) — Milestone 9, SPECIFICATION.md §6.4 and §25 (v1.13).
 *
 *   one BEGIN IMMEDIATE transaction:
 *     idempotency check → re-price every line from the database (retail or approved-technician
 *     wholesale) → manager discount → order (COUNTER, PAID, DELIVERED, created_by = cashier)
 *     → items (price, cost, warranty) → stock out through the engine (COUNTER_POS, operator = cashier)
 *     → payment row → audit entry
 *
 * Owner rules (Q54–Q56): cashiers and other staff take CASH only (cash received ≥ total, change shown);
 * only the OWNER records JazzCash / Easypaisa / bank transfer / card, with a transaction ID they confirm
 * is genuine and checked; a MANAGER/OWNER may take a rupee discount off the ticket with a reason;
 * wholesale prices only for technicians APPROVED in the customers table.
 * Free of Next.js imports so it can be unit-tested; the Server Actions wrap it.
 */

export { COUNTER_METHODS, COUNTER_METHOD_LABEL, type CounterMethod } from "@/lib/counter";
export const MAX_TICKET_LINES = 50;
export const MAX_TICKET_QTY = 99;
const REF = /^[A-Za-z0-9-]{6,30}$/;

export class CounterSaleError extends Error {
  constructor(
    message: string,
    public readonly kind: "INVALID" | "NOT_ALLOWED" | "SOLD_OUT" | "PRICE_CHANGED" | "PAYMENT" = "INVALID",
  ) {
    super(message);
  }
}

/** SQLite CURRENT_TIMESTAMP format (UTC), as used by orders.placed_at. */
export const sqliteTime = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);
/** Karachi calendar date "2026-10-04" for a moment. */
export const karachiDate = (d: Date) => new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
/** UTC bounds [start, end) of a Karachi calendar day, in placed_at format. */
export function karachiDayBounds(date: string): { start: string; end: string } {
  const start = Date.parse(`${date}T00:00:00+05:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(start)) throw new CounterSaleError("Choose a valid date.");
  return { start: sqliteTime(new Date(start)), end: sqliteTime(new Date(start + 24 * 3600_000)) };
}

// ───────────────────────────── Technicians (wholesale) ─────────────────────────────

export type Technician = { id: string; name: string; shopName: string | null; phone: string; phoneDisplay: string; city: string | null; status: "PENDING" | "APPROVED" | "REJECTED" };

function toTechnician(c: typeof customers.$inferSelect): Technician | null {
  if (c.customerType !== "TECHNICIAN" || !c.technicianStatus) return null;
  return { id: c.id, name: c.name, shopName: c.shopName, phone: c.phone, phoneDisplay: formatPkMobile(c.phone), city: c.city, status: c.technicianStatus };
}

/** A technician by mobile number (any status), or null. */
export function findTechnician(db: DB | Tx, phoneInput: string): Technician | null {
  const phone = normalisePkMobile(phoneInput);
  if (!phone) return null;
  const c = db.select().from(customers).where(eq(customers.phone, phone)).get();
  return c ? toTechnician(c) : null;
}

export const TechnicianSchema = z.object({
  name: z.string().trim().min(2, "Enter the technician’s name.").max(80),
  shopName: z.string().trim().min(2, "Enter the repair shop’s name.").max(80),
  phone: z
    .string()
    .transform((s) => normalisePkMobile(s))
    .pipe(z.string({ error: "Enter a Pakistani mobile number, like 0300 1234567." })),
  city: z.string().trim().max(60).optional(),
});

/**
 * Adds a technician (or turns an existing retail customer into one). Manager/owner additions are
 * APPROVED at once; anyone else's wait as PENDING (retail prices) until a manager approves.
 */
export function addTechnician(db: DB, raw: unknown, staff: { id: string; role: StaffRole }, ctx: AuditContext): Technician {
  const parsed = TechnicianSchema.safeParse(raw);
  if (!parsed.success) throw new CounterSaleError(parsed.error.issues[0]?.message ?? "Check the technician’s details.");
  const t = parsed.data;
  const status = TECHNICIAN_APPROVER_ROLES.includes(staff.role) ? "APPROVED" : "PENDING";
  return withStockTransaction(db, (tx) => {
    const existing = tx.select().from(customers).where(eq(customers.phone, t.phone)).get();
    if (existing && existing.customerType === "TECHNICIAN") throw new CounterSaleError(`${formatPkMobile(t.phone)} is already a technician (${existing.technicianStatus?.toLowerCase()}).`);
    const values = { name: t.name, shopName: t.shopName, city: t.city || null, customerType: "TECHNICIAN" as const, technicianStatus: status as Technician["status"] };
    let id: string;
    if (existing) {
      tx.update(customers).set(values).where(eq(customers.id, existing.id)).run();
      id = existing.id;
    } else {
      id = crypto.randomUUID();
      tx.insert(customers).values({ id, phone: t.phone, ...values }).run();
    }
    writeAudit(tx, ctx, { actorId: staff.id, action: "technician.create", entity: "customers", entityId: id, before: existing ? { customerType: existing.customerType } : null, after: { ...values, phone: t.phone } });
    return toTechnician(tx.select().from(customers).where(eq(customers.id, id)).get()!)!;
  });
}

/** Manager/owner approves or rejects a technician (audited). */
export function setTechnicianStatus(db: DB, customerId: string, status: "APPROVED" | "REJECTED" | "PENDING", staff: { id: string; role: StaffRole }, ctx: AuditContext): Technician {
  if (!TECHNICIAN_APPROVER_ROLES.includes(staff.role)) throw new CounterSaleError("Only a manager or the owner can approve technicians.", "NOT_ALLOWED");
  return withStockTransaction(db, (tx) => {
    const c = tx.select().from(customers).where(eq(customers.id, customerId)).get();
    const before = c && toTechnician(c);
    if (!before) throw new CounterSaleError("Technician not found.");
    if (before.status === status) return before;
    tx.update(customers).set({ technicianStatus: status }).where(eq(customers.id, customerId)).run();
    writeAudit(tx, ctx, { actorId: staff.id, action: `technician.${status.toLowerCase()}`, entity: "customers", entityId: customerId, before: { technicianStatus: before.status }, after: { technicianStatus: status } });
    return { ...before, status };
  });
}

export function listTechnicians(db: DB, opts: { status?: Technician["status"]; q?: string } = {}): Technician[] {
  const q = opts.q?.trim();
  const phone = q ? normalisePkMobile(q) : null;
  return db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.customerType, "TECHNICIAN"),
        opts.status ? eq(customers.technicianStatus, opts.status) : undefined,
        q ? or(like(customers.name, `%${q}%`), like(customers.shopName, `%${q}%`), phone ? eq(customers.phone, phone) : undefined) : undefined,
      ),
    )
    .orderBy(sql`case ${customers.technicianStatus} when 'PENDING' then 0 when 'APPROVED' then 1 else 2 end`, asc(customers.name))
    .limit(200)
    .all()
    .map((c) => toTechnician(c)!)
    .filter(Boolean);
}

// ───────────────────────────── Search and pricing ─────────────────────────────

export type CounterItem = {
  variantId: string;
  sku: string;
  brand: string;
  model: string;
  grade: string;
  displayType: string;
  color: string;
  variantLabel: string | null;
  bin: string | null;
  stock: number;
  retailPaisa: Paisa;
  /** Retail before any sale/promotion — shown struck through when lower. */
  listPaisa: Paisa;
  wholesalePaisa: Paisa;
  warrantyDays: number;
  /** True when the code typed/scanned was this colour's SKU exactly. */
  exact: boolean;
};

type Row = { v: typeof productVariants.$inferSelect; p: typeof products.$inferSelect };

function activePromotions(db: DB | Tx, now: Date) {
  const iso = now.toISOString();
  return db.select().from(promotions).where(and(eq(promotions.isActive, true), lte(promotions.startsAt, iso), gt(promotions.endsAt, iso))).all();
}

function priceRows(db: DB | Tx, rows: Row[], now: Date, exactSku?: string): CounterItem[] {
  const promos = activePromotions(db, now);
  return rows.map(({ v, p }) => {
    const price = effectivePrice(
      { productId: p.id, brand: p.brand, categoryId: p.categoryId, retailPaisa: toPaisa(p.retailPricePKR), salePaisa: p.salePricePKR === null ? null : toPaisa(p.salePricePKR), saleStartsAt: p.saleStartsAt, saleEndsAt: p.saleEndsAt },
      promos,
      now,
    );
    // A technician never pays more than a walk-in customer would that day
    const wholesale = paisa(Math.min(toPaisa(p.wholesalePricePKR), price.finalPaisa));
    return {
      variantId: v.id,
      sku: v.variantSku,
      brand: p.brand,
      model: p.model,
      grade: p.qualityGrade,
      displayType: p.displayType,
      color: v.color,
      variantLabel: v.variantLabel,
      bin: v.binLocation,
      stock: Math.max(0, v.currentStock),
      retailPaisa: price.finalPaisa,
      listPaisa: price.originalPaisa,
      wholesalePaisa: wholesale,
      warrantyDays: p.warrantyDays,
      exact: !!exactSku && v.variantSku.toUpperCase() === exactSku,
    };
  });
}

/** Counter sells anything not archived — published or not (stock on the shelf may not be listed online yet). */
const sellable = and(isNull(products.archivedAt), isNull(productVariants.archivedAt));

/**
 * Scanner / keyboard search. An exact colour SKU (what a barcode holds) comes back alone with `exact`;
 * a product SKU returns its colours; otherwise words match brand, model, SKU, colour or grade.
 */
export function searchCounterItems(db: DB | Tx, query: string, now: Date = new Date(), limit = 12): CounterItem[] {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!q) return [];
  const upper = q.toUpperCase();
  const base = () => db.select({ v: productVariants, p: products }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId));

  const exact = base().where(and(sellable, sql`upper(${productVariants.variantSku}) = ${upper}`)).all();
  if (exact.length) return priceRows(db, exact, now, upper);
  const byProduct = base().where(and(sellable, sql`upper(${products.sku}) = ${upper}`)).orderBy(asc(productVariants.color)).all();
  if (byProduct.length) return priceRows(db, byProduct, now);

  const words = q.split(" ").filter(Boolean).slice(0, 5);
  const conditions = words.map((w) => {
    const pat = `%${w.replace(/[%_]/g, "")}%`;
    return or(like(products.brand, pat), like(products.model, pat), like(productVariants.variantSku, pat), like(products.sku, pat), like(productVariants.color, pat), like(products.qualityGrade, pat), like(products.displayType, pat));
  });
  const rows = base()
    .where(and(sellable, ...conditions))
    .orderBy(desc(sql`${productVariants.currentStock} > 0`), asc(products.brand), asc(products.model), asc(productVariants.color))
    .limit(limit)
    .all();
  return priceRows(db, rows, now);
}

export const TicketLineSchema = z.object({ variantId: z.string().min(1).max(64), qty: z.number().int().min(1, "Quantity must be at least 1.").max(MAX_TICKET_QTY, `At most ${MAX_TICKET_QTY} of one item.`) });
export type TicketLine = z.infer<typeof TicketLineSchema>;

export type PricedTicketLine = CounterItem & { qty: number; unitPaisa: Paisa; lineTotalPaisa: Paisa; short: boolean };
export type TicketQuote = { lines: PricedTicketLine[]; missing: string[]; subtotalPaisa: Paisa; itemCount: number; ready: boolean };

/** Prices a ticket for the chosen tier, straight from the database. Duplicate lines are merged. */
export function quoteTicket(db: DB | Tx, lines: TicketLine[], tier: "RETAIL" | "WHOLESALE", now: Date = new Date()): TicketQuote {
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.variantId, Math.min(MAX_TICKET_QTY, (merged.get(l.variantId) ?? 0) + l.qty));
  const ids = [...merged.keys()];
  const rows = ids.length ? db.select({ v: productVariants, p: products }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(sellable, inArray(productVariants.id, ids))).all() : [];
  const priced = new Map(priceRows(db, rows, now).map((i) => [i.variantId, i]));
  const out: PricedTicketLine[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const item = priced.get(id);
    if (!item) {
      missing.push(id);
      continue;
    }
    const qty = merged.get(id)!;
    const unit = tier === "WHOLESALE" ? item.wholesalePaisa : item.retailPaisa;
    out.push({ ...item, qty, unitPaisa: unit, lineTotalPaisa: paisa(unit * qty), short: item.stock < qty });
  }
  const subtotal = paisa(out.reduce((n, l) => n + l.lineTotalPaisa, 0));
  return { lines: out, missing, subtotalPaisa: subtotal, itemCount: out.reduce((n, l) => n + l.qty, 0), ready: out.length > 0 && missing.length === 0 && out.every((l) => !l.short) };
}

// ───────────────────────────── Completing a sale ─────────────────────────────

const money = z.number().int().min(0).max(100_000_000_00);

export const CounterSaleSchema = z.object({
  idempotencyKey: z.uuid(),
  lines: z.array(TicketLineSchema).min(1, "The ticket is empty — scan or search for an item.").max(MAX_TICKET_LINES, `At most ${MAX_TICKET_LINES} lines on one ticket.`),
  tier: z.enum(["RETAIL", "WHOLESALE"]).default("RETAIL"),
  technicianPhone: z.string().trim().max(20).optional(),
  customerName: z.string().trim().max(80).optional(),
  customerPhone: z.string().trim().max(20).optional(),
  method: z.enum(COUNTER_METHODS, { error: "Choose how the customer is paying." }),
  cashReceivedPaisa: money.optional(),
  reference: z.string().trim().max(40).optional(),
  referenceConfirmed: z.boolean().optional(),
  discountPaisa: money.default(0),
  discountReason: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(300).optional(),
  /** The total on the cashier's screen. If prices moved since, nothing is saved. */
  expectedTotalPaisa: money,
});
export type CounterSaleInput = z.input<typeof CounterSaleSchema>;

export type CounterSaleResult = {
  orderId: string;
  code: string;
  totalPaisa: Paisa;
  changePaisa: Paisa;
  repeated: boolean;
};

/** CA-POS-261004-0001: Karachi date + that day's running number (counter sales have their own series). */
function nextCounterCode(tx: Tx, now: Date): string {
  const prefix = `CA-POS-${karachiDate(now).slice(2).replaceAll("-", "")}-`;
  const row = tx
    .select({ n: sql<number | null>`max(cast(substr(${orders.code}, ${prefix.length + 1}) as integer))` })
    .from(orders)
    .where(sql`${orders.code} like ${prefix + "%"}`)
    .get();
  return `${prefix}${String((row?.n ?? 0) + 1).padStart(4, "0")}`;
}

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000).toISOString();

export function completeCounterSale(db: DB, raw: unknown, staff: { id: string; role: StaffRole }, ctx: AuditContext, now: Date = new Date()): CounterSaleResult {
  const parsed = CounterSaleSchema.safeParse(raw);
  if (!parsed.success) throw new CounterSaleError(parsed.error.issues[0]?.message ?? "Check the ticket.");
  const input = parsed.data;
  const isCash = input.method === "CASH";

  // Owner rules — checked before anything is touched
  if (!isCash) {
    if (!COUNTER_NON_CASH_ROLES.includes(staff.role)) throw new CounterSaleError("Only the owner can take JazzCash, Easypaisa, bank transfer or card payments. Take cash, or call the owner.", "NOT_ALLOWED");
    if (!input.reference || !REF.test(input.reference)) throw new CounterSaleError("Enter the transaction ID (6–30 letters or numbers) from the shop’s account.", "PAYMENT");
    if (input.referenceConfirmed !== true) throw new CounterSaleError("Tick the box to confirm the transaction ID is genuine and you checked it in the shop’s account.", "PAYMENT");
  } else if (input.reference) {
    throw new CounterSaleError("A transaction ID is only for JazzCash, Easypaisa, bank or card payments.");
  }
  if (input.discountPaisa > 0) {
    if (!COUNTER_DISCOUNT_ROLES.includes(staff.role)) throw new CounterSaleError("Only a manager or the owner can give a discount.", "NOT_ALLOWED");
    if (!input.discountReason || input.discountReason.length < 3) throw new CounterSaleError("Write the reason for the discount.");
    if (input.discountPaisa % 100 !== 0) throw new CounterSaleError("Discounts are in whole rupees.");
  }
  const customerPhone = input.customerPhone ? normalisePkMobile(input.customerPhone) : null;
  if (input.customerPhone && !customerPhone) throw new CounterSaleError("Customer mobile: a Pakistani number like 0300 1234567, or leave it blank.");
  // Card payments get a prefix so a card slip number can never clash with a wallet transaction ID
  const reference = isCash ? null : `${input.method === "POS_CARD" ? "CARD-" : ""}${input.reference!.toUpperCase()}`;

  try {
    return withStockTransaction(db, (tx): CounterSaleResult => {
      // 1. Same key → this ticket was already saved (double press, network retry)
      const existing = tx.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).get();
      if (existing) {
        if (existing.channel !== "COUNTER" || existing.createdBy !== staff.id) throw new CounterSaleError("This ticket was already used. Start a new sale.");
        return { orderId: existing.id, code: existing.code, totalPaisa: paisa(existing.totalPaisa), changePaisa: paisa(Math.max(0, (existing.cashReceivedPaisa ?? existing.totalPaisa) - existing.totalPaisa)), repeated: true };
      }

      // 2. Wholesale only for an approved technician
      let technician: Technician | null = null;
      if (input.tier === "WHOLESALE") {
        technician = input.technicianPhone ? findTechnician(tx, input.technicianPhone) : null;
        if (!technician) throw new CounterSaleError("Wholesale prices are for registered technicians — find the technician by mobile number first.", "NOT_ALLOWED");
        if (technician.status !== "APPROVED") throw new CounterSaleError(`${technician.name} is ${technician.status === "PENDING" ? "waiting for a manager’s approval" : "not approved"} — sell at retail prices.`, "NOT_ALLOWED");
      }

      // 3. Re-price from the database
      const quote = quoteTicket(tx, input.lines, input.tier, now);
      if (quote.missing.length) throw new CounterSaleError("An item on the ticket is no longer on sale. Remove it and try again.", "SOLD_OUT");
      const short = quote.lines.find((l) => l.short);
      if (short) throw new CounterSaleError(`Only ${short.stock} left of ${short.brand} ${short.model} (${short.color}). Change the quantity.`, "SOLD_OUT");

      // 4. Totals and payment
      const subtotal = quote.subtotalPaisa;
      if (input.discountPaisa >= subtotal) throw new CounterSaleError("The discount must be less than the ticket total.");
      const total = paisa(subtotal - input.discountPaisa);
      if (input.expectedTotalPaisa !== total) throw new CounterSaleError(`The total changed to Rs ${(total / 100).toLocaleString("en-PK")} (a price was updated). Check the ticket and try again.`, "PRICE_CHANGED");
      let cashReceived: number | null = null;
      if (isCash) {
        if (input.cashReceivedPaisa === undefined) throw new CounterSaleError("Enter the cash received.", "PAYMENT");
        if (input.cashReceivedPaisa < total) throw new CounterSaleError(`Cash received is less than the total (Rs ${(total / 100).toLocaleString("en-PK")}).`, "PAYMENT");
        cashReceived = input.cashReceivedPaisa;
      } else {
        const used = tx.select({ id: payments.id }).from(payments).where(and(eq(payments.provider, "MANUAL"), eq(payments.manualReference, reference!))).get();
        if (used) throw new CounterSaleError("That transaction ID is already recorded on another sale or order. Check it in the shop’s account.", "PAYMENT");
      }

      // 5. Order, items, stock, payment, audit
      const orderId = crypto.randomUUID();
      const code = nextCounterCode(tx, now);
      const nowIso = now.toISOString();
      tx.insert(orders)
        .values({
          id: orderId,
          code,
          channel: "COUNTER",
          customerId: technician?.id ?? null,
          guestName: technician?.name ?? (input.customerName || null),
          guestPhone: technician?.phone ?? customerPhone,
          priceTier: input.tier,
          subtotalPaisa: subtotal,
          discountPaisa: input.discountPaisa,
          shippingFeePaisa: 0,
          codFeePaisa: 0,
          totalPaisa: total,
          displayCurrency: "PKR",
          paymentMethod: input.method,
          paymentStatus: "PAID",
          fulfillmentStatus: "DELIVERED",
          idempotencyKey: input.idempotencyKey,
          placedAt: sqliteTime(now),
          paidAt: nowIso,
          createdBy: staff.id,
          notes: input.notes || null,
          cashReceivedPaisa: cashReceived,
          discountReason: input.discountPaisa > 0 ? input.discountReason! : null,
        })
        .run();

      const costs = new Map(
        tx
          .select({ id: productVariants.id, cost: products.costPrice })
          .from(productVariants)
          .innerJoin(products, eq(products.id, productVariants.productId))
          .where(inArray(productVariants.id, quote.lines.map((l) => l.variantId)))
          .all()
          .map((r) => [r.id, toPaisa(r.cost)]),
      );
      for (const l of quote.lines) {
        const unitCost = costs.get(l.variantId)!;
        const snapshot: ProductSnapshot = { brand: l.brand, model: l.model, displayType: l.displayType, qualityGrade: l.grade, color: l.color, variantLabel: l.variantLabel, sku: l.sku };
        tx.insert(orderItems)
          .values({ orderId, variantId: l.variantId, productSnapshot: snapshot, quantity: l.qty, unitPricePaisa: l.unitPaisa, unitCostPaisa: unitCost, lineTotalPaisa: l.lineTotalPaisa, warrantyUntil: l.warrantyDays > 0 ? addDays(now, l.warrantyDays) : null })
          .run();
        applyStockMovement(tx, { variantId: l.variantId, delta: -l.qty, type: "COUNTER_POS", referenceType: "ORDER", referenceId: orderId, operatorId: staff.id, unitCostPaisa: unitCost, notes: code });
      }

      tx.insert(payments)
        .values({ orderId, provider: isCash ? "CASH" : "MANUAL", manualReference: reference, amountPaisa: total, currency: "PKR", status: "SUCCEEDED", verifiedBy: staff.id, verifiedAt: nowIso })
        .run();

      writeAudit(tx, ctx, {
        actorId: staff.id,
        action: "counter.sale",
        entity: "orders",
        entityId: orderId,
        after: {
          code,
          method: input.method,
          totalPaisa: total,
          subtotalPaisa: subtotal,
          tier: input.tier,
          ...(technician ? { technician: technician.phone } : {}),
          ...(input.discountPaisa > 0 ? { discountPaisa: input.discountPaisa, discountReason: input.discountReason } : {}),
          ...(reference ? { reference, referenceConfirmed: true } : {}),
          ...(cashReceived !== null ? { cashReceivedPaisa: cashReceived } : {}),
        },
      });

      return { orderId, code, totalPaisa: total, changePaisa: paisa(cashReceived === null ? 0 : cashReceived - total), repeated: false };
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) throw new CounterSaleError(`Not enough stock: only ${e.available} left of one item. Change the quantity.`, "SOLD_OUT");
    if (e instanceof Error && /UNIQUE constraint failed: payments/.test(e.message)) throw new CounterSaleError("That transaction ID is already recorded on another sale or order.", "PAYMENT");
    throw e;
  }
}

// ───────────────────────────── Receipts, recent sales, end of day ─────────────────────────────

export type CounterReceipt = {
  orderId: string;
  code: string;
  placedAt: string;
  cashierId: string | null;
  cashierName: string;
  tier: "RETAIL" | "WHOLESALE";
  customerName: string | null;
  customerPhone: string | null;
  technicianShop: string | null;
  method: CounterMethod;
  reference: string | null;
  items: { description: string; sku: string; qty: number; unitPaisa: Paisa; lineTotalPaisa: Paisa; warrantyUntil: string | null }[];
  subtotalPaisa: Paisa;
  discountPaisa: Paisa;
  discountReason: string | null;
  totalPaisa: Paisa;
  cashReceivedPaisa: Paisa | null;
  changePaisa: Paisa | null;
};

export function loadCounterReceipt(db: DB | Tx, by: { code?: string; orderId?: string }): CounterReceipt | null {
  const where = by.orderId ? eq(orders.id, by.orderId) : by.code ? eq(orders.code, by.code.trim().toUpperCase()) : null;
  if (!where) return null;
  const row = db.select({ o: orders, cashier: user.name }).from(orders).leftJoin(user, eq(user.id, orders.createdBy)).where(and(where, eq(orders.channel, "COUNTER"))).get();
  if (!row) return null;
  const o = row.o;
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).all();
  const pay = db.select().from(payments).where(eq(payments.orderId, o.id)).get();
  const tech = o.customerId ? db.select({ shop: customers.shopName }).from(customers).where(eq(customers.id, o.customerId)).get() : null;
  return {
    orderId: o.id,
    code: o.code,
    placedAt: o.placedAt,
    cashierId: o.createdBy,
    cashierName: row.cashier ?? "—",
    tier: o.priceTier,
    customerName: o.guestName,
    customerPhone: o.guestPhone ? formatPkMobile(o.guestPhone) : null,
    technicianShop: tech?.shop ?? null,
    method: o.paymentMethod as CounterMethod,
    reference: pay?.manualReference ?? null,
    items: items.map((i) => ({
      description: `${i.productSnapshot.brand} ${i.productSnapshot.model} — ${i.productSnapshot.qualityGrade}, ${i.productSnapshot.color}${i.productSnapshot.variantLabel ? ` (${i.productSnapshot.variantLabel})` : ""}`,
      sku: i.productSnapshot.sku,
      qty: i.quantity,
      unitPaisa: paisa(i.unitPricePaisa),
      lineTotalPaisa: paisa(i.lineTotalPaisa),
      warrantyUntil: i.warrantyUntil,
    })),
    subtotalPaisa: paisa(o.subtotalPaisa),
    discountPaisa: paisa(o.discountPaisa),
    discountReason: o.discountReason,
    totalPaisa: paisa(o.totalPaisa),
    cashReceivedPaisa: o.cashReceivedPaisa === null ? null : paisa(o.cashReceivedPaisa),
    changePaisa: o.cashReceivedPaisa === null ? null : paisa(o.cashReceivedPaisa - o.totalPaisa),
  };
}

export type RecentSale = { orderId: string; code: string; placedAt: string; totalPaisa: Paisa; method: CounterMethod; items: number; cashier: string; tier: "RETAIL" | "WHOLESALE" };

export function recentCounterSales(db: DB, opts: { cashierId?: string; date: string; limit?: number }): RecentSale[] {
  const { start, end } = karachiDayBounds(opts.date);
  return db
    .select({ orderId: orders.id, code: orders.code, placedAt: orders.placedAt, total: orders.totalPaisa, method: orders.paymentMethod, tier: orders.priceTier, cashier: user.name, items: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})` })
    .from(orders)
    .leftJoin(user, eq(user.id, orders.createdBy))
    .where(and(eq(orders.channel, "COUNTER"), gte(orders.placedAt, start), lt(orders.placedAt, end), opts.cashierId ? eq(orders.createdBy, opts.cashierId) : undefined))
    .orderBy(desc(orders.placedAt), desc(orders.code))
    .limit(opts.limit ?? 20)
    .all()
    .map((r) => ({ orderId: r.orderId, code: r.code, placedAt: r.placedAt, totalPaisa: paisa(r.total), method: r.method as CounterMethod, items: Number(r.items), cashier: r.cashier ?? "—", tier: r.tier }));
}

export type CashierSummary = {
  cashierId: string;
  cashierName: string;
  sales: number;
  items: number;
  totalPaisa: Paisa;
  /** Cash that should be in the drawer from this person's sales (sale totals, change already given back). */
  cashPaisa: Paisa;
  byMethod: Partial<Record<CounterMethod, { sales: number; totalPaisa: Paisa }>>;
  wholesaleSales: number;
  wholesalePaisa: Paisa;
  discountPaisa: Paisa;
  discounts: number;
  firstSaleAt: string;
  lastSaleAt: string;
};
export type DaySummary = { date: string; cashiers: CashierSummary[]; all: Omit<CashierSummary, "cashierId" | "cashierName" | "firstSaleAt" | "lastSaleAt"> };

/** End-of-day totals per cashier for a Karachi date (spec §7 Counter Sale). Counter sales only. */
export function counterDaySummary(db: DB, opts: { date: string; cashierId?: string }): DaySummary {
  const { start, end } = karachiDayBounds(opts.date);
  const rows = db
    .select({ o: orders, cashier: user.name, items: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})` })
    .from(orders)
    .leftJoin(user, eq(user.id, orders.createdBy))
    .where(and(eq(orders.channel, "COUNTER"), gte(orders.placedAt, start), lt(orders.placedAt, end), opts.cashierId ? eq(orders.createdBy, opts.cashierId) : undefined))
    .orderBy(asc(orders.placedAt))
    .all();

  const empty = () => ({ sales: 0, items: 0, totalPaisa: paisa(0), cashPaisa: paisa(0), byMethod: {}, wholesaleSales: 0, wholesalePaisa: paisa(0), discountPaisa: paisa(0), discounts: 0 }) as DaySummary["all"];
  const add = (s: DaySummary["all"], o: typeof orders.$inferSelect, items: number) => {
    const m = o.paymentMethod as CounterMethod;
    s.sales += 1;
    s.items += items;
    s.totalPaisa = paisa(s.totalPaisa + o.totalPaisa);
    if (m === "CASH") s.cashPaisa = paisa(s.cashPaisa + o.totalPaisa);
    const bm = s.byMethod[m] ?? { sales: 0, totalPaisa: paisa(0) };
    s.byMethod[m] = { sales: bm.sales + 1, totalPaisa: paisa(bm.totalPaisa + o.totalPaisa) };
    if (o.priceTier === "WHOLESALE") {
      s.wholesaleSales += 1;
      s.wholesalePaisa = paisa(s.wholesalePaisa + o.totalPaisa);
    }
    if (o.discountPaisa > 0) {
      s.discounts += 1;
      s.discountPaisa = paisa(s.discountPaisa + o.discountPaisa);
    }
  };

  const per = new Map<string, CashierSummary>();
  const all = empty();
  for (const r of rows) {
    const id = r.o.createdBy ?? "unknown";
    let c = per.get(id);
    if (!c) {
      c = { cashierId: id, cashierName: r.cashier ?? "—", ...empty(), firstSaleAt: r.o.placedAt, lastSaleAt: r.o.placedAt };
      per.set(id, c);
    }
    add(c, r.o, Number(r.items));
    c.lastSaleAt = r.o.placedAt;
    add(all, r.o, Number(r.items));
  }
  return { date: opts.date, cashiers: [...per.values()].sort((a, b) => a.cashierName.localeCompare(b.cashierName)), all };
}
