module.exports = [
"[externals]/node:child_process [external] (node:child_process, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:child_process", () => require("node:child_process"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:dns [external] (node:dns, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:dns", () => require("node:dns"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:http [external] (node:http, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:http", () => require("node:http"));

module.exports = mod;
}),
"[externals]/node:https [external] (node:https, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:https", () => require("node:https"));

module.exports = mod;
}),
"[externals]/node:net [external] (node:net, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:net", () => require("node:net"));

module.exports = mod;
}),
"[externals]/node:os [external] (node:os, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:os", () => require("node:os"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/node:tls [external] (node:tls, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:tls", () => require("node:tls"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[externals]/node:zlib [external] (node:zlib, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:zlib", () => require("node:zlib"));

module.exports = mod;
}),
"[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "id",
    ()=>id,
    "inList",
    ()=>inList,
    "timestamp",
    ()=>timestamp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
;
;
const timestamp = (name)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])(name).default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`CURRENT_TIMESTAMP`).notNull();
const id = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey().$defaultFn(()=>crypto.randomUUID());
function inList(column, values) {
    const list = values.map((v)=>`'${v.replaceAll("'", "''")}'`).join(", ");
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"].raw(`"${column}" IN (${list})`);
}
}),
"[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "STAFF_ROLES",
    ()=>STAFF_ROLES,
    "SYSTEM_USER_ID",
    ()=>SYSTEM_USER_ID,
    "USER_ROLES",
    ()=>USER_ROLES,
    "account",
    ()=>account,
    "session",
    ()=>session,
    "twoFactor",
    ()=>twoFactor,
    "user",
    ()=>user,
    "verification",
    ()=>verification
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
;
;
const USER_ROLES = [
    "OWNER",
    "MANAGER",
    "CASHIER",
    "CONTENT_EDITOR",
    "CUSTOMER",
    "TECHNICIAN",
    "SYSTEM"
];
const STAFF_ROLES = [
    "OWNER",
    "MANAGER",
    "CASHIER",
    "CONTENT_EDITOR"
];
const SYSTEM_USER_ID = "system";
const now = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`(cast(unixepoch('subsecond') * 1000 as integer))`;
const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("user", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email").notNull().unique(),
    emailVerified: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("email_verified", {
        mode: "boolean"
    }).default(false).notNull(),
    image: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("image"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp_ms"
    }).default(now).notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp_ms"
    }).default(now).$onUpdate(()=>new Date()).notNull(),
    twoFactorEnabled: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("two_factor_enabled", {
        mode: "boolean"
    }).default(false),
    // Caidea additions
    role: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("role", {
        enum: USER_ROLES
    }).default("CUSTOMER").notNull(),
    phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone"),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull()
});
const session = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("session", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("expires_at", {
        mode: "timestamp_ms"
    }).notNull(),
    token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("token").notNull().unique(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp_ms"
    }).default(now).notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp_ms"
    }).$onUpdate(()=>new Date()).notNull(),
    ipAddress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip_address"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>user.id, {
        onDelete: "cascade"
    })
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("session_user_idx").on(t.userId)
    ]);
const account = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("account", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    accountId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("account_id").notNull(),
    providerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("provider_id").notNull(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>user.id, {
        onDelete: "cascade"
    }),
    accessToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("access_token"),
    refreshToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("refresh_token"),
    idToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id_token"),
    accessTokenExpiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("access_token_expires_at", {
        mode: "timestamp_ms"
    }),
    refreshTokenExpiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("refresh_token_expires_at", {
        mode: "timestamp_ms"
    }),
    scope: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("scope"),
    password: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("password"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp_ms"
    }).default(now).notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp_ms"
    }).$onUpdate(()=>new Date()).notNull()
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("account_user_idx").on(t.userId)
    ]);
const verification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("verification", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    identifier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("identifier").notNull(),
    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("value").notNull(),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("expires_at", {
        mode: "timestamp_ms"
    }).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp_ms"
    }).default(now).notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp_ms"
    }).default(now).$onUpdate(()=>new Date()).notNull()
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("verification_identifier_idx").on(t.identifier)
    ]);
const twoFactor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("two_factor", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    secret: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("secret").notNull(),
    backupCodes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("backup_codes").notNull(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>user.id, {
        onDelete: "cascade"
    }),
    verified: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("verified", {
        mode: "boolean"
    }).default(true),
    failedVerificationCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("failed_verification_count").default(0),
    lockedUntil: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("locked_until", {
        mode: "timestamp_ms"
    })
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("two_factor_user_idx").on(t.userId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("two_factor_secret_idx").on(t.secret)
    ]);
}),
"[project]/src/db/schema/catalog.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HERO_THEMES",
    ()=>HERO_THEMES,
    "HERO_VISUAL_TYPES",
    ()=>HERO_VISUAL_TYPES,
    "IMAGE_ANGLES",
    ()=>IMAGE_ANGLES,
    "MAX_HERO_SLIDES",
    ()=>MAX_HERO_SLIDES,
    "PHONE_LAYOUTS",
    ()=>PHONE_LAYOUTS,
    "brands",
    ()=>brands,
    "categories",
    ()=>categories,
    "heroSlides",
    ()=>heroSlides,
    "productImages",
    ()=>productImages
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/inventory.ts [instrumentation] (ecmascript)");
;
;
;
;
const IMAGE_ANGLES = [
    "FRONT",
    "BACK",
    "SIDE",
    "DETAIL"
];
const HERO_VISUAL_TYPES = [
    "PHONE_3D",
    "IMAGE"
];
const HERO_THEMES = [
    "MIDNIGHT",
    "TERRACOTTA",
    "AMBER",
    "CREAM",
    "DUSK"
];
const PHONE_LAYOUTS = [
    "RIGHT",
    "LOW_LEFT",
    "HIGH_RIGHT",
    "CENTER",
    "FAR_RIGHT"
];
const MAX_HERO_SLIDES = 5;
const brands = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("brands", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull().unique(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    logoUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("logo_url"),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull(),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull()
});
const categories = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("categories", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("description"),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull(),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull()
});
const productImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("product_images", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    productId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("product_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"].id, {
        onDelete: "cascade"
    }),
    /** Set for colour-specific shots so swatches can swap the image */ variantId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("variant_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id, {
        onDelete: "set null"
    }),
    url: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("url").notNull(),
    alt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("alt").notNull(),
    angle: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("angle", {
        enum: IMAGE_ANGLES
    }).default("FRONT").notNull(),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("product_images_angle", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("angle", IMAGE_ANGLES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("product_images_product_idx").on(t.productId, t.sortOrder)
    ]);
const heroSlides = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("hero_slides", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    heading: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("heading").notNull(),
    subheading: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("subheading"),
    /** Markdown (bold, italics, links, lists). Rendered without raw HTML, so it can't inject scripts. */ bodyMd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("body_md"),
    ctaLabel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cta_label").notNull(),
    ctaHref: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cta_href").notNull(),
    productId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("product_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"].id, {
        onDelete: "set null"
    }),
    visualType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("visual_type", {
        enum: HERO_VISUAL_TYPES
    }).default("PHONE_3D").notNull(),
    /** Image URL when visualType = IMAGE (an uploaded file under /uploads or an https URL) */ visualUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("visual_url"),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull(),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at"),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at"),
    // v1.3 — allowed values are enforced by triggers in migration 0005 (adding CHECKs would rebuild the table)
    theme: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("theme", {
        enum: HERO_THEMES
    }).default("MIDNIGHT").notNull(),
    phoneLayout: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone_layout", {
        enum: PHONE_LAYOUTS
    }).default("RIGHT").notNull()
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("hero_slides_visual_type", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("visual_type", HERO_VISUAL_TYPES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("hero_slides_image_needs_url", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.visualType} <> 'IMAGE' OR ${t.visualUrl} IS NOT NULL`),
        // Internal paths or https links only — never javascript: or data: URLs
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("hero_slides_cta_href_safe", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.ctaHref} GLOB '/*' OR ${t.ctaHref} GLOB 'https://*'`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("hero_slides_order_idx").on(t.isActive, t.sortOrder)
    ]);
}),
"[project]/src/db/schema/content.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MESSAGE_STATUSES",
    ()=>MESSAGE_STATUSES,
    "POST_STATUSES",
    ()=>POST_STATUSES,
    "blogPosts",
    ()=>blogPosts,
    "contactMessages",
    ()=>contactMessages,
    "services",
    ()=>services,
    "testimonials",
    ()=>testimonials
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
;
;
;
;
const POST_STATUSES = [
    "DRAFT",
    "PUBLISHED"
];
const MESSAGE_STATUSES = [
    "NEW",
    "REPLIED",
    "SPAM"
];
const blogPosts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("blog_posts", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("title").notNull(),
    excerpt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("excerpt"),
    bodyMd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("body_md").notNull(),
    coverImage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cover_image"),
    tags: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tags", {
        mode: "json"
    }).$type().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`'[]'`).notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: POST_STATUSES
    }).default("DRAFT").notNull(),
    publishedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("published_at"),
    authorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("author_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id, {
        onDelete: "set null"
    }),
    seoTitle: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("seo_title"),
    seoDescription: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("seo_description"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at"),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("blog_posts_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", POST_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("blog_posts_published_idx").on(t.status, t.publishedAt)
    ]);
const testimonials = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("testimonials", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    authorName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("author_name").notNull(),
    authorRole: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("author_role"),
    city: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("city"),
    rating: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("rating"),
    quote: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("quote").notNull(),
    isPublished: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_published", {
        mode: "boolean"
    }).default(false).notNull(),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("testimonials_rating", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`)
    ]);
const services = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("services", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("title").notNull(),
    summary: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("summary").notNull(),
    bodyMd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("body_md"),
    icon: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("icon"),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull()
});
const contactMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("contact_messages", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone"),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email"),
    subject: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("subject"),
    message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("message").notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: MESSAGE_STATUSES
    }).default("NEW").notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, ()=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("contact_messages_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", MESSAGE_STATUSES))
    ]);
}),
"[project]/src/db/schema/customers.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CUSTOMER_TYPES",
    ()=>CUSTOMER_TYPES,
    "TECHNICIAN_STATUSES",
    ()=>TECHNICIAN_STATUSES,
    "addresses",
    ()=>addresses,
    "customers",
    ()=>customers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/logistics.ts [instrumentation] (ecmascript)");
;
;
;
;
;
const CUSTOMER_TYPES = [
    "RETAIL",
    "TECHNICIAN"
];
const TECHNICIAN_STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED"
];
const customers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("customers", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id, {
        onDelete: "set null"
    }),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    /** E.164, e.g. +923001234567 */ phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone").notNull().unique(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email"),
    customerType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("customer_type", {
        enum: CUSTOMER_TYPES
    }).default("RETAIL").notNull(),
    technicianStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("technician_status", {
        enum: TECHNICIAN_STATUSES
    }),
    shopName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("shop_name"),
    city: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("city"),
    notes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("notes"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("customers_type", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("customer_type", CUSTOMER_TYPES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("customers_technician_status", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.technicianStatus} IS NULL OR ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("technician_status", TECHNICIAN_STATUSES)}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("customers_phone_e164", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.phone} GLOB '+92[0-9]*' AND length(${t.phone}) = 13`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("customers_user_idx").on(t.userId)
    ]);
const addresses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("addresses", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    customerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("customer_id").notNull().references(()=>customers.id, {
        onDelete: "cascade"
    }),
    label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("label"),
    line1: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("line1").notNull(),
    line2: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("line2"),
    area: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("area"),
    cityId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("city_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"].id),
    postalCode: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("postal_code"),
    phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone").notNull(),
    isDefault: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_default", {
        mode: "boolean"
    }).default(false).notNull()
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("addresses_customer_idx").on(t.customerId)
    ]);
}),
"[project]/src/db/schema/discounts.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COUPON_USAGE",
    ()=>COUPON_USAGE,
    "DISCOUNT_TYPES",
    ()=>DISCOUNT_TYPES,
    "PROMOTION_SCOPES",
    ()=>PROMOTION_SCOPES,
    "couponRedemptions",
    ()=>couponRedemptions,
    "coupons",
    ()=>coupons,
    "promotions",
    ()=>promotions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/orders.ts [instrumentation] (ecmascript)");
;
;
;
;
;
const DISCOUNT_TYPES = [
    "PERCENT",
    "FIXED"
];
const PROMOTION_SCOPES = [
    "ALL",
    "BRAND",
    "CATEGORY",
    "PRODUCT"
];
const COUPON_USAGE = [
    "SINGLE_USE",
    "MULTI_USE"
];
const promotions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("promotions", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    /** Shown in the site-wide banner and as the card badge, e.g. "Eid sale: 10% off OLED screens" */ bannerText: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("banner_text"),
    discountType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("discount_type", {
        enum: DISCOUNT_TYPES
    }).notNull(),
    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("value").notNull(),
    scope: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("scope", {
        enum: PROMOTION_SCOPES
    }).default("ALL").notNull(),
    /** Brand name, category id or product id, depending on scope; null for ALL */ scopeValue: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("scope_value"),
    startsAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("starts_at").notNull(),
    endsAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ends_at").notNull(),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull(),
    showBanner: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("show_banner", {
        mode: "boolean"
    }).default(false).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("promotions_type", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("discount_type", DISCOUNT_TYPES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("promotions_scope", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("scope", PROMOTION_SCOPES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("promotions_value", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.value} > 0 AND (${t.discountType} <> 'PERCENT' OR ${t.value} <= 9000)`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("promotions_scope_value", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`(${t.scope} = 'ALL') = (${t.scopeValue} IS NULL)`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("promotions_window", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.endsAt} > ${t.startsAt}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("promotions_active_idx").on(t.isActive, t.startsAt, t.endsAt)
    ]);
const coupons = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("coupons", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("code").notNull().unique(),
    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("description"),
    discountType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("discount_type", {
        enum: DISCOUNT_TYPES
    }).notNull(),
    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("value").notNull(),
    minOrderPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("min_order_paisa").default(0).notNull(),
    /** Cap for percentage coupons, in paisa; null = no cap */ maxDiscountPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("max_discount_paisa"),
    usage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("usage", {
        enum: COUPON_USAGE
    }).default("MULTI_USE").notNull(),
    /** null = unlimited (MULTI_USE only); SINGLE_USE is always 1 */ maxRedemptions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("max_redemptions"),
    redemptionCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("redemption_count").default(0).notNull(),
    startsAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("starts_at").notNull(),
    endsAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ends_at").notNull(),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull(),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("created_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_code_format", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.code} = upper(${t.code}) AND length(${t.code}) BETWEEN 3 AND 32 AND ${t.code} NOT GLOB '*[^A-Z0-9-]*'`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_type", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("discount_type", DISCOUNT_TYPES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_usage", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("usage", COUPON_USAGE)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_value", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.value} > 0 AND (${t.discountType} <> 'PERCENT' OR ${t.value} <= 9000)`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_single_use", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.usage} <> 'SINGLE_USE' OR ${t.maxRedemptions} = 1`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_redemptions", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.redemptionCount} >= 0 AND (${t.maxRedemptions} IS NULL OR ${t.redemptionCount} <= ${t.maxRedemptions})`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_min_order", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.minOrderPaisa} >= 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupons_window", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.endsAt} > ${t.startsAt}`)
    ]);
const couponRedemptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("coupon_redemptions", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    couponId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("coupon_id").notNull().references(()=>coupons.id),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id),
    customerPhone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("customer_phone"),
    discountPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("discount_paisa").notNull(),
    redeemedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("redeemed_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("coupon_redemptions_coupon_order_unique").on(t.couponId, t.orderId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("coupon_redemptions_discount_positive", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.discountPaisa} > 0`)
    ]);
}),
"[project]/src/db/schema/index.ts [instrumentation] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/inventory.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/catalog.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/discounts.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/logistics.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/customers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/purchasing.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/orders.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/returns.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/content.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/system.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/relations.ts [instrumentation] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/src/db/schema/inventory.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "STOCK_REFERENCE_TYPES",
    ()=>STOCK_REFERENCE_TYPES,
    "STOCK_TRANSACTION_TYPES",
    ()=>STOCK_TRANSACTION_TYPES,
    "productVariants",
    ()=>productVariants,
    "products",
    ()=>products,
    "stockLedger",
    ()=>stockLedger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/real.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
;
;
;
const STOCK_TRANSACTION_TYPES = [
    // Blueprint values
    "INBOUND_PO",
    "STORE_SALE",
    "COUNTER_POS",
    "REPAIR_RETURN",
    "MANUAL_ADJUST",
    // Amendment A-3
    "ORDER_CANCEL_RESTOCK",
    "RETURN_TO_VENDOR",
    "DAMAGED_WRITE_OFF",
    "OPENING_BALANCE"
];
const STOCK_REFERENCE_TYPES = [
    "ORDER",
    "PO",
    "RETURN",
    "ADJUSTMENT",
    "COUNT"
];
const products = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("products", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    brand: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("brand").notNull(),
    model: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("model").notNull(),
    displayType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("display_type").notNull(),
    qualityGrade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("quality_grade").notNull(),
    sku: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("sku").unique().notNull(),
    costPrice: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("cost_price").notNull(),
    retailPricePKR: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("retail_price_pkr").notNull(),
    wholesalePricePKR: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("wholesale_price_pkr").notNull(),
    lowStockThreshold: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("low_stock_threshold").default(5).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("created_at").default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`CURRENT_TIMESTAMP`).notNull(),
    // --- Amendment A-1 ---
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("slug").unique().notNull(),
    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("description"),
    compatibility: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("compatibility", {
        mode: "json"
    }).$type().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`'[]'`).notNull(),
    warrantyDays: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("warranty_days").default(7).notNull(),
    isPublished: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_published", {
        mode: "boolean"
    }).default(false).notNull(),
    archivedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("archived_at"),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("updated_at").default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`CURRENT_TIMESTAMP`).notNull(),
    // --- Amendment A-7 (v1.2, SPECIFICATION §4.16) ---
    /** categories.id — integrity enforced by triggers in migration 0003 (adding a real FK would rebuild this table) */ categoryId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("category_id"),
    featureTags: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("feature_tags", {
        mode: "json"
    }).$type().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`'[]'`).notNull(),
    isFeatured: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_featured", {
        mode: "boolean"
    }).default(false).notNull(),
    isFeaturedHero: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_featured_hero", {
        mode: "boolean"
    }).default(false).notNull(),
    /** Product-level sale price in rupees (blueprint convention); null = no sale */ salePricePKR: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("sale_price_pkr"),
    saleStartsAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("sale_starts_at"),
    saleEndsAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("sale_ends_at")
}, (t)=>[
        // --- Amendment A-5 ---
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("products_brand_model_idx").on(t.brand, t.model),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("products_category_idx").on(t.categoryId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("products_prices_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.costPrice} >= 0 AND ${t.retailPricePKR} >= 0 AND ${t.wholesalePricePKR} >= 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("products_low_stock_threshold_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.lowStockThreshold} >= 0`)
    ]);
const productVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("product_variants", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    productId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("product_id").references(()=>products.id, {
        onDelete: "cascade"
    }).notNull(),
    color: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("color").notNull(),
    currentStock: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("current_stock").default(0).notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("updated_at").default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`CURRENT_TIMESTAMP`).notNull(),
    // --- Amendment A-2 ---
    variantSku: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("variant_sku").unique().notNull(),
    variantLabel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("variant_label"),
    binLocation: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("bin_location"),
    archivedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("archived_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("product_variants_stock_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.currentStock} >= 0`),
        // --- Amendment A-5 ---
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("product_variants_product_idx").on(t.productId)
    ]);
const stockLedger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("stock_ledger", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    variantId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("variant_id").references(()=>productVariants.id, {
        onDelete: "cascade"
    }).notNull(),
    transactionType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("transaction_type", {
        enum: STOCK_TRANSACTION_TYPES
    }).notNull(),
    quantityChanged: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("quantity_changed").notNull(),
    previousStock: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("previous_stock").notNull(),
    newStock: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("new_stock").notNull(),
    referenceId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("reference_id"),
    operatorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("operator_id").notNull(),
    notes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("notes"),
    timestamp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("timestamp").default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`CURRENT_TIMESTAMP`).notNull(),
    // --- Amendment A-4 ---
    referenceType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("reference_type", {
        enum: STOCK_REFERENCE_TYPES
    }),
    unitCostPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("unit_cost_paisa")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("stock_ledger_transaction_type", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("transaction_type", STOCK_TRANSACTION_TYPES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("stock_ledger_reference_type", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.referenceType} IS NULL OR ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("reference_type", STOCK_REFERENCE_TYPES)}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("stock_ledger_quantity_non_zero", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.quantityChanged} <> 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("stock_ledger_arithmetic", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.previousStock} + ${t.quantityChanged} = ${t.newStock}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("stock_ledger_new_stock_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.newStock} >= 0`),
        // --- Amendment A-5 ---
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("stock_ledger_variant_time_idx").on(t.variantId, t.timestamp),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("stock_ledger_reference_idx").on(t.referenceId)
    ]);
}),
"[project]/src/db/schema/logistics.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COURIERS",
    ()=>COURIERS,
    "SHIPMENT_STATUSES",
    ()=>SHIPMENT_STATUSES,
    "deliveryZones",
    ()=>deliveryZones
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/real.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
;
;
;
const COURIERS = [
    "LEOPARDS",
    "POSTEX",
    "TCS",
    "TRAX",
    "SELF"
];
const SHIPMENT_STATUSES = [
    "BOOKED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RETURN_IN_PROGRESS",
    "RETURNED_TO_ORIGIN",
    "CANCELLED"
];
const deliveryZones = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("delivery_zones", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    city: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("city").notNull().unique(),
    province: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("province").notNull(),
    isActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_active", {
        mode: "boolean"
    }).default(true).notNull(),
    shippingFeePaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("shipping_fee_paisa").notNull(),
    codAvailable: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("cod_available", {
        mode: "boolean"
    }).default(true).notNull(),
    codFeePaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("cod_fee_paisa").default(0).notNull(),
    etaMinDays: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("eta_min_days").notNull(),
    etaMaxDays: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("eta_max_days").notNull(),
    defaultCourier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("default_courier", {
        enum: COURIERS
    }).default("LEOPARDS").notNull(),
    /** Pin position on the landing-page map, 0–100 (% of width / height). */ mapX: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("map_x").notNull(),
    mapY: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("map_y").notNull(),
    isHub: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("is_hub", {
        mode: "boolean"
    }).default(false).notNull(),
    sortOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("sort_order").default(0).notNull()
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("delivery_zones_courier", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("default_courier", COURIERS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("delivery_zones_eta", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.etaMinDays} >= 0 AND ${t.etaMaxDays} >= ${t.etaMinDays}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("delivery_zones_fees", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.shippingFeePaisa} >= 0 AND ${t.codFeePaisa} >= 0`)
    ]);
}),
"[project]/src/db/schema/orders.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DISPLAY_CURRENCIES",
    ()=>DISPLAY_CURRENCIES,
    "EMAIL_KINDS",
    ()=>EMAIL_KINDS,
    "EMAIL_STATUSES",
    ()=>EMAIL_STATUSES,
    "FULFILLMENT_STATUSES",
    ()=>FULFILLMENT_STATUSES,
    "ORDER_CHANNELS",
    ()=>ORDER_CHANNELS,
    "PAYMENT_METHODS",
    ()=>PAYMENT_METHODS,
    "PAYMENT_PROVIDERS",
    ()=>PAYMENT_PROVIDERS,
    "PAYMENT_RECORD_STATUSES",
    ()=>PAYMENT_RECORD_STATUSES,
    "PAYMENT_STATUSES",
    ()=>PAYMENT_STATUSES,
    "PRICE_TIERS",
    ()=>PRICE_TIERS,
    "emailLog",
    ()=>emailLog,
    "orderAccessTokens",
    ()=>orderAccessTokens,
    "orderItems",
    ()=>orderItems,
    "orders",
    ()=>orders,
    "payments",
    ()=>payments,
    "shipments",
    ()=>shipments,
    "webhookEvents",
    ()=>webhookEvents
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/real.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/customers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/inventory.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/logistics.ts [instrumentation] (ecmascript)");
;
;
;
;
;
;
;
const ORDER_CHANNELS = [
    "ONLINE",
    "COUNTER"
];
const PRICE_TIERS = [
    "RETAIL",
    "WHOLESALE"
];
const PAYMENT_METHODS = [
    "COD",
    "JAZZCASH",
    "EASYPAISA",
    "NAYAPAY",
    "AGGREGATOR",
    "CARD_STRIPE",
    "BANK_TRANSFER",
    "CASH",
    "POS_CARD"
];
const PAYMENT_STATUSES = [
    "UNPAID",
    "PENDING_VERIFICATION",
    "PAID",
    "FAILED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
    "COD_PENDING",
    "COD_COLLECTED",
    "COD_REMITTED"
];
const FULFILLMENT_STATUSES = [
    "NEW",
    "CONFIRMED",
    "PACKED",
    "BOOKED",
    "IN_TRANSIT",
    "DELIVERED",
    "RETURNED_TO_ORIGIN",
    "CANCELLED"
];
const PAYMENT_PROVIDERS = [
    "STRIPE",
    "JAZZCASH",
    "EASYPAISA",
    "NAYAPAY",
    "AGGREGATOR",
    "MANUAL",
    "CASH"
];
const PAYMENT_RECORD_STATUSES = [
    "INITIATED",
    "PENDING",
    "SUCCEEDED",
    "FAILED",
    "REFUNDED"
];
const DISPLAY_CURRENCIES = [
    "PKR",
    "USD"
];
const orders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("orders", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("code").notNull().unique(),
    channel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("channel", {
        enum: ORDER_CHANNELS
    }).notNull(),
    customerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("customer_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"].id, {
        onDelete: "set null"
    }),
    guestName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("guest_name"),
    guestPhone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("guest_phone"),
    guestEmail: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("guest_email"),
    shippingAddress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("shipping_address", {
        mode: "json"
    }).$type(),
    cityId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("city_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"].id),
    priceTier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("price_tier", {
        enum: PRICE_TIERS
    }).default("RETAIL").notNull(),
    subtotalPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("subtotal_paisa").notNull(),
    discountPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("discount_paisa").default(0).notNull(),
    shippingFeePaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("shipping_fee_paisa").default(0).notNull(),
    codFeePaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("cod_fee_paisa").default(0).notNull(),
    totalPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("total_paisa").notNull(),
    displayCurrency: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("display_currency", {
        enum: DISPLAY_CURRENCIES
    }).default("PKR").notNull(),
    fxRateUsed: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("fx_rate_used"),
    paymentMethod: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("payment_method", {
        enum: PAYMENT_METHODS
    }).notNull(),
    paymentStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("payment_status", {
        enum: PAYMENT_STATUSES
    }).default("UNPAID").notNull(),
    fulfillmentStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("fulfillment_status", {
        enum: FULFILLMENT_STATUSES
    }).default("NEW").notNull(),
    idempotencyKey: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("idempotency_key").notNull().unique(),
    placedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("placed_at"),
    paidAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("paid_at"),
    cancelledAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cancelled_at"),
    cancelReason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cancel_reason"),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("created_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    notes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("notes"),
    /** v1.13 (M9): cash the customer handed over at the counter; change = this − total. */ cashReceivedPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("cash_received_paisa"),
    /** v1.13 (M9): why a manager/owner took money off a counter ticket. */ discountReason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("discount_reason")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_channel", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("channel", ORDER_CHANNELS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_price_tier", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("price_tier", PRICE_TIERS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_payment_method", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("payment_method", PAYMENT_METHODS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_payment_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("payment_status", PAYMENT_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_fulfillment_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("fulfillment_status", FULFILLMENT_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_display_currency", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("display_currency", DISPLAY_CURRENCIES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_total_arithmetic", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.totalPaisa} = ${t.subtotalPaisa} - ${t.discountPaisa} + ${t.shippingFeePaisa} + ${t.codFeePaisa}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_amounts_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.subtotalPaisa} >= 0 AND ${t.discountPaisa} >= 0 AND ${t.totalPaisa} >= 0`),
        // Online orders need a contact; counter sales may be anonymous walk-ins
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("orders_online_contact", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.channel} = 'COUNTER' OR ${t.customerId} IS NOT NULL OR ${t.guestPhone} IS NOT NULL`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("orders_status_idx").on(t.fulfillmentStatus, t.paymentStatus),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("orders_placed_idx").on(t.placedAt),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("orders_customer_idx").on(t.customerId)
    ]);
const orderItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("order_items", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").notNull().references(()=>orders.id, {
        onDelete: "cascade"
    }),
    variantId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("variant_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id),
    productSnapshot: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("product_snapshot", {
        mode: "json"
    }).$type().notNull(),
    quantity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("quantity").notNull(),
    unitPricePaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("unit_price_paisa").notNull(),
    unitCostPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("unit_cost_paisa").notNull(),
    lineTotalPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("line_total_paisa").notNull(),
    warrantyUntil: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("warranty_until")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("order_items_quantity_positive", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.quantity} > 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("order_items_line_total", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.lineTotalPaisa} = ${t.quantity} * ${t.unitPricePaisa}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("order_items_order_idx").on(t.orderId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("order_items_variant_idx").on(t.variantId)
    ]);
const payments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("payments", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").notNull().references(()=>orders.id),
    provider: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("provider", {
        enum: PAYMENT_PROVIDERS
    }).notNull(),
    /** Gateway transaction ID, or the wallet TID for manual payments once verified */ providerRef: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("provider_ref"),
    /** Transaction ID typed by the customer at checkout (manual wallet payments) */ manualReference: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("manual_reference"),
    payerMsisdn: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("payer_msisdn"),
    amountPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("amount_paisa").notNull(),
    currency: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("currency", {
        enum: DISPLAY_CURRENCIES
    }).default("PKR").notNull(),
    fxRateUsed: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("fx_rate_used"),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: PAYMENT_RECORD_STATUSES
    }).default("INITIATED").notNull(),
    verifiedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("verified_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    verifiedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("verified_at"),
    rawResponseHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("raw_response_hash"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("payments_provider", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("provider", PAYMENT_PROVIDERS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("payments_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", PAYMENT_RECORD_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("payments_amount_positive", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.amountPaisa} > 0`),
        // The same transaction ID can never be claimed by two orders (spec §4.9)
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("payments_provider_ref_unique").on(t.provider, t.providerRef),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("payments_manual_reference_unique").on(t.provider, t.manualReference),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("payments_order_idx").on(t.orderId)
    ]);
const orderAccessTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("order_access_tokens", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").notNull().references(()=>orders.id, {
        onDelete: "cascade"
    }),
    tokenHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("token_hash").notNull().unique(),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("expires_at").notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("order_access_tokens_order_idx").on(t.orderId)
    ]);
const EMAIL_KINDS = [
    "ORDER_PLACED",
    "SALES_COPY",
    "PAYMENT_CONFIRMED",
    "DISPATCHED",
    "CANCELLED"
];
const EMAIL_STATUSES = [
    "SENT",
    "FAILED",
    "SKIPPED"
];
const emailLog = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("email_log", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").references(()=>orders.id, {
        onDelete: "cascade"
    }),
    kind: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("kind", {
        enum: EMAIL_KINDS
    }).notNull(),
    recipient: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("recipient").notNull(),
    subject: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("subject").notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: EMAIL_STATUSES
    }).notNull(),
    detail: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("detail"),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("created_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("email_log_kind", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("kind", EMAIL_KINDS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("email_log_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", EMAIL_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("email_log_order_idx").on(t.orderId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("email_log_recipient_idx").on(t.recipient, t.createdAt)
    ]);
const webhookEvents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("webhook_events", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    provider: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("provider").notNull(),
    eventId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("event_id").notNull(),
    receivedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("received_at"),
    processedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("processed_at"),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: [
            "RECEIVED",
            "PROCESSED",
            "IGNORED",
            "FAILED"
        ]
    }).default("RECEIVED").notNull(),
    payloadSha256: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("payload_sha256").notNull()
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("webhook_events_provider_event_unique").on(t.provider, t.eventId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("webhook_events_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", [
            "RECEIVED",
            "PROCESSED",
            "IGNORED",
            "FAILED"
        ]))
    ]);
const shipments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("shipments", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").notNull().references(()=>orders.id),
    courier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("courier", {
        enum: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["COURIERS"]
    }).notNull(),
    serviceType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("service_type"),
    /** Consignment number from the courier; entered manually until API keys arrive */ cnNumber: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cn_number"),
    labelUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("label_url"),
    weightGrams: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("weight_grams"),
    codAmountPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("cod_amount_paisa").default(0).notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SHIPMENT_STATUSES"]
    }).default("BOOKED").notNull(),
    lastTrackingEvent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("last_tracking_event"),
    bookedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("booked_at"),
    deliveredAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("delivered_at"),
    rtoAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("rto_at"),
    loadsheetId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("loadsheet_id"),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("created_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id)
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("shipments_courier", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("courier", __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["COURIERS"])),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("shipments_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SHIPMENT_STATUSES"])),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("shipments_cod_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.codAmountPaisa} >= 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("shipments_courier_cn_unique").on(t.courier, t.cnNumber),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("shipments_order_idx").on(t.orderId)
    ]);
}),
"[project]/src/db/schema/purchasing.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PAYMENT_TERMS",
    ()=>PAYMENT_TERMS,
    "PO_STATUSES",
    ()=>PO_STATUSES,
    "VENDOR_CURRENCIES",
    ()=>VENDOR_CURRENCIES,
    "purchaseOrderItems",
    ()=>purchaseOrderItems,
    "purchaseOrders",
    ()=>purchaseOrders,
    "vendors",
    ()=>vendors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/real.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/inventory.ts [instrumentation] (ecmascript)");
;
;
;
;
;
const VENDOR_CURRENCIES = [
    "PKR",
    "USD",
    "CNY",
    "AED"
];
const PAYMENT_TERMS = [
    "ADVANCE",
    "NET_15",
    "NET_30"
];
const PO_STATUSES = [
    "DRAFT",
    "ORDERED",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED"
];
const vendors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("vendors", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("code").notNull().unique(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    contactPerson: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("contact_person"),
    phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone"),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email"),
    city: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("city"),
    /** ISO 3166-1 alpha-2, e.g. 'PK', 'CN', 'AE' */ country: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("country").default("PK").notNull(),
    currency: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("currency", {
        enum: VENDOR_CURRENCIES
    }).default("PKR").notNull(),
    paymentTerms: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("payment_terms", {
        enum: PAYMENT_TERMS
    }).default("ADVANCE").notNull(),
    leadTimeDays: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("lead_time_days").default(7).notNull(),
    rating: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("rating"),
    brandsSupplied: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("brands_supplied", {
        mode: "json"
    }).$type().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`'[]'`).notNull(),
    notes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("notes"),
    archivedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("archived_at"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("vendors_currency", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("currency", VENDOR_CURRENCIES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("vendors_payment_terms", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("payment_terms", PAYMENT_TERMS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("vendors_rating", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("vendors_country", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`length(${t.country}) = 2`)
    ]);
const purchaseOrders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("purchase_orders", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("code").notNull().unique(),
    vendorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("vendor_id").notNull().references(()=>vendors.id),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: PO_STATUSES
    }).default("DRAFT").notNull(),
    orderedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ordered_at"),
    expectedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("expected_at"),
    receivedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("received_at"),
    currency: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("currency", {
        enum: VENDOR_CURRENCIES
    }).default("PKR").notNull(),
    /** PKR per 1 unit of `currency` at time of order; 1 for PKR */ fxRateToPkr: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$real$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["real"])("fx_rate_to_pkr").default(1).notNull(),
    shippingCostPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("shipping_cost_paisa").default(0).notNull(),
    customsDutyPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("customs_duty_paisa").default(0).notNull(),
    otherLandedCostPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("other_landed_cost_paisa").default(0).notNull(),
    notes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("notes"),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("created_by").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("purchase_orders_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", PO_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("purchase_orders_currency", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("currency", VENDOR_CURRENCIES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("purchase_orders_fx_positive", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.fxRateToPkr} > 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("purchase_orders_costs_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.shippingCostPaisa} >= 0 AND ${t.customsDutyPaisa} >= 0 AND ${t.otherLandedCostPaisa} >= 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("purchase_orders_vendor_idx").on(t.vendorId)
    ]);
const purchaseOrderItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("purchase_order_items", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    poId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("po_id").notNull().references(()=>purchaseOrders.id, {
        onDelete: "cascade"
    }),
    variantId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("variant_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id),
    qtyOrdered: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("qty_ordered").notNull(),
    qtyReceived: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("qty_received").default(0).notNull(),
    /** Unit cost in the PO currency's minor unit (paisa, cents, fen) */ unitCostForeign: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("unit_cost_foreign").notNull(),
    /** Filled on receipt: unit cost × fx + allocated landed costs */ landedUnitCostPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("landed_unit_cost_paisa")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("po_items_qty", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.qtyOrdered} > 0 AND ${t.qtyReceived} >= 0 AND ${t.qtyReceived} <= ${t.qtyOrdered}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("po_items_cost_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.unitCostForeign} >= 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("po_items_po_idx").on(t.poId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("po_items_variant_idx").on(t.variantId)
    ]);
}),
"[project]/src/db/schema/relations.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addressesRelations",
    ()=>addressesRelations,
    "categoriesRelations",
    ()=>categoriesRelations,
    "couponRedemptionsRelations",
    ()=>couponRedemptionsRelations,
    "couponsRelations",
    ()=>couponsRelations,
    "customersRelations",
    ()=>customersRelations,
    "heroSlidesRelations",
    ()=>heroSlidesRelations,
    "orderItemsRelations",
    ()=>orderItemsRelations,
    "ordersRelations",
    ()=>ordersRelations,
    "paymentsRelations",
    ()=>paymentsRelations,
    "productImagesRelations",
    ()=>productImagesRelations,
    "productVariantsRelations",
    ()=>productVariantsRelations,
    "productsRelations",
    ()=>productsRelations,
    "purchaseOrderItemsRelations",
    ()=>purchaseOrderItemsRelations,
    "purchaseOrdersRelations",
    ()=>purchaseOrdersRelations,
    "returnItemsRelations",
    ()=>returnItemsRelations,
    "returnsRelations",
    ()=>returnsRelations,
    "shipmentsRelations",
    ()=>shipmentsRelations,
    "stockLedgerRelations",
    ()=>stockLedgerRelations,
    "vendorClaimsRelations",
    ()=>vendorClaimsRelations,
    "vendorsRelations",
    ()=>vendorsRelations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/relations.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/customers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/inventory.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/catalog.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/discounts.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/logistics.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/orders.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/purchasing.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/returns.ts [instrumentation] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
const productsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"], ({ one, many })=>({
        variants: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"]),
        images: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productImages"]),
        category: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["categories"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"].categoryId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["categories"].id
            ]
        })
    }));
const categoriesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["categories"], ({ many })=>({
        products: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"])
    }));
const productImagesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productImages"], ({ one })=>({
        product: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productImages"].productId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"].id
            ]
        }),
        variant: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productImages"].variantId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id
            ]
        })
    }));
const heroSlidesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["heroSlides"], ({ one })=>({
        product: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["heroSlides"].productId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"].id
            ]
        })
    }));
const couponsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["coupons"], ({ many })=>({
        redemptions: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponRedemptions"])
    }));
const couponRedemptionsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponRedemptions"], ({ one })=>({
        coupon: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["coupons"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponRedemptions"].couponId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["coupons"].id
            ]
        }),
        order: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponRedemptions"].orderId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id
            ]
        })
    }));
const productVariantsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"], ({ one, many })=>({
        product: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].productId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"].id
            ]
        }),
        ledger: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["stockLedger"])
    }));
const stockLedgerRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["stockLedger"], ({ one })=>({
        variant: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["stockLedger"].variantId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id
            ]
        })
    }));
const customersRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"], ({ one, many })=>({
        user: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"].userId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id
            ]
        }),
        addresses: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["addresses"]),
        orders: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"])
    }));
const addressesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["addresses"], ({ one })=>({
        customer: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["addresses"].customerId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"].id
            ]
        }),
        city: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["addresses"].cityId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"].id
            ]
        })
    }));
const vendorsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"], ({ many })=>({
        purchaseOrders: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrders"]),
        claims: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorClaims"])
    }));
const purchaseOrdersRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrders"], ({ one, many })=>({
        vendor: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrders"].vendorId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"].id
            ]
        }),
        items: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrderItems"])
    }));
const purchaseOrderItemsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrderItems"], ({ one })=>({
        purchaseOrder: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrders"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrderItems"].poId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrders"].id
            ]
        }),
        variant: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrderItems"].variantId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id
            ]
        })
    }));
const ordersRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"], ({ one, many })=>({
        customer: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].customerId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"].id
            ]
        }),
        city: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].cityId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"].id
            ]
        }),
        items: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"]),
        payments: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["payments"]),
        shipments: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["shipments"]),
        returns: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returns"])
    }));
const orderItemsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"], ({ one })=>({
        order: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"].orderId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id
            ]
        }),
        variant: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"].variantId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"].id
            ]
        })
    }));
const paymentsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["payments"], ({ one })=>({
        order: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["payments"].orderId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id
            ]
        })
    }));
const shipmentsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["shipments"], ({ one })=>({
        order: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["shipments"].orderId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id
            ]
        })
    }));
const returnsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returns"], ({ one, many })=>({
        order: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returns"].orderId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id
            ]
        }),
        items: many(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"])
    }));
const returnItemsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"], ({ one })=>({
        return: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returns"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"].returnId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returns"].id
            ]
        }),
        orderItem: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"].orderItemId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"].id
            ]
        })
    }));
const vendorClaimsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorClaims"], ({ one })=>({
        vendor: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorClaims"].vendorId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"].id
            ]
        }),
        returnItem: one(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"], {
            fields: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorClaims"].returnItemId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"].id
            ]
        })
    }));
}),
"[project]/src/db/schema/returns.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DISPOSITIONS",
    ()=>DISPOSITIONS,
    "ITEM_CONDITIONS",
    ()=>ITEM_CONDITIONS,
    "RETURN_REASONS",
    ()=>RETURN_REASONS,
    "RETURN_RESOLUTIONS",
    ()=>RETURN_RESOLUTIONS,
    "RETURN_STATUSES",
    ()=>RETURN_STATUSES,
    "VENDOR_CLAIM_STATUSES",
    ()=>VENDOR_CLAIM_STATUSES,
    "returnItems",
    ()=>returnItems,
    "returns",
    ()=>returns,
    "vendorClaims",
    ()=>vendorClaims
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/checks.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/customers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/orders.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/purchasing.ts [instrumentation] (ecmascript)");
;
;
;
;
;
;
;
const RETURN_REASONS = [
    "DEAD_ON_ARRIVAL",
    "TOUCH_FAULT",
    "LINES_ON_DISPLAY",
    "WRONG_ITEM",
    "DAMAGED_IN_TRANSIT",
    "CHANGE_OF_MIND"
];
const RETURN_STATUSES = [
    "REQUESTED",
    "RECEIVED",
    "INSPECTING",
    "APPROVED",
    "REJECTED",
    "CLOSED"
];
const RETURN_RESOLUTIONS = [
    "REFUND",
    "REPLACEMENT",
    "STORE_CREDIT",
    "REJECTED"
];
const ITEM_CONDITIONS = [
    "RESELLABLE",
    "DEFECTIVE",
    "PHYSICALLY_DAMAGED"
];
const DISPOSITIONS = [
    "RESTOCK",
    "RETURN_TO_VENDOR",
    "WRITE_OFF"
];
const VENDOR_CLAIM_STATUSES = [
    "OPEN",
    "SENT",
    "CREDITED",
    "REJECTED"
];
const returns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("returns", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("code").notNull().unique(),
    orderId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"].id),
    customerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("customer_id").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"].id, {
        onDelete: "set null"
    }),
    reason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("reason", {
        enum: RETURN_REASONS
    }).notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: RETURN_STATUSES
    }).default("REQUESTED").notNull(),
    resolution: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("resolution", {
        enum: RETURN_RESOLUTIONS
    }),
    withinWarranty: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("within_warranty", {
        mode: "boolean"
    }).notNull(),
    inspectedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("inspected_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    inspectionNotes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("inspection_notes"),
    refundPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("refund_paisa").default(0).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at"),
    closedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("closed_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("returns_reason", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("reason", RETURN_REASONS)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("returns_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", RETURN_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("returns_resolution", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.resolution} IS NULL OR ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("resolution", RETURN_RESOLUTIONS)}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("returns_refund_non_negative", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.refundPaisa} >= 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("returns_order_idx").on(t.orderId)
    ]);
const returnItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("return_items", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    returnId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("return_id").notNull().references(()=>returns.id, {
        onDelete: "cascade"
    }),
    orderItemId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("order_item_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"].id),
    quantity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("quantity").notNull(),
    condition: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("condition", {
        enum: ITEM_CONDITIONS
    }),
    /** Stock only moves when a disposition is set (spec §4.12) */ disposition: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("disposition", {
        enum: DISPOSITIONS
    })
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("return_items_quantity_positive", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.quantity} > 0`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("return_items_condition", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.condition} IS NULL OR ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("condition", ITEM_CONDITIONS)}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("return_items_disposition", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.disposition} IS NULL OR ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("disposition", DISPOSITIONS)}`),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("return_items_return_idx").on(t.returnId)
    ]);
const vendorClaims = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("vendor_claims", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    vendorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("vendor_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"].id),
    returnItemId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("return_item_id").notNull().references(()=>returnItems.id),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: VENDOR_CLAIM_STATUSES
    }).default("OPEN").notNull(),
    creditPaisa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("credit_paisa").default(0).notNull(),
    notes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("notes"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$checks$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["check"])("vendor_claims_status", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["inList"])("status", VENDOR_CLAIM_STATUSES)),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("vendor_claims_vendor_idx").on(t.vendorId)
    ]);
}),
"[project]/src/db/schema/system.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "adminAuditLog",
    ()=>adminAuditLog,
    "settings",
    ()=>settings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/_helpers.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
;
;
;
const settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("settings", {
    key: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("key").$type().primaryKey(),
    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("value", {
        mode: "json"
    }).notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at"),
    updatedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("updated_by").references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id)
});
const adminAuditLog = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sqliteTable"])("admin_audit_log", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["id"])(),
    actorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("actor_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"].id),
    action: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("action").notNull(),
    entity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("entity").notNull(),
    entityId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("entity_id"),
    before: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("before", {
        mode: "json"
    }),
    after: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("after", {
        mode: "json"
    }),
    ip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$_helpers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("admin_audit_entity_idx").on(t.entity, t.entityId),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("admin_audit_actor_idx").on(t.actorId, t.createdAt)
    ]);
}),
"[project]/src/server/audit-log.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "writeAudit",
    ()=>writeAudit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/db/schema/index.ts [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/system.ts [instrumentation] (ecmascript)");
;
function writeAudit(db, ctx, entry) {
    db.insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["adminAuditLog"]).values({
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        before: entry.before ?? null,
        after: entry.after ?? null,
        ip: ctx.ip,
        userAgent: ctx.userAgent
    }).run();
}
}),
"[project]/src/server/notify/email.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_DAILY_LIMIT",
    ()=>DEFAULT_DAILY_LIMIT,
    "EMAIL_ENV_KEYS",
    ()=>EMAIL_ENV_KEYS,
    "GMAIL_FREE_DAILY_RECIPIENTS",
    ()=>GMAIL_FREE_DAILY_RECIPIENTS,
    "GMAIL_SMTP_HOST",
    ()=>GMAIL_SMTP_HOST,
    "GMAIL_SMTP_PORT",
    ()=>GMAIL_SMTP_PORT,
    "RETIRED_EMAIL_KEYS",
    ()=>RETIRED_EMAIL_KEYS,
    "alertRecipients",
    ()=>alertRecipients,
    "emailsSentToday",
    ()=>emailsSentToday,
    "gmailTransportOptions",
    ()=>gmailTransportOptions,
    "readGmailConfig",
    ()=>readGmailConfig,
    "sendEmail",
    ()=>sendEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nodemailer$2f$dist$2f$esm$2f$nodemailer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nodemailer/dist/esm/nodemailer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/db/schema/index.ts [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/system.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
;
;
;
const GMAIL_SMTP_HOST = "smtp.gmail.com";
const GMAIL_SMTP_PORT = 465; // TLS from the first byte
const GMAIL_FREE_DAILY_RECIPIENTS = 500;
const DEFAULT_DAILY_LIMIT = 450;
const EMAIL_ENV_KEYS = [
    "GMAIL_USER",
    "GMAIL_FROM_NAME",
    "GMAIL_AUTH",
    "GMAIL_APP_PASSWORD",
    "GMAIL_OAUTH_CLIENT_ID",
    "GMAIL_OAUTH_CLIENT_SECRET",
    "GMAIL_OAUTH_REFRESH_TOKEN",
    "GMAIL_DAILY_LIMIT",
    "ALERT_EMAIL_TO",
    "EMAIL_TEST_SMTP"
];
const RETIRED_EMAIL_KEYS = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "ALERT_EMAIL_FROM"
];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function readGmailConfig(env = process.env) {
    const v = (k)=>env[k]?.trim() ?? "";
    const problems = [];
    const warnings = [];
    const user = v("GMAIL_USER").toLowerCase();
    const rawMode = v("GMAIL_AUTH").toLowerCase() || "app_password";
    const mode = rawMode === "oauth2" ? "oauth2" : "app_password";
    if (rawMode !== "app_password" && rawMode !== "oauth2") problems.push(`GMAIL_AUTH “${rawMode}” isn’t known — use app_password or oauth2.`);
    let configured = false;
    if (!user) {
        if (v("GMAIL_APP_PASSWORD") || v("GMAIL_OAUTH_REFRESH_TOKEN")) problems.push("GMAIL_USER is empty — set it to the shop’s Gmail address.");
    } else if (!EMAIL.test(user)) {
        problems.push(`GMAIL_USER “${user}” isn’t an email address.`);
    } else if (mode === "app_password") {
        const pass = v("GMAIL_APP_PASSWORD").replace(/\s/g, "");
        if (!pass) problems.push("GMAIL_APP_PASSWORD is empty — create a 16-letter app password in the Google Account (Security → 2-Step Verification → App passwords).");
        else if (!/^[a-z]{16}$/i.test(pass)) problems.push("GMAIL_APP_PASSWORD should be the 16-letter app password from Google, not the normal Gmail password.");
        else configured = true;
    } else {
        const missing = [
            "GMAIL_OAUTH_CLIENT_ID",
            "GMAIL_OAUTH_CLIENT_SECRET",
            "GMAIL_OAUTH_REFRESH_TOKEN"
        ].filter((k)=>!v(k));
        if (missing.length) problems.push(`GMAIL_AUTH=oauth2 needs ${missing.join(", ")}.`);
        else configured = true;
    }
    if (user && !/@(gmail|googlemail)\.com$/.test(user) && configured) warnings.push(`${user} isn’t a gmail.com address — that works if it is a Google Workspace account (Workspace has its own sending limits).`);
    let dailyLimit = DEFAULT_DAILY_LIMIT;
    const rawLimit = v("GMAIL_DAILY_LIMIT");
    if (rawLimit) {
        if (/^\d{1,4}$/.test(rawLimit) && Number(rawLimit) >= 1 && Number(rawLimit) <= GMAIL_FREE_DAILY_RECIPIENTS) dailyLimit = Number(rawLimit);
        else problems.push(`GMAIL_DAILY_LIMIT must be a whole number from 1 to ${GMAIL_FREE_DAILY_RECIPIENTS} (Gmail’s free limit) — using ${DEFAULT_DAILY_LIMIT}.`);
    }
    // Test hook: only a mail server on THIS machine is accepted, so mail can never be diverted elsewhere
    let testServer = null;
    const rawTest = v("EMAIL_TEST_SMTP");
    if (rawTest) {
        const m = /^(127\.0\.0\.1|localhost):(\d{1,5})$/i.exec(rawTest);
        if (m) {
            testServer = {
                host: m[1],
                port: Number(m[2])
            };
            configured = true;
            warnings.push(`EMAIL_TEST_SMTP is set: email goes to a TEST mail server on this machine (${rawTest}), not to Gmail. Remove it on the live server.`);
        } else {
            problems.push("EMAIL_TEST_SMTP is only for automated tests and must look like 127.0.0.1:2525 — it was ignored.");
        }
    }
    const presentRetired = RETIRED_EMAIL_KEYS.filter((k)=>v(k));
    if (presentRetired.length) warnings.push(`${presentRetired.join(", ")} ${presentRetired.length === 1 ? "is" : "are"} no longer used — email now goes through Gmail (GMAIL_*). Remove ${presentRetired.length === 1 ? "it" : "them"} from the environment file.`);
    return {
        configured,
        mode,
        user: user || null,
        fromName: v("GMAIL_FROM_NAME") || "Caidea",
        dailyLimit,
        testServer,
        problems,
        warnings
    };
}
function gmailTransportOptions(env = process.env) {
    const c = readGmailConfig(env);
    const timeouts = {
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000
    };
    if (c.testServer) return {
        host: c.testServer.host,
        port: c.testServer.port,
        secure: false,
        ignoreTLS: true,
        ...timeouts
    };
    const auth = c.mode === "oauth2" ? {
        type: "OAuth2",
        user: c.user ?? "",
        clientId: env.GMAIL_OAUTH_CLIENT_ID?.trim(),
        clientSecret: env.GMAIL_OAUTH_CLIENT_SECRET?.trim(),
        refreshToken: env.GMAIL_OAUTH_REFRESH_TOKEN?.trim()
    } : {
        user: c.user ?? "",
        pass: (env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "")
    };
    return {
        host: GMAIL_SMTP_HOST,
        port: GMAIL_SMTP_PORT,
        secure: true,
        auth,
        ...timeouts
    };
}
function alertRecipients(env = process.env) {
    return (env.ALERT_EMAIL_TO ?? "").split(",").map((a)=>a.trim().toLowerCase()).filter((a)=>EMAIL.test(a));
}
const karachiDay = (now)=>new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
function emailsSentToday(db, now = new Date()) {
    const v = db.select({
        value: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].value
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key, "email_daily_count")).get()?.value;
    return v && v.day === karachiDay(now) ? v.recipients : 0;
}
/** Reserves room for `n` recipients today, atomically. Returns false if that would pass the cap. */ function reserve(db, n, cap, now) {
    return db.transaction((tx)=>{
        const v = tx.select({
            value: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].value
        }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key, "email_daily_count")).get()?.value;
        const used = v && v.day === karachiDay(now) ? v.recipients : 0;
        if (used + n > cap) return false;
        const value = {
            day: karachiDay(now),
            recipients: used + n
        };
        tx.insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).values({
            key: "email_daily_count",
            value,
            updatedBy: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"]
        }).onConflictDoUpdate({
            target: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key,
            set: {
                value,
                updatedAt: now.toISOString()
            }
        }).run();
        return true;
    }, {
        behavior: "immediate"
    });
}
async function sendEmail(db, message, env = process.env, now = new Date()) {
    const c = readGmailConfig(env);
    const to = [
        ...new Set(message.to.map((a)=>a.trim().toLowerCase()).filter((a)=>EMAIL.test(a)))
    ];
    if (!c.configured) return {
        sent: false,
        detail: `Email isn’t set up: ${c.problems[0] ?? "fill in GMAIL_USER and GMAIL_APP_PASSWORD in the environment file."}`
    };
    if (to.length === 0) return {
        sent: false,
        detail: "No valid recipient (check ALERT_EMAIL_TO)."
    };
    const cap = message.priority === "security" ? GMAIL_FREE_DAILY_RECIPIENTS : c.dailyLimit;
    if (!reserve(db, to.length, cap, now)) {
        return {
            sent: false,
            detail: `Not sent: today’s Gmail allowance is used up (${emailsSentToday(db, now)} of ${cap} recipients). Sending resumes after midnight.`
        };
    }
    const transport = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nodemailer$2f$dist$2f$esm$2f$nodemailer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"].createTransport(gmailTransportOptions(env));
    try {
        await transport.sendMail({
            from: {
                name: c.fromName,
                address: c.user ?? "test@localhost"
            },
            to,
            subject: message.subject,
            text: message.text
        });
        return {
            sent: true,
            detail: `Sent from ${c.testServer ? "the TEST mail server" : c.user} to ${to.join(", ")}`
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const hint = /535|Username and Password not accepted|invalid_grant|BadCredentials/i.test(msg) ? " — Gmail refused the sign-in: check GMAIL_USER and create a new app password (changing the Gmail password cancels old app passwords)." : /550|limit|quota/i.test(msg) ? " — Gmail’s sending limit may have been reached; it resets within 24 hours." : "";
        return {
            sent: false,
            detail: `Email could not be sent: ${msg}${hint}`
        };
    } finally{
        transport.close();
    }
}
}),
"[project]/src/server/settings/payment-env.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_COD_MAX_PKR",
    ()=>DEFAULT_COD_MAX_PKR,
    "PAYMENT_ENV_KEYS",
    ()=>PAYMENT_ENV_KEYS,
    "PK_IBAN",
    ()=>PK_IBAN,
    "isValidPkIban",
    ()=>isValidPkIban,
    "readPaymentEnv",
    ()=>readPaymentEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [instrumentation] (ecmascript) <export * as z>");
;
const DEFAULT_COD_MAX_PKR = 20_000;
const PAYMENT_ENV_KEYS = [
    "COD_MAX_ORDER_PKR",
    "JAZZCASH_ACCOUNT_TITLE",
    "JAZZCASH_ACCOUNT_NUMBER",
    "EASYPAISA_ACCOUNT_TITLE",
    "EASYPAISA_ACCOUNT_NUMBER",
    "NAYAPAY_ACCOUNT_TITLE",
    "NAYAPAY_ACCOUNT_NUMBER",
    "BANK_NAME",
    "BANK_ACCOUNT_TITLE",
    "BANK_IBAN"
];
const Title = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(2).max(60);
const AccountNumber = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().regex(/^[0-9+\- ]{7,20}$/);
const PK_IBAN = /^PK\d{2}[A-Z]{4}\d{16}$/;
function isValidPkIban(iban) {
    if (!PK_IBAN.test(iban)) return false;
    let remainder = 0;
    for (const ch of iban.slice(4) + iban.slice(0, 4)){
        const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
        for (const d of digits)remainder = (remainder * 10 + Number(d)) % 97;
    }
    return remainder === 1;
}
const SAMPLE = /sample/i;
const WALLET_NAMES = {
    JAZZCASH: "JazzCash",
    EASYPAISA: "Easypaisa",
    NAYAPAY: "NayaPay"
};
function readPaymentEnv(env = process.env) {
    const problems = [];
    const val = (k)=>env[k]?.trim() ?? "";
    // Cash-on-delivery limit, whole rupees
    let codMaxPkr = DEFAULT_COD_MAX_PKR;
    const rawCod = val("COD_MAX_ORDER_PKR").replaceAll(",", "");
    if (rawCod) {
        if (/^\d{1,9}$/.test(rawCod)) codMaxPkr = Number(rawCod);
        else problems.push(`COD_MAX_ORDER_PKR “${rawCod}” isn’t a whole number of rupees — using Rs ${DEFAULT_COD_MAX_PKR.toLocaleString("en-PK")}.`);
    }
    const wallets = {};
    let sample = false;
    for (const w of Object.keys(WALLET_NAMES)){
        const title = val(`${w}_ACCOUNT_TITLE`);
        const number = val(`${w}_ACCOUNT_NUMBER`);
        if (!title && !number) continue; // not used — method stays off
        if (!Title.safeParse(title).success || !AccountNumber.safeParse(number).success) {
            problems.push(`${WALLET_NAMES[w]}: set both ${w}_ACCOUNT_TITLE and ${w}_ACCOUNT_NUMBER (number: digits, spaces or dashes). ${WALLET_NAMES[w]} is switched off until then.`);
            continue;
        }
        wallets[w] = {
            accountTitle: title,
            accountNumber: number
        };
        if (SAMPLE.test(title)) sample = true;
    }
    let bank = null;
    const bankName = val("BANK_NAME");
    const bankTitle = val("BANK_ACCOUNT_TITLE");
    const iban = val("BANK_IBAN").replace(/\s/g, "").toUpperCase();
    if (bankName || bankTitle || iban) {
        if (!Title.safeParse(bankName).success || !Title.safeParse(bankTitle).success || !PK_IBAN.test(iban)) {
            problems.push("Bank transfer: set BANK_NAME, BANK_ACCOUNT_TITLE and BANK_IBAN (24 characters, like PK36SCBL0000001123456702). Bank transfer is switched off until then.");
        } else if (!isValidPkIban(iban)) {
            problems.push(`Bank transfer: BANK_IBAN ${iban} fails the IBAN check-digit test — a character is mistyped. Copy it again from your bank statement or app. Bank transfer is switched off until then.`);
        } else {
            bank = {
                bankName,
                accountTitle: bankTitle,
                iban
            };
            if (SAMPLE.test(bankTitle) || SAMPLE.test(bankName)) sample = true;
        }
    }
    return {
        codMaxPaisa: codMaxPkr * 100,
        wallets,
        bank,
        problems,
        usesSampleDetails: sample
    };
}
}),
"[project]/src/server/settings/payment-integrity.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FIELD_LABEL",
    ()=>FIELD_LABEL,
    "acknowledgePaymentAlert",
    ()=>acknowledgePaymentAlert,
    "alertEmailText",
    ()=>alertEmailText,
    "checkPaymentDetails",
    ()=>checkPaymentDetails,
    "currentPaymentDetails",
    ()=>currentPaymentDetails,
    "fingerprint",
    ()=>fingerprint,
    "getPaymentAlert",
    ()=>getPaymentAlert,
    "getSeenPaymentDetails",
    ()=>getSeenPaymentDetails,
    "runPaymentIntegrityCheck",
    ()=>runPaymentIntegrityCheck
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/db/schema/index.ts [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/system.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/auth.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$audit$2d$log$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/audit-log.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$notify$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/notify/email.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$settings$2f$payment$2d$env$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/settings/payment-env.ts [instrumentation] (ecmascript)");
;
;
;
;
;
;
const FIELD_LABEL = {
    codLimit: "Cash-on-delivery limit",
    jazzcash: "JazzCash account",
    easypaisa: "Easypaisa account",
    nayapay: "NayaPay account",
    bank: "Bank account",
    alertEmail: "Alert email address"
};
function currentPaymentDetails(env = process.env) {
    const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$settings$2f$payment$2d$env$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["readPaymentEnv"])(env);
    const w = (k)=>p.wallets[k] ? `${p.wallets[k].accountTitle} · ${p.wallets[k].accountNumber}` : null;
    const to = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$notify$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["alertRecipients"])(env);
    return {
        codLimit: p.codMaxPaisa > 0 ? `Rs ${(p.codMaxPaisa / 100).toLocaleString("en-PK")}` : "Off",
        jazzcash: w("JAZZCASH"),
        easypaisa: w("EASYPAISA"),
        nayapay: w("NAYAPAY"),
        bank: p.bank ? `${p.bank.bankName} · ${p.bank.accountTitle} · ${p.bank.iban}` : null,
        alertEmail: to.length ? to.join(", ") : null
    };
}
function fingerprint(details) {
    const ordered = Object.keys(FIELD_LABEL).map((k)=>[
            k,
            details[k]
        ]);
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(JSON.stringify(ordered)).digest("hex");
}
function readJson(db, key) {
    const v = db.select({
        value: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].value
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key, key)).get()?.value;
    return v && typeof v === "object" ? v : null;
}
function writeJson(db, key, value) {
    const now = new Date().toISOString();
    db.insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).values({
        key,
        value,
        updatedBy: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
        updatedAt: now
    }).onConflictDoUpdate({
        target: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key,
        set: {
            value,
            updatedBy: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
            updatedAt: now
        }
    }).run();
}
const getSeenPaymentDetails = (db)=>readJson(db, "payment_details_seen");
const getPaymentAlert = (db)=>readJson(db, "payment_details_alert");
const SYSTEM_CTX = {
    ip: "server",
    userAgent: "startup check"
};
function checkPaymentDetails(db, env = process.env, now = new Date()) {
    const details = currentPaymentDetails(env);
    const fp = fingerprint(details);
    return db.transaction((tx)=>{
        const seen = readJson(tx, "payment_details_seen");
        if (seen?.fingerprint === fp) return {
            status: "unchanged",
            fingerprint: fp
        };
        writeJson(tx, "payment_details_seen", {
            fingerprint: fp,
            details,
            seenAt: now.toISOString()
        });
        if (!seen) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$audit$2d$log$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["writeAudit"])(tx, SYSTEM_CTX, {
                actorId: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
                action: "payment_details.baseline",
                entity: "settings",
                entityId: "payment_details",
                after: details
            });
            return {
                status: "baseline",
                fingerprint: fp
            };
        }
        // Merge with an alert the owner hasn't acknowledged yet, so "before" stays the last confirmed value
        const open = readJson(tx, "payment_details_alert");
        // A field already in the open alert keeps its "before" even when that was "not set" (null)
        const confirmedBefore = (field)=>{
            const pending = open?.changes.find((c)=>c.field === field);
            return pending ? pending.before : seen.details[field] ?? null;
        };
        const changes = Object.keys(FIELD_LABEL).map((field)=>({
                field,
                label: FIELD_LABEL[field],
                before: confirmedBefore(field),
                after: details[field]
            })).filter((c)=>c.before !== c.after);
        if (changes.length === 0) {
            // Changed back to the confirmed values before anyone acknowledged: nothing left to warn about
            tx.delete(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["inArray"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key, [
                "payment_details_alert"
            ])).run();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$audit$2d$log$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["writeAudit"])(tx, SYSTEM_CTX, {
                actorId: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
                action: "payment_details.reverted",
                entity: "settings",
                entityId: "payment_details",
                after: details
            });
            return {
                status: "unchanged",
                fingerprint: fp
            };
        }
        writeJson(tx, "payment_details_alert", {
            changedAt: now.toISOString(),
            changes
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$audit$2d$log$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["writeAudit"])(tx, SYSTEM_CTX, {
            actorId: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
            action: "payment_details.changed",
            entity: "settings",
            entityId: "payment_details",
            before: Object.fromEntries(changes.map((c)=>[
                    c.field,
                    c.before
                ])),
            after: Object.fromEntries(changes.map((c)=>[
                    c.field,
                    c.after
                ]))
        });
        // Tell the new alert address AND the previous one (so changing the address can't hide the alert)
        const previous = (seen.details.alertEmail ?? "").split(",").map((a)=>a.trim()).filter(Boolean);
        return {
            status: "changed",
            fingerprint: fp,
            changes,
            notify: [
                ...new Set([
                    ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$notify$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["alertRecipients"])(env),
                    ...previous
                ])
            ]
        };
    }, {
        behavior: "immediate"
    });
}
function alertEmailText(changes, changedAt) {
    const lines = changes.map((c)=>`• ${c.label}\n    was: ${c.before ?? "(not set)"}\n    now: ${c.after ?? "(not set)"}`);
    return {
        subject: "Caidea: payment details changed - please confirm",
        text: [
            "The payment details shown to customers at checkout changed when the Caidea app started.",
            `Time: ${changedAt} (UTC)`,
            "",
            ...lines,
            "",
            "If YOU made this change: sign in, open Admin → Shop settings and press “I made this change”.",
            "If you did NOT: customers may be paying someone else. Switch off the affected payment method in Shop settings,",
            "restore the correct values in the environment file on the server, restart the app, and change the server passwords."
        ].join("\n")
    };
}
async function runPaymentIntegrityCheck(db, env = process.env, now = new Date()) {
    const result = checkPaymentDetails(db, env, now);
    if (result.status !== "changed") return result;
    console.warn(`[caidea] Payment details changed: ${result.changes.map((c)=>c.label).join(", ")}. Owner alert raised.`);
    const { subject, text } = alertEmailText(result.changes, now.toISOString());
    const email = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$notify$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["sendEmail"])(db, {
        to: result.notify,
        subject,
        text,
        priority: "security"
    }, env, now).catch((e)=>({
            sent: false,
            detail: String(e)
        }));
    db.transaction((tx)=>{
        const open = readJson(tx, "payment_details_alert");
        if (open) writeJson(tx, "payment_details_alert", {
            ...open,
            email
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$audit$2d$log$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["writeAudit"])(tx, SYSTEM_CTX, {
            actorId: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
            action: email.sent ? "payment_details.alert_emailed" : "payment_details.alert_email_failed",
            entity: "settings",
            entityId: "payment_details",
            after: email
        });
    }, {
        behavior: "immediate"
    });
    if (!email.sent) console.warn(`[caidea] ${email.detail}`);
    return result;
}
function acknowledgePaymentAlert(db, actorId, ctx) {
    return db.transaction((tx)=>{
        const open = readJson(tx, "payment_details_alert");
        if (!open) return false;
        tx.delete(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["inArray"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"].key, [
            "payment_details_alert"
        ])).run();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$audit$2d$log$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["writeAudit"])(tx, ctx, {
            actorId,
            action: "payment_details.acknowledged",
            entity: "settings",
            entityId: "payment_details",
            before: open
        });
        return true;
    }, {
        behavior: "immediate"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__146t7t3._.js.map