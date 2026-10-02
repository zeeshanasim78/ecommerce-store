import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/store/logo";

export const metadata: Metadata = { title: "Staff sign-in", robots: { index: false, follow: false } };

/** Sign-in and 2FA screens: a dark glass panel (spec §0.2 glass-on-dark rule). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="ambient-dark relative flex min-h-dvh flex-col items-center justify-center bg-midnight px-4 py-16 text-canvas">
      <Link href="/" className="mb-10 text-canvas" aria-label="Caidea home">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-bezel-lg border border-white/10 bg-white/6 p-2 backdrop-blur-xl">
        <div className="rounded-bezel bg-canvas p-7 text-midnight sm:p-9">{children}</div>
      </div>
    </main>
  );
}
