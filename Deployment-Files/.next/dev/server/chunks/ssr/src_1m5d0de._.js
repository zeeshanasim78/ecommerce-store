module.exports = [
"[project]/src/components/store/cart-count.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartCount",
    ()=>CartCount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cart$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cart-store.ts [app-ssr] (ecmascript)");
"use client";
;
;
function CartCount() {
    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cart$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cartCount"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cart$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCart"])());
    if (n === 0) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "sr-only",
        children: ", empty"
    }, void 0, false, {
        fileName: "[project]/src/components/store/cart-count.tsx",
        lineNumber: 8,
        columnNumber: 23
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-bold text-white tabular",
        children: [
            n > 99 ? "99+" : n,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "sr-only",
                children: [
                    " item",
                    n === 1 ? "" : "s"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/store/cart-count.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/store/cart-count.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/cart-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX_LINES",
    ()=>MAX_LINES,
    "MAX_QTY",
    ()=>MAX_QTY,
    "cart",
    ()=>cart,
    "cartCount",
    ()=>cartCount,
    "useCart",
    ()=>useCart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const KEY = "caidea:cart:v1";
const EVENT = "caidea:cart";
const MAX_LINES = 30;
const MAX_QTY = 99;
const EMPTY = {
    lines: []
};
let memory = EMPTY;
let cachedRaw;
let cachedState = EMPTY;
function sanitize(value) {
    if (!value || typeof value !== "object") return EMPTY;
    const v = value;
    const lines = Array.isArray(v.lines) ? v.lines.filter((l)=>!!l && typeof l === "object" && typeof l.variantId === "string" && Number.isInteger(l.qty)).map((l)=>({
            variantId: l.variantId.slice(0, 64),
            qty: Math.min(MAX_QTY, Math.max(1, l.qty))
        })).slice(0, MAX_LINES) : [];
    const coupon = typeof v.coupon === "string" && v.coupon.trim() ? v.coupon.trim().slice(0, 40) : undefined;
    return coupon ? {
        lines,
        coupon
    } : {
        lines
    };
}
function read() {
    let raw;
    try {
        raw = window.localStorage.getItem(KEY);
    } catch  {
        return memory;
    }
    if (raw === cachedRaw) return cachedState; // stable snapshot for useSyncExternalStore
    cachedRaw = raw;
    try {
        cachedState = raw ? sanitize(JSON.parse(raw)) : EMPTY;
    } catch  {
        cachedState = EMPTY;
    }
    return cachedState;
}
function write(next) {
    const clean = sanitize(next);
    memory = clean;
    try {
        window.localStorage.setItem(KEY, JSON.stringify(clean));
    } catch  {
    /* storage blocked — keep the in-memory copy */ }
    window.dispatchEvent(new Event(EVENT));
}
const cart = {
    get: read,
    add (variantId, qty) {
        const s = read();
        const existing = s.lines.find((l)=>l.variantId === variantId);
        const lines = existing ? s.lines.map((l)=>l.variantId === variantId ? {
                ...l,
                qty: Math.min(MAX_QTY, l.qty + qty)
            } : l) : [
            ...s.lines,
            {
                variantId,
                qty: Math.min(MAX_QTY, qty)
            }
        ];
        if (lines.length > MAX_LINES) return false;
        write({
            ...s,
            lines
        });
        return true;
    },
    setQty (variantId, qty) {
        const s = read();
        write({
            ...s,
            lines: qty <= 0 ? s.lines.filter((l)=>l.variantId !== variantId) : s.lines.map((l)=>l.variantId === variantId ? {
                    ...l,
                    qty: Math.min(MAX_QTY, qty)
                } : l)
        });
    },
    remove (variantId) {
        cart.setQty(variantId, 0);
    },
    setCoupon (code) {
        write({
            ...read(),
            coupon: code?.trim().toUpperCase() || undefined
        });
    },
    clear () {
        write(EMPTY);
    }
};
function subscribe(onChange) {
    const onStorage = (e)=>{
        if (e.key === KEY) onChange(); // another tab changed the cart
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return ()=>{
        window.removeEventListener(EVENT, onChange);
        window.removeEventListener("storage", onStorage);
    };
}
function useCart() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribe, read, ()=>EMPTY);
}
function cartCount(state) {
    return state.lines.reduce((n, l)=>n + l.qty, 0);
}
}),
];

//# sourceMappingURL=src_1m5d0de._.js.map