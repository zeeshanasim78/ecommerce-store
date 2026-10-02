import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { openDatabase } from "@/db/connection";
import { STAFF_ROLES, account, user } from "@/db/schema";
import { createAuth } from "@/server/auth-config";

/**
 * `npm run staff:create -- --email owner@example.com --name "Shop Owner" --role OWNER`
 *
 * Creates a staff login (public sign-up is switched off). The password is read from the
 * STAFF_PASSWORD environment variable or asked for on screen. The person must set up
 * their authenticator app (2FA) the first time they sign in.
 */
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string", default: "OWNER" } },
});

async function main() {
  const email = values.email?.trim().toLowerCase();
  const name = values.name?.trim();
  const role = values.role?.toUpperCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) {
    throw new Error('Usage: npm run staff:create -- --email you@example.com --name "Your Name" --role OWNER');
  }
  if (!(STAFF_ROLES as readonly string[]).includes(role ?? "")) throw new Error(`--role must be one of: ${STAFF_ROLES.join(", ")}`);

  let password = process.env.STAFF_PASSWORD ?? "";
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Password (at least 12 characters; shown as you type): ");
    rl.close();
  }
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");

  const db = openDatabase();
  try {
    if (db.select({ id: user.id }).from(user).where(eq(user.email, email)).get()) throw new Error(`${email} already has an account.`);

    const ctx = await createAuth(db).$context;
    const hash = await ctx.password.hash(password);
    const id = crypto.randomUUID();
    const now = new Date();

    db.transaction(
      (tx) => {
        tx.insert(user).values({ id, name, email, emailVerified: true, role: role as (typeof STAFF_ROLES)[number], isActive: true, createdAt: now, updatedAt: now }).run();
        tx.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash, createdAt: now, updatedAt: now }).run();
      },
      { behavior: "immediate" },
    );
    console.log(`Created ${role} ${name} <${email}>. Sign in at /login — you'll be asked to set up your authenticator app.`);
  } finally {
    db.$client.close();
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
