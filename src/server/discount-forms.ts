import "server-only";
import { z } from "zod";
import { DISCOUNT_TYPES } from "@/db/schema/discounts";
import { karachiInputToIso } from "@/lib/time";
import { text } from "./forms";

/**
 * Reads the shared "discount" part of the promotion and coupon forms.
 * The admin types "15" for 15 % or "500" for Rs 500; we store basis points / paisa (spec §4.16).
 */
export function readDiscount(formData: FormData) {
  return z
    .object({
      discountType: z.enum(DISCOUNT_TYPES),
      amount: z.coerce.number({ error: "Enter the discount amount." }).positive("The discount must be above zero."),
      startsAt: z.string({ error: "Choose when it starts." }),
      endsAt: z.string({ error: "Choose when it ends." }),
    })
    .refine((d) => d.discountType !== "PERCENT" || d.amount <= 90, { message: "Percentage discounts can be at most 90%." })
    .refine((d) => d.endsAt > d.startsAt, { message: "The end time must be after the start time." })
    .transform((d) => ({
      discountType: d.discountType,
      // Both scale by 100: 15 % → 1500 basis points; Rs 500 → 50,000 paisa
      value: Math.round(d.amount * 100),
      startsAt: d.startsAt,
      endsAt: d.endsAt,
    }))
    .safeParse({
      discountType: text(formData, "discountType"),
      amount: text(formData, "amount"),
      startsAt: karachiInputToIso(text(formData, "startsAt")) ?? undefined,
      endsAt: karachiInputToIso(text(formData, "endsAt")) ?? undefined,
    });
}

/** Stored value → what the admin typed (15 for 15 %, 500 for Rs 500). */
export const displayAmount = (value: number) => value / 100;
