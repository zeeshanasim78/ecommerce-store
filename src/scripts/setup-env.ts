import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

/**
 * `npm run setup:env` — creates .env.local for development with a fresh random
 * BETTER_AUTH_SECRET. Never overwrites an existing file.
 */
const file = ".env.local";
if (existsSync(file)) {
  console.log(`${file} already exists — left unchanged.`);
} else {
  writeFileSync(
    file,
    [
      "# Created by `npm run setup:env`. Keep this file private — it is not committed.",
      `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64")}`,
      "BETTER_AUTH_URL=http://localhost:3000",
      `CRON_SECRET=${randomBytes(32).toString("hex")}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(`Created ${file} with a new secret.`);
}
