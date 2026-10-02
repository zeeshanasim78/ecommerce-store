/** Human status for a time-boxed discount (promotion or coupon). */
export function discountStatus(d: { isActive: boolean; startsAt: string; endsAt: string }, now = new Date()): "Running" | "Scheduled" | "Ended" | "Paused" {
  if (!d.isActive) return "Paused";
  const t = now.getTime();
  if (t < Date.parse(d.startsAt)) return "Scheduled";
  if (t >= Date.parse(d.endsAt)) return "Ended";
  return "Running";
}

export function describeDiscount(d: { discountType: "PERCENT" | "FIXED"; value: number }): string {
  return d.discountType === "PERCENT" ? `${d.value / 100}% off` : `Rs ${(d.value / 100).toLocaleString("en-PK")} off`;
}
