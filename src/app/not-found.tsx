import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/store/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="text-3xl font-bold tracking-[-0.02em]">We couldn’t find that page</h1>
      <p className="max-w-md text-midnight/70">The link may be old, or the page may not be published yet.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Go to the home page</ButtonLink>
        <ButtonLink href="/store" variant="outline">
          Browse screens
        </ButtonLink>
      </div>
    </main>
  );
}
