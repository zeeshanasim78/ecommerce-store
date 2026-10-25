"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { canAccess, type AdminModule, type StaffRole } from "@/lib/permissions";

type Item = { href: string; label: string; module?: AdminModule; milestone?: string };

const GROUPS: { heading: string; items: Item[] }[] = [
  { heading: "Overview", items: [
      { href: "/admin/dashboard", label: "Dashboard", module: "dashboard" },
      { href: "/admin/reports", label: "Reports", module: "reports" },
    ] },
  {
    heading: "Sales",
    items: [
      { href: "/admin/counter-sale", label: "Counter sale", module: "counter" },
      { href: "/admin/counter-sale/summary", label: "End of day", module: "counter" },
      { href: "/admin/orders", label: "Online orders", module: "orders" },
      { href: "/admin/orders/remittance", label: "COD remittance", module: "orders" },
      { href: "/admin/orders/couriers", label: "Couriers", module: "orders" },
      { href: "/admin/returns", label: "Returns", module: "returns" },
      { href: "/admin/returns/warranty", label: "Warranty check", module: "returns" },
      { href: "/admin/technicians", label: "Technicians", module: "technicians" },
    ],
  },
  {
    heading: "Storefront",
    items: [
      { href: "/admin/hero", label: "Hero carousel", module: "hero" },
      { href: "/admin/home", label: "Home page", module: "hero" },
      { href: "/admin/blog", label: "Blog", module: "content" },
      { href: "/admin/testimonials", label: "Testimonials", module: "content" },
      { href: "/admin/services", label: "Services page", module: "content" },
      { href: "/admin/messages", label: "Messages", module: "messages" },
      { href: "/admin/promotions", label: "Promotions", module: "discounts" },
      { href: "/admin/coupons", label: "Coupons", module: "discounts" },
    ],
  },
  {
    heading: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", module: "catalog" },
      { href: "/admin/categories", label: "Categories", module: "catalog" },
      { href: "/admin/brands", label: "Brands", module: "catalog" },
    ],
  },
  {
    heading: "Stock",
    items: [
      { href: "/admin/purchase-orders", label: "Purchase orders", module: "purchasing" },
      { href: "/admin/vendors", label: "Vendors", module: "vendors" },
      { href: "/admin/stock-ledger", label: "Stock ledger", module: "ledger" },
      { href: "/admin/returns/claims", label: "Supplier claims", module: "returns" },
    ],
  },
  { heading: "Shop", items: [{ href: "/admin/settings", label: "Shop settings", module: "settings" }] },
];

const ALL_HREFS = GROUPS.flatMap((g) => g.items.map((i) => i.href)).filter((h) => h !== "#");
/** The most specific menu item for this address ("/admin/counter-sale/summary" is not also "Counter sale"). */
function activeHref(path: string | null): string | null {
  if (!path) return null;
  return ALL_HREFS.filter((h) => path === h || path.startsWith(`${h}/`)).sort((a, b) => b.length - a.length)[0] ?? null;
}

export function AdminNav({ role }: { role: StaffRole }) {
  const active = activeHref(usePathname());
  return (
    <nav aria-label="Admin" className="flex flex-col gap-7">
      {GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.module || canAccess(role, i.module));
        if (items.length === 0) return null;
        return (
          <div key={group.heading}>
            <h2 className="px-4 font-sans text-[0.8125rem] font-semibold text-midnight/55">{group.heading}</h2>
            <ul className="mt-2 flex flex-col gap-0.5">
              {items.map((item) =>
                item.milestone ? (
                  <li key={item.label} className="flex items-center justify-between px-4 py-2 text-[0.9375rem] text-midnight/45">
                    {item.label}
                    <span className="text-xs font-semibold">{item.milestone}</span>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active === item.href ? "page" : undefined}
                      className={cn(
                        "block rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors",
                        active === item.href ? "bg-midnight text-canvas" : "hover:bg-midnight/6",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
