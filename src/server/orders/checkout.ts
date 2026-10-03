import { and, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB, Tx } from "@/db/connection";
import { couponRedemptions, coupons, deliveryZones, orderItems, orders, payments, productVariants, products, SYSTEM_USER_ID } from "@/db/schema";
import type { ShippingAddressSnapshot } from "@/db/schema/orders";
import { paisa, toPaisa, type Paisa } from "@/lib/money";
import { formatPkMobile, normalisePkMobile } from "@/lib/phone";
import { CouponRejectedError, checkCoupon, redeemCoupon } from "@/server/pricing/coupons";
import { InsufficientStockError, applyStockMovement, withStockTransaction } from "@/server/inventory/stock";
import { MANUAL_METHODS, CHECKOUT_METHODS, availableMethods, getCheckoutSettings, type CheckoutMethod } from "@/server/settings/store-settings";
import { CartInputSchema, quoteCart, type QuotedLine } from "@/server/storefront/cart";
import { issueOrderToken } from "./access";

/**
 * Online checkout — SPECIFICATION.md §6.3, §8 (manual wallet / bank transfer, COD).
 * One BEGIN IMMEDIATE transaction: idempotency check → re-price every line from the database →
 * fees → coupon redemption → order + items → stock out through the engine (STORE_SALE) → payment row.
 * Anything wrong throws inside the transaction, so nothing is half-saved.
 * Free of Next.js imports so it can be unit-tested; the Server Action wraps it.
 */

const TID = /^[A-Za-z0-9-]{6,30}$/;

export const CheckoutSchema = z.object({
  idempotencyKey: z.uuid(),
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  phone: z
    .string()
    .transform((s) => normalisePkMobile(s))
    .pipe(z.string({ error: "Enter a Pakistani mobile number, like 0300 1234567." })),
  // v1.11 owner decision: email is required — the order details, payment steps and dispatch news go there
  email: z
    .string({ error: "Enter your email — we send your order details and updates there." })
    .trim()
    .toLowerCase()
    .max(120)
    .pipe(z.email("Enter a valid email address, like name@gmail.com.")),
  line1: z.string().trim().min(5, "Enter your house and street.").max(120),
  line2: z.string().trim().max(120).optional(),
  area: z.string().trim().max(60).optional(),
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{5})?$/, "Postal code: 5 digits, or leave it blank.")
    .optional(),
  cityId: z.string().min(1, "Choose your city."),
  notes: z.string().trim().max(500).optional(),
  method: z.enum(CHECKOUT_METHODS, { error: "Choose how you’ll pay." }),
  tid: z
    .string()
    .trim()
    .optional()
    .refine((s) => !s || TID.test(s), "The transaction ID should be 6–30 letters or numbers, as shown in your wallet app."),
  payerPhone: z.string().trim().optional(),
  lines: CartInputSchema.shape.lines.min(1, "Your cart is empty."),
  coupon: z.string().trim().max(40).optional(),
  /** The total the shopper saw on the review step. If prices moved since, they're asked to confirm. */
  expectedTotalPaisa: z.number().int().nonnegative().optional(),
});
export type CheckoutInput = z.input<typeof CheckoutSchema>;

export type CheckoutFailure = {
  ok: false;
  kind: "INVALID" | "SOLD_OUT" | "PRICE_CHANGED" | "COUPON" | "PAYMENT";
  message: string;
  problemLines?: Pick<QuotedLine, "variantId" | "status" | "available">[];
  totalPaisa?: Paisa;
};
/** `accessToken` opens the full order details (v1.11 §23): set as a cookie and put in the order email. */
export type CheckoutSuccess = { ok: true; orderId: string; code: string; totalPaisa: Paisa; method: CheckoutMethod; repeated: boolean; accessToken: string };
export type CheckoutResult = CheckoutSuccess | CheckoutFailure;

class CheckoutRejected extends Error {
  constructor(public readonly failure: CheckoutFailure) {
    super(failure.message);
  }
}
const reject = (kind: CheckoutFailure["kind"], message: string, extra: Partial<CheckoutFailure> = {}): never => {
  throw new CheckoutRejected({ ok: false, kind, message, ...extra });
};

/** CA-ORD-261003-0001: Karachi date + that day's running number. */
function nextOrderCode(tx: Tx, now: Date): string {
  const day = new Date(now.getTime() + 5 * 3600_000).toISOString().slice(2, 10).replaceAll("-", "");
  const prefix = `CA-ORD-${day}-`;
  const row = tx
    .select({ n: sql<number | null>`max(cast(substr(${orders.code}, ${prefix.length + 1}) as integer))` })
    .from(orders)
    .where(sql`${orders.code} like ${prefix + "%"}`)
    .get();
  return `${prefix}${String((row?.n ?? 0) + 1).padStart(4, "0")}`;
}

export function placeOrder(db: DB, raw: unknown, now: Date = new Date()): CheckoutResult {
  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, kind: "INVALID", message: parsed.error.issues[0]?.message ?? "Check the form." };
  const input = parsed.data;
  const isManual = MANUAL_METHODS.includes(input.method);
  const payerPhone = input.payerPhone ? normalisePkMobile(input.payerPhone) : null;
  if (input.payerPhone && !payerPhone) return { ok: false, kind: "INVALID", message: "The number you paid from should be a mobile number, like 0300 1234567." };
  if (input.tid && !isManual) return { ok: false, kind: "INVALID", message: "A transaction ID is only needed for wallet or bank payments." };

  try {
    return withStockTransaction(db, (tx): CheckoutSuccess => {
      // 1. Same idempotency key → the order already exists (double click, network retry)
      const existing = tx.select({ id: orders.id, code: orders.code, total: orders.totalPaisa, method: orders.paymentMethod }).from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).get();
      // A fresh token for the same browser (only hashes are stored, so the first one can't be handed back)
      if (existing) return { ok: true, orderId: existing.id, code: existing.code, totalPaisa: paisa(existing.total), method: existing.method as CheckoutMethod, repeated: true, accessToken: issueOrderToken(tx, existing.id, now) };

      // 2. Payment method and delivery city
      const settings = getCheckoutSettings(tx);
      if (!availableMethods(settings).includes(input.method)) {
        reject("PAYMENT", input.method === "COD" && settings.codPaused ? "Cash on delivery is paused right now. Please choose bank transfer or a wallet — you can pay after placing the order." : "That payment method isn’t available right now. Choose another one.");
      }
      const zone = tx.select().from(deliveryZones).where(and(eq(deliveryZones.id, input.cityId), eq(deliveryZones.isActive, true))).get();
      if (!zone) reject("INVALID", "We don’t deliver to that city yet. Choose another city or call us.");
      if (input.method === "COD" && !zone!.codAvailable) reject("PAYMENT", `Cash on delivery isn’t available in ${zone!.city}. Choose a wallet or bank transfer.`);

      // 3. Re-price every line from the database (client prices are never trusted)
      const quote = quoteCart(tx, { lines: input.lines }, now);
      if (!quote.ready) {
        const problems = quote.lines.filter((l) => l.status !== "ok");
        const soldOut = problems.some((l) => l.status === "sold_out");
        reject("SOLD_OUT", soldOut ? "Sorry — something in your cart has just sold out. We’ve updated your cart." : "Some items in your cart have fewer left than you asked for. We’ve updated your cart.", {
          problemLines: problems.map(({ variantId, status, available }) => ({ variantId, status, available })),
        });
      }

      // 4. Totals
      const subtotal = quote.subtotalPaisa;
      let discount = 0;
      if (input.coupon) {
        const c = checkCoupon(tx, input.coupon, subtotal, now);
        if (!c.ok) reject("COUPON", `Code ${input.coupon.toUpperCase()}: ${c.reason}`);
        else discount = c.discountPaisa;
      }
      // v1.12 owner: delivery is free when the customer pays in advance (switch in Shop settings)
      const shipping = isManual && settings.prepaidFreeDelivery ? 0 : zone!.shippingFeePaisa;
      const codFee = input.method === "COD" ? zone!.codFeePaisa : 0;
      const total = paisa(subtotal - discount + shipping + codFee);
      if (input.method === "COD" && total > settings.codMaxPaisa) {
        reject("PAYMENT", `Cash on delivery is available for orders up to Rs ${(settings.codMaxPaisa / 100).toLocaleString("en-PK")}. Please choose bank transfer or a wallet — you can pay after placing the order.`);
      }
      if (input.expectedTotalPaisa !== undefined && input.expectedTotalPaisa !== total) {
        reject("PRICE_CHANGED", "A price changed while you were checking out. Please check the new total and place the order again.", { totalPaisa: total });
      }
      if (input.tid) {
        const used = tx.select({ id: payments.id }).from(payments).where(and(eq(payments.provider, "MANUAL"), eq(payments.manualReference, input.tid.toUpperCase()))).get();
        if (used) reject("PAYMENT", "That transaction ID has already been used for another order. Check the ID in your wallet app.");
      }

      // 5. Order, items, stock, coupon, payment
      const orderId = crypto.randomUUID();
      const code = nextOrderCode(tx, now);
      const address: ShippingAddressSnapshot = {
        name: input.name,
        phone: input.phone,
        line1: input.line1,
        ...(input.line2 ? { line2: input.line2 } : {}),
        ...(input.area ? { area: input.area } : {}),
        city: zone!.city,
        ...(input.postalCode ? { postalCode: input.postalCode } : {}),
      };
      const paymentStatus = input.method === "COD" ? "COD_PENDING" : input.tid ? "PENDING_VERIFICATION" : "UNPAID";
      tx.insert(orders)
        .values({
          id: orderId,
          code,
          channel: "ONLINE",
          guestName: input.name,
          guestPhone: input.phone,
          guestEmail: input.email,
          shippingAddress: address,
          cityId: zone!.id,
          priceTier: "RETAIL",
          subtotalPaisa: subtotal,
          discountPaisa: discount,
          shippingFeePaisa: shipping,
          codFeePaisa: codFee,
          totalPaisa: total,
          displayCurrency: "PKR",
          paymentMethod: input.method,
          paymentStatus,
          fulfillmentStatus: input.method === "COD" ? "CONFIRMED" : "NEW",
          idempotencyKey: input.idempotencyKey,
          notes: input.notes || null,
        })
        .run();

      const details = new Map(
        tx
          .select({ id: productVariants.id, sku: productVariants.variantSku, cost: products.costPrice })
          .from(productVariants)
          .innerJoin(products, eq(products.id, productVariants.productId))
          .where(inArray(productVariants.id, quote.lines.map((l) => l.variantId)))
          .all()
          .map((r) => [r.id, r]),
      );
      for (const l of quote.lines) {
        const unitCost = toPaisa(details.get(l.variantId)!.cost);
        tx.insert(orderItems)
          .values({
            orderId,
            variantId: l.variantId,
            productSnapshot: { brand: l.product!.brand, model: l.product!.model, displayType: l.product!.displayType, qualityGrade: l.product!.grade, color: l.color!, variantLabel: l.variantLabel, sku: details.get(l.variantId)!.sku },
            quantity: l.qty,
            unitPricePaisa: l.unitPaisa,
            unitCostPaisa: unitCost,
            lineTotalPaisa: l.unitPaisa * l.qty,
          })
          .run();
        applyStockMovement(tx, { variantId: l.variantId, delta: -l.qty, type: "STORE_SALE", referenceType: "ORDER", referenceId: orderId, operatorId: SYSTEM_USER_ID, unitCostPaisa: unitCost, notes: code });
      }

      if (input.coupon) {
        const r = redeemCoupon(tx, { code: input.coupon, orderId, subtotalPaisa: subtotal, customerPhone: input.phone, now });
        if (r.discountPaisa !== discount) reject("COUPON", "Your discount code changed while you were checking out. Please try again.");
      }

      tx.insert(payments)
        .values({
          orderId,
          provider: isManual ? "MANUAL" : "CASH",
          manualReference: input.tid ? input.tid.toUpperCase() : null,
          payerMsisdn: payerPhone,
          amountPaisa: total,
          currency: "PKR",
          status: input.tid ? "PENDING" : "INITIATED",
        })
        .run();

      return { ok: true, orderId, code, totalPaisa: total, method: input.method, repeated: false, accessToken: issueOrderToken(tx, orderId, now) };
    });
  } catch (e) {
    if (e instanceof CheckoutRejected) return e.failure;
    if (e instanceof CouponRejectedError) return { ok: false, kind: "COUPON", message: e.reason };
    if (e instanceof InsufficientStockError) return { ok: false, kind: "SOLD_OUT", message: "Sorry — something in your cart has just sold out. We’ve updated your cart.", problemLines: [{ variantId: e.variantId, status: "sold_out", available: e.available }] };
    if (e instanceof Error && /UNIQUE constraint failed: payments/.test(e.message)) return { ok: false, kind: "PAYMENT", message: "That transaction ID has already been used for another order." };
    throw e;
  }
}

/** An order the customer can see after proving it's theirs with the phone number used at checkout. */
export function findCustomerOrder(db: DB, code: string, phoneInput: string) {
  const phone = normalisePkMobile(phoneInput);
  if (!phone) return null;
  const order = db.select().from(orders).where(and(eq(orders.code, code.trim().toUpperCase()), eq(orders.channel, "ONLINE"))).get();
  if (!order || order.guestPhone !== phone) return null;
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).all();
  const payment = db.select().from(payments).where(eq(payments.orderId, order.id)).get() ?? null;
  return { order, items, payment, phoneDisplay: formatPkMobile(phone) };
}

export class TidError extends Error {}

/** Customer adds the wallet/bank transaction ID after placing the order (spec §8 manual verification). */
export function submitTransactionId(db: DB, input: { code: string; phone: string; tid: string; payerPhone?: string }): void {
  const phone = normalisePkMobile(input.phone);
  const order = db.select({ id: orders.id, phone: orders.guestPhone }).from(orders).where(eq(orders.code, input.code.trim().toUpperCase())).get();
  if (!order || !phone || order.phone !== phone) throw new TidError("Order not found.");
  submitTransactionIdForOrder(db, order.id, input);
}

/** Same, for a customer already proven by the order's private link (v1.11 §23). */
export function submitTransactionIdForOrder(db: DB, orderId: string, input: { tid: string; payerPhone?: string }): void {
  const tid = input.tid.trim().toUpperCase();
  if (!TID.test(tid)) throw new TidError("The transaction ID should be 6–30 letters or numbers, as shown in your wallet app.");
  const payer = input.payerPhone?.trim() ? normalisePkMobile(input.payerPhone) : null;
  if (input.payerPhone?.trim() && !payer) throw new TidError("The number you paid from should be a mobile number, like 0300 1234567.");
  withStockTransaction(db, (tx) => {
    const order = tx.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order) throw new TidError("Order not found.");
    if (order.fulfillmentStatus === "CANCELLED") throw new TidError("This order was cancelled because payment didn’t arrive in time. Please place a new order.");
    if (!MANUAL_METHODS.includes(order.paymentMethod as CheckoutMethod) || order.paymentStatus !== "UNPAID") throw new TidError("This order isn’t waiting for a transaction ID.");
    const used = tx.select({ id: payments.id }).from(payments).where(and(eq(payments.provider, "MANUAL"), eq(payments.manualReference, tid), ne(payments.orderId, order.id))).get();
    if (used) throw new TidError("That transaction ID has already been used for another order. Check the ID in your wallet app.");
    tx.update(payments).set({ manualReference: tid, payerMsisdn: payer, status: "PENDING" }).where(eq(payments.orderId, order.id)).run();
    tx.update(orders).set({ paymentStatus: "PENDING_VERIFICATION" }).where(eq(orders.id, order.id)).run();
  });
}

/** SQLite CURRENT_TIMESTAMP format, for comparing with placed_at. */
const sqliteTime = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);

/**
 * Cron job "expire-unpaid" (spec §6.3 step 5): wallet/bank orders still UNPAID after the waiting
 * time are cancelled, their stock is returned (ORDER_CANCEL_RESTOCK) and any coupon use is given
 * back. Orders whose customer already sent a transaction ID are left for staff to check.
 */
export function expireUnpaidOrders(db: DB, now: Date = new Date()): string[] {
  const s = getCheckoutSettings(db);
  const cutoff = sqliteTime(new Date(now.getTime() - s.manualTtlMinutes * 60_000));
  const due = db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.channel, "ONLINE"), eq(orders.paymentStatus, "UNPAID"), ne(orders.fulfillmentStatus, "CANCELLED"), inArray(orders.paymentMethod, [...MANUAL_METHODS]), lt(orders.placedAt, cutoff)))
    .all();

  const cancelled: string[] = [];
  for (const { id } of due) {
    withStockTransaction(db, (tx) => {
      const order = tx.select().from(orders).where(eq(orders.id, id)).get();
      if (!order || order.paymentStatus !== "UNPAID" || order.fulfillmentStatus === "CANCELLED") return; // changed meanwhile
      cancelOrderInTx(tx, order, { reason: "Payment not received in time", operatorId: SYSTEM_USER_ID, now });
      cancelled.push(order.code);
    });
  }
  return cancelled;
}

/**
 * Cancels an order inside an open stock transaction: every item goes back on sale through the
 * stock engine (ORDER_CANCEL_RESTOCK), a coupon use is given back, the payment is closed.
 * Shared by the expiry job and the Orders admin (v1.11). The caller checks the order may be cancelled.
 */
export function cancelOrderInTx(tx: Tx, order: typeof orders.$inferSelect, opts: { reason: string; operatorId: string; now: Date; refundDue?: boolean }) {
  for (const item of tx.select().from(orderItems).where(eq(orderItems.orderId, order.id)).all()) {
    applyStockMovement(tx, { variantId: item.variantId, delta: item.quantity, type: "ORDER_CANCEL_RESTOCK", referenceType: "ORDER", referenceId: order.id, operatorId: opts.operatorId, unitCostPaisa: item.unitCostPaisa, notes: `${order.code}: ${opts.reason}`.slice(0, 300) });
  }
  const redemption = tx.select().from(couponRedemptions).where(eq(couponRedemptions.orderId, order.id)).get();
  if (redemption) {
    tx.delete(couponRedemptions).where(eq(couponRedemptions.id, redemption.id)).run();
    tx.update(coupons).set({ redemptionCount: sql`max(${coupons.redemptionCount} - 1, 0)` }).where(eq(coupons.id, redemption.couponId)).run();
  }
  tx.update(orders)
    .set({ fulfillmentStatus: "CANCELLED", cancelledAt: opts.now.toISOString(), cancelReason: opts.reason, ...(opts.refundDue ? { paymentStatus: "REFUNDED" as const } : {}) })
    .where(eq(orders.id, order.id))
    .run();
  tx.update(payments).set({ status: opts.refundDue ? "REFUNDED" : "FAILED" }).where(eq(payments.orderId, order.id)).run();
}
