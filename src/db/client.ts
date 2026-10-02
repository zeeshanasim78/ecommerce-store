import "server-only";
import { openDatabase, type DB } from "./connection";

/**
 * The app's database handle. One connection per server process (spec §6.2:
 * a single Next.js process writes to the file). In development, hot reload
 * re-runs this module, so the connection is cached on globalThis.
 */
const globalForDb = globalThis as unknown as { caideaDb?: DB };

export const db: DB = globalForDb.caideaDb ?? openDatabase();

if (process.env.NODE_ENV !== "production") globalForDb.caideaDb = db;

export type { DB, Tx } from "./connection";
