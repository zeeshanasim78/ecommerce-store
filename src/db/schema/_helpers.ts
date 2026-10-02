import { sql, type SQL } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";

/** `created_at` / `updated_at` style column, blueprint convention: SQLite CURRENT_TIMESTAMP (UTC). */
export const timestamp = (name: string) => text(name).default(sql`CURRENT_TIMESTAMP`).notNull();

/** Text primary key, generated with crypto.randomUUID() (spec §4.0). */
export const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

/**
 * Builds `"column" IN ('A','B')` for CHECK constraints from a fixed list of constants
 * declared in code (never user input), so a raw literal list is safe here.
 */
export function inList(column: string, values: readonly string[]): SQL {
  const list = values.map((v) => `'${v.replaceAll("'", "''")}'`).join(", ");
  return sql.raw(`"${column}" IN (${list})`);
}
