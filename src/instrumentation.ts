/**
 * Runs once when the server starts (Next.js instrumentation; skipped during `next build`).
 * v1.9: checks whether the payment details in the environment file changed since the last start
 * and alerts the owner if so (SPECIFICATION §21).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const [{ db }, { runPaymentIntegrityCheck }] = await Promise.all([import("./db/client"), import("./server/settings/payment-integrity")]);
  try {
    // Recorded synchronously before the first request; the email (if any) finishes in the background
    void runPaymentIntegrityCheck(db).catch((e) => console.error("[caidea] payment details check failed:", e));
  } catch (e) {
    console.error("[caidea] payment details check failed:", e);
  }
}
