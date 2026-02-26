"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const globalForPrisma = globalThis;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set.");
}
const pool = new pg_1.Pool({ connectionString: databaseUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development"
            ? ["info", "warn", "error"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
exports.default = prisma;
//# sourceMappingURL=database.config.js.map