"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { brands, categories, products, promotions } from "@/db/schema";
import { PROMOTION_SCOPES } from "@/db/schema/discounts";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { readDiscount } from "@/server/discount-forms";
import { checked, optionalText, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";

const go = (path: string, params: Record<string, string>) => redirect(`${path}?${new URLSearchParams(params)}`);

export async function savePromotion(formData: FormData) {
  const staff = await requireStaff("discounts");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/promotions/${id}` : "/admin/promotions/new";

  const discount = readDiscount(formData);
  if (!discount.success) go(formPath, { error: discount.error.issues[0]?.message ?? "Check the discount." });

  const scope = z.enum(PROMOTION_SCOPES).catch("ALL").parse(text(formData, "scope"));
  const scopeValue =
    scope === "BRAND" ? optionalText(formData, "scopeBrand") : scope === "CATEGORY" ? optionalText(formData, "scopeCategory") : scope === "PRODUCT" ? optionalText(formData, "scopeProduct") : null;
  if (scope !== "ALL" && !scopeValue) go(formPath, { error: "Choose which brand, category or product the promotion covers." });
  const exists =
    scope === "ALL" ||
    (scope === "BRAND" && db.select({ id: brands.id }).from(brands).where(eq(brands.name, scopeValue!)).get()) ||
    (scope === "CATEGORY" && db.select({ id: categories.id }).from(categories).where(eq(categories.id, scopeValue!)).get()) ||
    (scope === "PRODUCT" && db.select({ id: products.id }).from(products).where(eq(products.id, scopeValue!)).get());
  if (!exists) go(formPath, { error: "That brand, category or product no longer exists." });

  const name = text(formData, "name");
  if (name.length < 3 || name.length > 80) go(formPath, { error: "Give the promotion a name (3–80 characters)." });
  const bannerText = optionalText(formData, "bannerText");
  if (bannerText && bannerText.length > 120) go(formPath, { error: "Keep the banner text under 120 characters." });
  const showBanner = checked(formData, "showBanner");
  if (showBanner && !bannerText) go(formPath, { error: "Add banner text to show the promotion in the site banner." });

  const values = { name, bannerText, scope, scopeValue, ...discount.data!, isActive: checked(formData, "isActive"), showBanner };
  const ctx = await auditContext();
  let savedId = id;
  db.transaction((tx) => {
    const before = id ? tx.select().from(promotions).where(eq(promotions.id, id)).get() : undefined;
    if (id) tx.update(promotions).set(values).where(eq(promotions.id, id)).run();
    else savedId = tx.insert(promotions).values(values).returning({ id: promotions.id }).get().id;
    writeAudit(tx, ctx, { actorId: staff.id, action: id ? "promotion.update" : "promotion.create", entity: "promotions", entityId: savedId, before, after: values });
  });
  revalidateStorefront();
  go("/admin/promotions", { saved: id ? "Promotion saved." : "Promotion created." });
}

export async function deletePromotion(formData: FormData) {
  const staff = await requireStaff("discounts");
  const id = text(formData, "id");
  const ctx = await auditContext();
  db.transaction((tx) => {
    const before = tx.select().from(promotions).where(eq(promotions.id, id)).get();
    if (!before) return;
    tx.delete(promotions).where(eq(promotions.id, id)).run();
    writeAudit(tx, ctx, { actorId: staff.id, action: "promotion.delete", entity: "promotions", entityId: id, before });
  });
  revalidateStorefront();
  go("/admin/promotions", { saved: "Promotion deleted." });
}
