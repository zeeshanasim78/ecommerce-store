import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Better Auth's HTTP endpoints (sign-in, two-factor, sign-out). Rate-limited in auth-config.ts.
export const { GET, POST } = toNextJsHandler(auth);
