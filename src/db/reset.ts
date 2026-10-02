import { existsSync, rmSync } from "node:fs";
import { DATABASE_PATH } from "./connection";

/**
 * `npm run db:reset` — DEVELOPMENT ONLY. Deletes the local database file so you can
 * run `npm run db:migrate && npm run db:seed` from a clean slate.
 */
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset the database in production.");
  process.exit(1);
}

for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${DATABASE_PATH}${suffix}`;
  if (existsSync(file)) {
    rmSync(file);
    console.log(`Deleted ${file}`);
  }
}
console.log("Database reset. Next: npm run db:migrate && npm run db:seed");
