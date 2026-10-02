import "server-only";
import { db } from "@/db/client";
import { createAuth } from "./auth-config";

/** The app's Better Auth instance (one per server process, sharing the app's database connection). */
export const auth = createAuth(db);
