import { and, asc, eq, gt, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connection";
import { brands, productImages, productVariants, products, promotions } from "@/db/schema";
import { paisa, toPaisa, type Paisa } from "@/lib/money";
import { checkCoupon } from "@/server/pricing/coupons";
import { effectivePrice } from "@/server/pricing/price";

/**
 * Cart pricing — BUILD_GUIDE M7, SPECIFICATION.md §6.3 step 1.
 * The browser keeps only { variantId, qty } (spec: client prices are never trusted). Every time the
 * cart is shown, this re-reads price and stock from the database. Checkout (M8) re-prices again
 * inside its own transaction; this quote is a preview, not a reservation.
 * Free of `server-only` so it can be unit-tested.
 */

export const MAX_CART_LINES = 30;
export const MAX_LINE_QTY = 99;

export const CartInputSchema = z.object({
  lines: z
    .array(z.object({ variantId: z.string().min(1).max(64), qty: z.number().int().min(1).max(MAX_LINE_QTY) }))
    .max(MAX_CART_LINES),
  coupon: z.string().max(40).optional(),
});
export type CartInput = z.infer<typeof CartInputSchema>;

/**
 * ok           — available in the quantity asked for
 * short        — fewer left than asked: only `available` can be bought
 * sold_out     — none left
 * unavailable  — removed from sale (unpublished, archived) or doesn't exist
 */
export type LineStatus = "ok" | "short" | "sold_out" | "unavailable";

export type QuotedLine = {
  variantId: string;
  qty: number;
  status: LineStatus;
  available: number;
  product: { slug: string; brand: string; model: string; grade: string; displayType: string; image: { url: string; alt: string } | null } | null;
  color: string | null;
  variantLabel: string | null;
  unitPaisa: Paisa;
  originalUnitPaisa: Paisa;
  /** What this line adds to the subtotal: only units that can actually be bought. */
  lineTotalPaisa: Paisa;
  lowStock: boolean;
};

export type CartQuote = {
  lines: QuotedLine[];
  itemCount: number;
  subtotalPaisa: Paisa;
  savingsPaisa: Paisa;
  /** True when every line is buyable in full — the cart may go to checkout as it is. */
  ready: boolean;
  coupon: { code: string; ok: true; discountPaisa: Paisa } | { code: string; ok: false; reason: string } | null;
  totalBeforeDeliveryPaisa: Paisa;
};

export function quoteCart(db: DB, input: CartInput, now: Date = new Date()): CartQuote {
  // Merge duplicate lines for the same colour
  const merged = new Map<string, number>();
  for (const l of input.lines) merged.set(l.variantId, Math.min(MAX_LINE_QTY, (merged.get(l.variantId) ?? 0) + l.qty));
  const ids = [...merged.keys()];

  const rows = ids.length
    ? db
        .select({ v: productVariants, p: products, brandActive: brands.isActive })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .leftJoin(brands, eq(brands.name, products.brand))
        .where(inArray(productVariants.id, ids))
        .all()
    : [];
  const byId = new Map(rows.map((r) => [r.v.id, r]));
  const productIds = [...new Set(rows.map((r) => r.p.id))];
  const images = productIds.length
    ? db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)).all()
    : [];
  const iso = now.toISOString();
  const promos = db
    .select()
    .from(promotions)
    .where(and(eq(promotions.isActive, true), lte(promotions.startsAt, iso), gt(promotions.endsAt, iso)))
    .all();

  const lines: QuotedLine[] = ids.map((variantId) => {
    const qty = merged.get(variantId)!;
    const r = byId.get(variantId);
    const sellable = r && r.p.isPublished && !r.p.archivedAt && !r.v.archivedAt && r.brandActive;
    if (!r || !sellable) {
      return { variantId, qty, status: "unavailable", available: 0, product: null, color: r?.v.color ?? null, variantLabel: r?.v.variantLabel ?? null, unitPaisa: paisa(0), originalUnitPaisa: paisa(0), lineTotalPaisa: paisa(0), lowStock: false };
    }
    const price = effectivePrice(
      {
        productId: r.p.id,
        brand: r.p.brand,
        categoryId: r.p.categoryId,
        retailPaisa: toPaisa(r.p.retailPricePKR),
        salePaisa: r.p.salePricePKR === null ? null : toPaisa(r.p.salePricePKR),
        saleStartsAt: r.p.saleStartsAt,
        saleEndsAt: r.p.saleEndsAt,
      },
      promos,
      now,
    );
    // Prefer a photo of this colour, then any photo of the product
    const img = images.find((i) => i.productId === r.p.id && i.variantId === variantId) ?? images.find((i) => i.productId === r.p.id && !i.variantId) ?? images.find((i) => i.productId === r.p.id);
    const stock = Math.max(0, r.v.currentStock);
    const status: LineStatus = stock === 0 ? "sold_out" : stock < qty ? "short" : "ok";
    const buyable = Math.min(qty, stock);
    return {
      variantId,
      qty,
      status,
      available: stock,
      product: { slug: r.p.slug, brand: r.p.brand, model: r.p.model, grade: r.p.qualityGrade, displayType: r.p.displayType, image: img ? { url: img.url, alt: img.alt } : null },
      color: r.v.color,
      variantLabel: r.v.variantLabel,
      unitPaisa: price.finalPaisa,
      originalUnitPaisa: price.originalPaisa,
      lineTotalPaisa: paisa(price.finalPaisa * buyable),
      lowStock: stock > 0 && stock <= r.p.lowStockThreshold,
    };
  });

  const subtotal = paisa(lines.reduce((n, l) => n + l.lineTotalPaisa, 0));
  const savings = paisa(lines.reduce((n, l) => n + (l.originalUnitPaisa - l.unitPaisa) * Math.min(l.qty, l.available), 0));
  const itemCount = lines.reduce((n, l) => n + (l.status === "unavailable" ? 0 : Math.min(l.qty, l.available)), 0);

  let coupon: CartQuote["coupon"] = null;
  const code = input.coupon?.trim();
  if (code) {
    if (subtotal <= 0) coupon = { code, ok: false, reason: "Add something to your cart first." };
    else {
      const r = checkCoupon(db, code, subtotal, now);
      coupon = r.ok ? { code: r.code, ok: true, discountPaisa: r.discountPaisa } : { code, ok: false, reason: r.reason };
    }
  }
  const discount = coupon?.ok ? coupon.discountPaisa : 0;

  return {
    lines,
    itemCount,
    subtotalPaisa: subtotal,
    savingsPaisa: savings,
    ready: lines.length > 0 && lines.every((l) => l.status === "ok"),
    coupon,
    totalBeforeDeliveryPaisa: paisa(Math.max(0, subtotal - discount)),
  };
}
