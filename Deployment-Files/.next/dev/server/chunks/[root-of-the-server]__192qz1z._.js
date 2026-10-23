module.exports = [
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/src/db/client.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$connection$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/connection.ts [instrumentation] (ecmascript)");
;
;
/**
 * The app's database handle. One connection per server process (spec §6.2:
 * a single Next.js process writes to the file). In development, hot reload
 * re-runs this module, so the connection is cached on globalThis.
 */ const globalForDb = globalThis;
const db = globalForDb.caideaDb ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$connection$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["openDatabase"])();
if ("TURBOPACK compile-time truthy", 1) globalForDb.caideaDb = db;
}),
"[project]/src/db/connection.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DATABASE_PATH",
    ()=>DATABASE_PATH,
    "openDatabase",
    ()=>openDatabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$better$2d$sqlite3$29$__ = __turbopack_context__.i("[externals]/better-sqlite3 [external] (better-sqlite3, cjs, [project]/node_modules/better-sqlite3)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$better$2d$sqlite3$2f$driver$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/better-sqlite3/driver.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/db/schema/index.ts [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema/index.ts [instrumentation] (ecmascript)");
;
;
;
;
;
const DATABASE_PATH = process.env.DATABASE_PATH ? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["resolve"])(/*turbopackIgnore: true*/ process.env.DATABASE_PATH) : (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(process.cwd(), "data", "caidea.db");
function openDatabase(path = DATABASE_PATH) {
    if (path !== ":memory:") (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["mkdirSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["dirname"])(/*turbopackIgnore: true*/ path), {
        recursive: true
    });
    const sqlite = new __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$better$2d$sqlite3$29$__["default"](path);
    sqlite.pragma("journal_mode = WAL"); // readers never block the single writer
    sqlite.pragma("busy_timeout = 5000"); // wait up to 5 s for the write lock instead of failing
    sqlite.pragma("synchronous = NORMAL"); // safe with WAL, much faster than FULL
    sqlite.pragma("foreign_keys = ON"); // SQLite ships with this OFF
    sqlite.pragma("temp_store = MEMORY");
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$better$2d$sqlite3$2f$driver$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["drizzle"])({
        client: sqlite,
        schema: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__
    });
}
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
"[project]/src/db/schema/index.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COUPON_USAGE",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["COUPON_USAGE"],
    "COURIERS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["COURIERS"],
    "CUSTOMER_TYPES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["CUSTOMER_TYPES"],
    "DISCOUNT_TYPES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["DISCOUNT_TYPES"],
    "DISPLAY_CURRENCIES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["DISPLAY_CURRENCIES"],
    "DISPOSITIONS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["DISPOSITIONS"],
    "EMAIL_KINDS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["EMAIL_KINDS"],
    "EMAIL_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["EMAIL_STATUSES"],
    "FULFILLMENT_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["FULFILLMENT_STATUSES"],
    "HERO_THEMES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["HERO_THEMES"],
    "HERO_VISUAL_TYPES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["HERO_VISUAL_TYPES"],
    "IMAGE_ANGLES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["IMAGE_ANGLES"],
    "ITEM_CONDITIONS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ITEM_CONDITIONS"],
    "MAX_HERO_SLIDES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["MAX_HERO_SLIDES"],
    "MESSAGE_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["MESSAGE_STATUSES"],
    "ORDER_CHANNELS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ORDER_CHANNELS"],
    "PAYMENT_METHODS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PAYMENT_METHODS"],
    "PAYMENT_PROVIDERS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PAYMENT_PROVIDERS"],
    "PAYMENT_RECORD_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PAYMENT_RECORD_STATUSES"],
    "PAYMENT_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PAYMENT_STATUSES"],
    "PAYMENT_TERMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PAYMENT_TERMS"],
    "PHONE_LAYOUTS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PHONE_LAYOUTS"],
    "POST_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["POST_STATUSES"],
    "PO_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PO_STATUSES"],
    "PRICE_TIERS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PRICE_TIERS"],
    "PROMOTION_SCOPES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PROMOTION_SCOPES"],
    "RETURN_REASONS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["RETURN_REASONS"],
    "RETURN_RESOLUTIONS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["RETURN_RESOLUTIONS"],
    "RETURN_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["RETURN_STATUSES"],
    "SHIPMENT_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SHIPMENT_STATUSES"],
    "STAFF_ROLES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["STAFF_ROLES"],
    "STOCK_REFERENCE_TYPES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["STOCK_REFERENCE_TYPES"],
    "STOCK_TRANSACTION_TYPES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["STOCK_TRANSACTION_TYPES"],
    "SYSTEM_USER_ID",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["SYSTEM_USER_ID"],
    "TECHNICIAN_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["TECHNICIAN_STATUSES"],
    "USER_ROLES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["USER_ROLES"],
    "VENDOR_CLAIM_STATUSES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["VENDOR_CLAIM_STATUSES"],
    "VENDOR_CURRENCIES",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["VENDOR_CURRENCIES"],
    "account",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["account"],
    "addresses",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["addresses"],
    "addressesRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["addressesRelations"],
    "adminAuditLog",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["adminAuditLog"],
    "blogPosts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["blogPosts"],
    "brands",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["brands"],
    "categories",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["categories"],
    "categoriesRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["categoriesRelations"],
    "contactMessages",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["contactMessages"],
    "couponRedemptions",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponRedemptions"],
    "couponRedemptionsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponRedemptionsRelations"],
    "coupons",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["coupons"],
    "couponsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["couponsRelations"],
    "customers",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$customers$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customers"],
    "customersRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["customersRelations"],
    "deliveryZones",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$logistics$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["deliveryZones"],
    "emailLog",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["emailLog"],
    "heroSlides",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["heroSlides"],
    "heroSlidesRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["heroSlidesRelations"],
    "orderAccessTokens",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderAccessTokens"],
    "orderItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItems"],
    "orderItemsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orderItemsRelations"],
    "orders",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["orders"],
    "ordersRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ordersRelations"],
    "payments",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["payments"],
    "paymentsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["paymentsRelations"],
    "productImages",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$catalog$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productImages"],
    "productImagesRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productImagesRelations"],
    "productVariants",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariants"],
    "productVariantsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productVariantsRelations"],
    "products",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["products"],
    "productsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["productsRelations"],
    "promotions",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$discounts$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["promotions"],
    "purchaseOrderItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrderItems"],
    "purchaseOrderItemsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrderItemsRelations"],
    "purchaseOrders",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrders"],
    "purchaseOrdersRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["purchaseOrdersRelations"],
    "returnItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItems"],
    "returnItemsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnItemsRelations"],
    "returns",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returns"],
    "returnsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["returnsRelations"],
    "services",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["services"],
    "session",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["session"],
    "settings",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$system$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["settings"],
    "shipments",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["shipments"],
    "shipmentsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["shipmentsRelations"],
    "stockLedger",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$inventory$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["stockLedger"],
    "stockLedgerRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["stockLedgerRelations"],
    "testimonials",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$content$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["testimonials"],
    "twoFactor",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["twoFactor"],
    "user",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["user"],
    "vendorClaims",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$returns$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorClaims"],
    "vendorClaimsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorClaimsRelations"],
    "vendors",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$purchasing$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendors"],
    "vendorsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$relations$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["vendorsRelations"],
    "verification",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$auth$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["verification"],
    "webhookEvents",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$orders$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["webhookEvents"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2f$index$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/db/schema/index.ts [instrumentation] (ecmascript) <locals>");
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
];

//# sourceMappingURL=%5Broot-of-the-server%5D__192qz1z._.js.map