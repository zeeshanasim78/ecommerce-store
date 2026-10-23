module.exports = [
"[project]/src/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Runs once when the server starts (Next.js instrumentation; skipped during `next build`).
 * v1.9: checks whether the payment details in the environment file changed since the last start
 * and alerts the owner if so (SPECIFICATION §21).
 */ __turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const [{ db }, { runPaymentIntegrityCheck }] = await Promise.all([
        __turbopack_context__.A("[project]/src/db/client.ts [instrumentation] (ecmascript, async loader)"),
        __turbopack_context__.A("[project]/src/server/settings/payment-integrity.ts [instrumentation] (ecmascript, async loader)")
    ]);
    try {
        // Recorded synchronously before the first request; the email (if any) finishes in the background
        void runPaymentIntegrityCheck(db).catch((e)=>console.error("[caidea] payment details check failed:", e));
    } catch (e) {
        console.error("[caidea] payment details check failed:", e);
    }
}
}),
];

//# sourceMappingURL=src_instrumentation_ts_07j_8w1._.js.map