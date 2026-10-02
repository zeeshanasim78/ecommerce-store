import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDatabase, type DB } from "@/db/connection";
import { SYSTEM_USER_ID, user } from "@/db/schema";

/** Fresh in-memory database with every migration applied — same schema and triggers as production. */
export function testDb(): DB {
  const db = openDatabase(":memory:");
  migrate(db, { migrationsFolder: "./drizzle" });
  db.insert(user).values({ id: SYSTEM_USER_ID, name: "System", email: "system@caidea.invalid", role: "SYSTEM", isActive: false }).run();
  return db;
}
