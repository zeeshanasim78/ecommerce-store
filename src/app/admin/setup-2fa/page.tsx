import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/store/logo";
import { requireStaffSession } from "@/server/dal";
import { EnrolForm } from "./enrol-form";

export const metadata: Metadata = { title: "Set up two-step sign-in", robots: { index: false, follow: false } };

/** Mandatory TOTP enrolment for staff (spec §10). Nothing else in /admin opens until this is done. */
export default async function SetupTwoFactorPage() {
  const staff = await requireStaffSession();
  if (staff.twoFactorEnabled) redirect("/admin/dashboard");

  return (
    <main className="ambient-dark flex min-h-dvh flex-col items-center justify-center bg-midnight px-4 py-16 text-canvas">
      <Link href="/" className="mb-10 text-canvas" aria-label="Caidea home">
        <Logo />
      </Link>
      <div className="w-full max-w-lg rounded-bezel-lg border border-white/10 bg-white/6 p-2 backdrop-blur-xl">
        <div className="rounded-bezel bg-canvas p-7 text-midnight sm:p-9">
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Set up two-step sign-in</h1>
          <p className="mt-2 mb-6 text-[0.9375rem] text-midnight/70">
            {staff.name}, every staff account needs an authenticator app before it can open the admin area.
          </p>
          <EnrolForm />
        </div>
      </div>
    </main>
  );
}
