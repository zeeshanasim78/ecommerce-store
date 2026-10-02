"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { couponRedemptions, coupons } from "@/db/schema";
import { COUPON_USAGE } from "@/db/schema/discounts";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { friendlyDbError } from "@/server/db-errors";
import { readDiscount } from "@/server/discount-forms";
import { checked, optionalText, text } from "@/server/forms";
import { generateCouponCode, normaliseCouponCode } from "@/server/pricing/coupons";

const go = (path: string, params: Record<string, string>) => redirect(`${path}?${new URLSearchParams(params)}`);

const CouponSchema = z
  .object({
    code: z.string().regex(/^[A-Z0-9-]{3,32}$/, "Codes use 3–32 letters, numbers or dashes."),
    description: z.string().max(140).nullable(),
    usage: z.enum(COUPON_USAGE),
    maxRedemptions: z.coerce.number().int().min(1).max(1_000_000).nullable(),
    minOrderPaisa: z.coerce.number().min(0).max(10_000_000).transform((rs) => Math.round(rs * 100)),
    maxDiscountPaisa: z.coerce.number().positive().max(10_000_000).transform((rs) => Math.round(rs * 100)).nullable(),
  })
  .transform((c) => ({ ...c, maxRedemptions: c.usage === "SINGLE_USE" ? 1 : c.maxRedemptions }));

export async function saveCoupon(formData: FormData) {
  const staff = await requireStaff("discounts");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/coupons/${id}` : "/admin/coupons/new";

  const discount = readDiscount(formData);
  if (!discount.success) go(formPath, { error: discount.error.issues[0]?.message ?? "Check the discount." });

  const typed = normaliseCouponCode(text(formData, "code"));
  const parsed = CouponSchema.safeParse({
    code: typed || generateCouponCode(),
    description: optionalText(formData, "description"),
    usage: text(formData, "usage") || "MULTI_USE",
    maxRedemptions: text(formData, "maxRedemptions") || null,
    minOrderPaisa: text(formData, "minOrder") || "0",
    maxDiscountPaisa: text(formData, "maxDiscount") || null,
  });
  if (!parsed.success) go(formPath, { error: parsed.error.issues[0]?.message ?? "Check the coupon." });

  const values = { ...parsed.data!, ...discount.data!, isActive: checked(formData, "isActive") };
  const ctx = await auditContext();
  let error: string | null = null;
  let savedId = id;
  try {
    db.transaction(
      (tx) => {
        const before = id ? tx.select().from(coupons).where(eq(coupons.id, id)).get() : undefined;
        if (before && values.maxRedemptions !== null && values.maxRedemptions < before.redemptionCount) {
          throw Object.assign(new Error(`This code has already been used ${before.redemptionCount} times, so the limit can’t be lower than that`), { code: "SQLITE_CONSTRAINT_TRIGGER" });
        }
        if (id) tx.update(coupons).set(values).where(eq(coupons.id, id)).run();
        else savedId = tx.insert(coupons).values({ ...values, createdBy: staff.id }).returning({ id: coupons.id }).get().id;
        writeAudit(tx, ctx, { actorId: staff.id, action: id ? "coupon.update" : "coupon.create", entity: "coupons", entityId: savedId, before, after: values });
      },
      { behavior: "immediate" },
    );
  } catch (e) {
    error = friendlyDbError(e);
  }
  if (error) go(formPath, { error });
  go("/admin/coupons", { saved: id ? `Coupon ${values.code} saved.` : `Coupon ${values.code} created.` });
}

/** Used coupons are kept for the record (deactivate instead); unused ones can be deleted. */
export async function deleteCoupon(formData: FormData) {
  const staff = await requireStaff("discounts");
  const id = text(formData, "id");
  if (db.select({ id: couponRedemptions.id }).from(couponRedemptions).where(eq(couponRedemptions.couponId, id)).get()) {
    go("/admin/coupons", { error: "This code has been used on orders, so it’s kept for your records. Switch it off instead." });
  }
  const ctx = await auditContext();
  db.transaction((tx) => {
    const before = tx.select().from(coupons).where(eq(coupons.id, id)).get();
    if (!before) return;
    tx.delete(coupons).where(eq(coupons.id, id)).run();
    writeAudit(tx, ctx, { actorId: staff.id, action: "coupon.delete", entity: "coupons", entityId: id, before });
  });
  go("/admin/coupons", { saved: "Coupon deleted." });
}
