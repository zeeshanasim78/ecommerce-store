import { orderCounts } from "@/server/orders/admin-orders";
import Link from "next/link";
import { and, asc, count, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { coupons, heroSlides, productVariants, products, promotions } from "@/db/schema";
import { PaymentAlert } from "@/components/admin/payment-alert";
import { canAccess, requireStaff } from "@/server/dal";
import { getPaymentAlert } from "@/server/settings/payment-integrity";

export const metadata = { title: "Dashboard" };

const DENIED: Record<string, string> = {
  hero: "Your role can’t edit the hero carousel.",
  catalog: "Your role can’t edit the catalogue.",
  discounts: "Your role can’t manage promotions or coupons.",
  vendors: "Your role can’t manage vendors.",
  purchasing: "Your role can’t manage purchase orders.",
  ledger: "Your role can’t open the stock ledger.",
  orders: "Your role can’t manage online orders.",
  settings: "Only the owner can change shop settings.",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const staff = await requireStaff("dashboard");
  const { denied } = await searchParams;
  const nowIso = new Date().toISOString();
  // v1.9: owners and managers see an unconfirmed change to the payment details
  const paymentAlert = staff.role === "OWNER" || staff.role === "MANAGER" ? getPaymentAlert(db) : null;

  const one = (q: { n: number }[]) => q[0]?.n ?? 0;
  // v1.11: online orders waiting for staff (payment proof to check, or ready to dispatch)
  const ordersToDo = canAccess(staff.role, "orders") ? orderCounts(db) : null;
  const stats = [
    { label: "Published products", value: one(db.select({ n: count() }).from(products).where(and(eq(products.isPublished, true), isNull(products.archivedAt))).all()), href: "/admin/products" },
    { label: "Active hero slides", value: one(db.select({ n: count() }).from(heroSlides).where(eq(heroSlides.isActive, true)).all()), href: "/admin/hero" },
    {
      label: "Running promotions",
      value: one(db.select({ n: count() }).from(promotions).where(and(eq(promotions.isActive, true), lte(promotions.startsAt, nowIso), gt(promotions.endsAt, nowIso))).all()),
      href: "/admin/promotions",
    },
    {
      label: "Live coupons",
      value: one(db.select({ n: count() }).from(coupons).where(and(eq(coupons.isActive, true), lte(coupons.startsAt, nowIso), gt(coupons.endsAt, nowIso))).all()),
      href: "/admin/coupons",
    },
  ];

  const lowStock = db
    .select({
      brand: products.brand,
      model: products.model,
      color: productVariants.color,
      sku: productVariants.variantSku,
      stock: productVariants.currentStock,
      threshold: products.lowStockThreshold,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(isNull(productVariants.archivedAt), isNull(products.archivedAt), sql`${productVariants.currentStock} <= ${products.lowStockThreshold}`))
    .orderBy(asc(productVariants.currentStock))
    .all();

  return (
    <>
      <AdminHeader title={`Welcome, ${staff.name.split(" ")[0]}`} description="Storefront content and catalogue at a glance. Order and sales figures arrive with the Orders screen in Milestone 10." />
      {denied && DENIED[denied] ? <Notice tone="error">{DENIED[denied]}</Notice> : null}
      {ordersToDo && ordersToDo.action + ordersToDo.payment > 0 ? (
        <Link href="/admin/orders" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-bezel bg-midnight px-6 py-4 font-medium text-canvas">
          <span className="font-semibold">Online orders</span>
          <span className="tabular">{ordersToDo.action} need action</span>
          <span className="tabular">{ordersToDo.payment} waiting for payment</span>
          <span className="ml-auto underline underline-offset-4">Open orders</span>
        </Link>
      ) : null}
      {paymentAlert ? <PaymentAlert alert={paymentAlert} showLink={canAccess(staff.role, "settings")} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="p-6 transition-shadow group-hover:shadow-[0_14px_30px_-20px_rgb(11_28_51/0.4)]">
              <p className="text-sm font-medium text-midnight/65">{s.label}</p>
              <p className="tabular mt-2 font-display text-4xl font-bold">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 mb-4 text-xl font-bold">Low stock</h2>
      {lowStock.length === 0 ? (
        <p className="text-midnight/70">Every variant is above its low-stock level.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Screen</TH>
              <TH>Variant SKU</TH>
              <TH className="text-right">In stock</TH>
              <TH className="text-right">Alert at</TH>
            </tr>
          </THead>
          <tbody>
            {lowStock.map((r) => (
              <TR key={r.sku}>
                <TD>
                  <span className="font-semibold">
                    {r.brand} {r.model}
                  </span>{" "}
                  <span className="text-midnight/65">{r.color}</span>
                </TD>
                <TD className="tabular text-midnight/75">{r.sku}</TD>
                <TD className={`tabular text-right font-semibold ${r.stock === 0 ? "text-terracotta" : ""}`}>{r.stock}</TD>
                <TD className="tabular text-right text-midnight/65">{r.threshold}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
