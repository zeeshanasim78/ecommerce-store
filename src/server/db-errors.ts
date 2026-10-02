import "server-only";

/** Turns SQLite constraint/trigger errors into messages staff can act on. */
export function friendlyDbError(error: unknown, fallback = "That change couldn’t be saved."): string {
  const message = error instanceof Error ? error.message : "";
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code === "SQLITE_CONSTRAINT_UNIQUE" || message.includes("UNIQUE constraint failed")) {
    const field = message.split(".").pop()?.replace(/_/g, " ") ?? "value";
    return `Another record already uses that ${field}. Choose a different one.`;
  }
  // Messages raised by our own triggers are written for people (see drizzle/0001, 0003)
  if (code === "SQLITE_CONSTRAINT_TRIGGER" || /must|cannot|can't|instead/.test(message)) return message.charAt(0).toUpperCase() + message.slice(1) + ".";
  if (code.startsWith("SQLITE_CONSTRAINT")) return fallback;
  throw error;
}
