import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DATABASE_PATH, openDatabase } from "./connection";

/**
 * `npm run db:migrate` — applies every SQL file in /drizzle that hasn't run yet.
 * An existing database is backed up first (spec §5), using SQLite's online backup
 * so it is safe even while the app is running.
 */
async function main() {
  const isExisting = existsSync(DATABASE_PATH);
  const db = openDatabase();

  if (isExisting) {
    const backupDir = join(process.cwd(), "data", "backups");
    mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\..+$/, "");
    const target = join(backupDir, `caidea-before-migrate-${stamp}.db`);
    await db.$client.backup(target);
    console.log(`Backup written: ${target}`);
  }

  migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Migrations applied to ${DATABASE_PATH}`);
  db.$client.close();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
