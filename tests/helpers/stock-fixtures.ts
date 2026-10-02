import type { DB } from "@/db/connection";
import { brands, productVariants, products, SYSTEM_USER_ID } from "@/db/schema";
import { applyStockMovement, withStockTransaction } from "@/server/inventory/stock";

/** One brand, one product and one variant holding `openingStock` units (written through the engine). */
export function createVariant(db: DB, openingStock = 0, suffix = "1"): { productId: string; variantId: string } {
  const productId = `p-${suffix}`;
  const variantId = `v-${suffix}`;
  db.insert(brands).values({ name: "Samsung", slug: "samsung" }).onConflictDoNothing().run();
  db.insert(products)
    .values({
      id: productId,
      brand: "Samsung",
      model: `Galaxy Test ${suffix}`,
      displayType: "AMOLED",
      qualityGrade: "OEM Original",
      sku: `TEST-${suffix}`,
      slug: `galaxy-test-${suffix}`,
      costPrice: 1000,
      retailPricePKR: 1500,
      wholesalePricePKR: 1300,
    })
    .run();
  db.insert(productVariants).values({ id: variantId, productId, color: "Black", variantSku: `TEST-${suffix}-BLK` }).run();
  if (openingStock > 0) {
    withStockTransaction(db, (tx) =>
      applyStockMovement(tx, { variantId, delta: openingStock, type: "OPENING_BALANCE", operatorId: SYSTEM_USER_ID }),
    );
  }
  return { productId, variantId };
}
