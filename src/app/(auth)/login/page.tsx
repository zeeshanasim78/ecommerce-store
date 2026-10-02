import { redirect } from "next/navigation";
import { getSession } from "@/server/dal";
import { LoginForm } from "./login-form";

const NOTICES: Record<string, string> = {
  "no-access": "This account can’t open the admin area. Ask the owner to check your role.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const session = await getSession();
  if (session && !error) redirect("/admin/dashboard");

  const safeNext = next?.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/dashboard";
  return <LoginForm next={safeNext} notice={error ? NOTICES[error] : undefined} />;
}
