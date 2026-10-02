import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productVariants, products, purchaseOrderItems, purchaseOrders, stockLedger, user, vendors } from "@/db/schema";
import { foreignToPaisa } from "@/server/purchasing/costing";
import { previewLandedCosts } from "@/server/purchasing/purchase-orders";

/** Everything the PO page and its printout show. */
export function loadPurchaseOrder(id: string) {
  const row = db
    .select({ po: purchaseOrders, vendor: vendors, createdByName: user.name })
    .from(purchaseOrders)
    .innerJoin(vendors, eq(vendors.id, purchaseOrders.vendorId))
    .leftJoin(user, eq(user.id, purchaseOrders.createdBy))
    .where(eq(purchaseOrders.id, id))
    .get();
  if (!row) return null;
  const { po } = row;

  const preview = previewLandedCosts(db, id);
  const lines = db
    .select({
      line: purchaseOrderItems,
      brand: products.brand,
      model: products.model,
      grade: products.qualityGrade,
      productId: products.id,
      color: productVariants.color,
      variantLabel: productVariants.variantLabel,
      variantSku: productVariants.variantSku,
    })
    .from(purchaseOrderItems)
    .innerJoin(productVariants, eq(productVariants.id, purchaseOrderItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(purchaseOrderItems.poId, id))
    .orderBy(asc(products.brand), asc(products.model), asc(productVariants.variantSku))
    .all()
    .map((l) => ({
      ...l,
      remaining: l.line.qtyOrdered - l.line.qtyReceived,
      lineValueForeign: l.line.qtyOrdered * l.line.unitCostForeign,
      landedUnitPaisa: l.line.landedUnitCostPaisa ?? preview.get(l.line.id) ?? 0,
    }));

  const goodsForeign = lines.reduce((n, l) => n + l.lineValueForeign, 0);
  const goodsPaisa = lines.reduce((n, l) => n + foreignToPaisa(l.line.unitCostForeign, po.fxRateToPkr) * l.line.qtyOrdered, 0);
  const extrasPaisa = po.shippingCostPaisa + po.customsDutyPaisa + po.otherLandedCostPaisa;
  const anyReceived = lines.some((l) => l.line.qtyReceived > 0);

  const movements = db
    .select({ id: stockLedger.id, timestamp: stockLedger.timestamp, qty: stockLedger.quantityChanged, variantSku: productVariants.variantSku, operator: user.name })
    .from(stockLedger)
    .innerJoin(productVariants, eq(productVariants.id, stockLedger.variantId))
    .leftJoin(user, eq(user.id, stockLedger.operatorId))
    .where(and(eq(stockLedger.referenceType, "PO"), eq(stockLedger.referenceId, id)))
    .orderBy(asc(stockLedger.timestamp))
    .all();

  return { ...row, lines, goodsForeign, goodsPaisa, extrasPaisa, anyReceived, movements };
}

/** Variants that can be added to a PO, grouped by product for the picker. */
export function orderableVariants() {
  const rows = db
    .select({ id: productVariants.id, color: productVariants.color, label: productVariants.variantLabel, sku: productVariants.variantSku, stock: productVariants.currentStock, productArchived: products.archivedAt, variantArchived: productVariants.archivedAt, brand: products.brand, model: products.model, grade: products.qualityGrade })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .orderBy(asc(products.brand), asc(products.model), asc(products.qualityGrade), asc(productVariants.variantSku))
    .all()
    .filter((r) => !r.productArchived && !r.variantArchived);
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.brand} ${r.model} — ${r.grade}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return groups;
}
