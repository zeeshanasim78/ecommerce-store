import "server-only";
import { revalidatePath } from "next/cache";

/** Refresh every cached storefront page after an admin change (hero, products, prices, promotions). */
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
