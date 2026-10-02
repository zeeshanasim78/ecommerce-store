import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import * as schema from "./schema";

/**
 * Opens the single SQLite file with the pragmas required by SPECIFICATION.md §6.2.
 * Used by the app (through client.ts) and by CLI scripts (migrate, seed, reset).
 */

// Scoped to ./data so the production build doesn't trace the whole project folder.
export const DATABASE_PATH = process.env.DATABASE_PATH
  ? resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH)
  : join(process.cwd(), "data", "caidea.db");

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export function openDatabase(path: string = DATABASE_PATH): DB {
  if (path !== ":memory:") mkdirSync(dirname(/*turbopackIgnore: true*/ path), { recursive: true });

  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL"); // readers never block the single writer
  sqlite.pragma("busy_timeout = 5000"); // wait up to 5 s for the write lock instead of failing
  sqlite.pragma("synchronous = NORMAL"); // safe with WAL, much faster than FULL
  sqlite.pragma("foreign_keys = ON"); // SQLite ships with this OFF
  sqlite.pragma("temp_store = MEMORY");

  return drizzle({ client: sqlite, schema }) as DB;
}

/** Drizzle transaction handle. Pass it to functions that must run inside a transaction. */
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
