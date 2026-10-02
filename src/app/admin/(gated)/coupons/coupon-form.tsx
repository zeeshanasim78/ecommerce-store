import { Section, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { coupons } from "@/db/schema";
import { DiscountFields } from "../promotions/promotion-form";
import { saveCoupon } from "./actions";

type Coupon = typeof coupons.$inferSelect;

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  return (
    <form action={saveCoupon} className="flex flex-col gap-6">
      {coupon ? <input type="hidden" name="id" value={coupon.id} /> : null}
      <Section title="Code">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="code" label="Coupon code" hint="Leave blank to generate one, like CAIDEA-7KQ2-M9XP. Shoppers can type it in any case.">
            <Input id="code" name="code" maxLength={32} pattern="[A-Za-z0-9\-]{3,32}" defaultValue={coupon?.code} className="tabular uppercase" aria-describedby="code-hint" />
          </Field>
          <Field id="description" label="Note (staff only)">
            <Input id="description" name="description" maxLength={140} placeholder="Facebook giveaway, October" defaultValue={coupon?.description ?? ""} />
          </Field>
        </div>
      </Section>

      <Section title="Discount and dates">
        <DiscountFields discountType={coupon?.discountType} value={coupon?.value} startsAt={coupon?.startsAt} endsAt={coupon?.endsAt} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="minOrder" label="Minimum order (Rs)" hint="0 for no minimum.">
            <Input id="minOrder" name="minOrder" type="number" min={0} step="1" defaultValue={coupon ? coupon.minOrderPaisa / 100 : 0} aria-describedby="minOrder-hint" />
          </Field>
          <Field id="maxDiscount" label="Biggest discount allowed (Rs, optional)" hint="Caps percentage codes on large orders.">
            <Input id="maxDiscount" name="maxDiscount" type="number" min={1} step="1" defaultValue={coupon?.maxDiscountPaisa ? coupon.maxDiscountPaisa / 100 : ""} aria-describedby="maxDiscount-hint" />
          </Field>
        </div>
      </Section>

      <Section title="How many times it can be used">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="usage" label="Use">
            <Select id="usage" name="usage" defaultValue={coupon?.usage ?? "MULTI_USE"}>
              <option value="MULTI_USE">Multi-use</option>
              <option value="SINGLE_USE">Single-use (one order only)</option>
            </Select>
          </Field>
          <Field id="maxRedemptions" label="Total uses allowed (multi-use)" hint="Leave blank for unlimited.">
            <Input id="maxRedemptions" name="maxRedemptions" type="number" min={1} step="1" defaultValue={coupon && coupon.usage === "MULTI_USE" ? (coupon.maxRedemptions ?? "") : ""} aria-describedby="maxRedemptions-hint" />
          </Field>
        </div>
        {coupon ? <p className="text-sm text-midnight/70">Used {coupon.redemptionCount} time{coupon.redemptionCount === 1 ? "" : "s"} so far.</p> : null}
        <Toggle name="isActive" label="Active" hint="Switch off to stop the code working straight away." defaultChecked={coupon?.isActive ?? true} />
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {coupon ? "Save coupon" : "Create coupon"}
        </Button>
        <ButtonLink href="/admin/coupons" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
