"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { canAccess, type AdminModule, type StaffRole } from "@/lib/permissions";

type Item = { href: string; label: string; module?: AdminModule; milestone?: string };

const GROUPS: { heading: string; items: Item[] }[] = [
  { heading: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", module: "dashboard" }] },
  { heading: "Sales", items: [{ href: "/admin/orders", label: "Online orders", module: "orders" }] },
  {
    heading: "Storefront",
    items: [
      { href: "/admin/hero", label: "Hero carousel", module: "hero" },
      { href: "/admin/home", label: "Home page", module: "hero" },
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
    ],
  },
  { heading: "Shop", items: [{ href: "/admin/settings", label: "Shop settings", module: "settings" }] },
  {
    heading: "Coming next",
    items: [
      { href: "#", label: "Counter sale", milestone: "M9" },
      { href: "#", label: "Returns", milestone: "M11" },
      { href: "#", label: "Reports", milestone: "M12" },
      { href: "#", label: "Blog & testimonials", milestone: "M13" },
    ],
  },
];

export function AdminNav({ role }: { role: StaffRole }) {
  const current = usePathname();
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
                      aria-current={current?.startsWith(item.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors",
                        current?.startsWith(item.href) ? "bg-midnight text-canvas" : "hover:bg-midnight/6",
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
