import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next.js 16 proxy (formerly middleware) — SPECIFICATION.md §10, layer 1.
 * A fast redirect to /login when there is no session cookie at all. It does NOT
 * prove the session is valid: every admin page and action checks properly in
 * src/server/dal.ts (layer 2), which is the real gate.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
