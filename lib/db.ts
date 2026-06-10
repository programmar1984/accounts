import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const url =
  process.env.DATABASE_URL ??
  "postgresql://postgres:ammars@localhost:5432/shime";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

const sql = globalForDb.sql ?? postgres(url);
export const db = globalForDb.db ?? drizzle(sql, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
  globalForDb.db = db;
}

export * from "./db/schema";
