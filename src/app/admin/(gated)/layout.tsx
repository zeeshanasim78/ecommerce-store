import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/store/logo";
import { buttonClasses } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";
import { requireStaff } from "@/server/dal";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Caidea admin" }, robots: { index: false, follow: false } };

const ROLE_LABEL = { OWNER: "Owner", MANAGER: "Manager", CASHIER: "Cashier", CONTENT_EDITOR: "Content editor" } as const;

/** Every page under /admin (except 2FA setup) renders inside this gate (spec §10, layer 2). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("dashboard");

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[17rem_1fr] print:block print:bg-white">
      <aside className="print:hidden border-b border-midnight/8 bg-surface lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-5 lg:px-6 lg:py-7">
          <Link href="/admin/dashboard" className="text-midnight" aria-label="Admin dashboard">
            <Logo />
          </Link>
          <details className="group lg:hidden">
            <summary className={buttonClasses("outline", "sm", "list-none [&::-webkit-details-marker]:hidden")}>Menu</summary>
            <div className="absolute inset-x-4 z-30 mt-3 rounded-bezel bg-white p-4 shadow-[0_18px_40px_-18px_rgb(11_28_51/0.35)] ring-1 ring-midnight/8">
              <AdminNav role={staff.role} />
            </div>
          </details>
        </div>
        <div className="hidden px-2 pb-8 lg:block">
          <AdminNav role={staff.role} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="print:hidden flex flex-wrap items-center justify-end gap-4 border-b border-midnight/8 px-5 py-4 sm:px-8">
          <Link href="/" className="mr-auto text-sm font-semibold underline decoration-midnight/30 underline-offset-4 hover:decoration-midnight">
            View storefront
          </Link>
          <span className="text-sm">
            <span className="font-semibold">{staff.name}</span> <span className="ml-1 rounded-full bg-midnight/8 px-2.5 py-1 text-xs font-semibold">{ROLE_LABEL[staff.role]}</span>
          </span>
          <form action={signOut}>
            <button type="submit" className={buttonClasses("outline", "sm")}>
              Sign out
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
