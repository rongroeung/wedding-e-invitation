/**
 * Database connection.
 *
 * • DATABASE_URL set  → real PostgreSQL (Neon / Supabase / Vercel Postgres / …)
 * • DATABASE_URL empty → embedded PGlite (WASM Postgres) persisted in ./.data
 *
 * Both paths expose the identical Drizzle API, so nothing else in the codebase
 * has to care which one is in use.
 */
import * as schema from "./schema";

type DrizzleDb = import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __weddingDb?: DrizzleDb;
  __weddingDbReady?: Promise<DrizzleDb>;
};

export const usingEmbeddedDb = !process.env.DATABASE_URL;

async function createDb(): Promise<DrizzleDb> {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      ssl: /sslmode=require|neon\.tech|supabase|vercel-storage/.test(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : undefined,
    });
    return drizzle(pool, { schema }) as unknown as DrizzleDb;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  const dataDir = process.env.PGLITE_DIR || ".data/wedding";
  mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema }) as unknown as DrizzleDb;
  await ensureSchema(db);
  return db;
}

/** Applies the SQL migrations (idempotent) — used by the embedded database. */
async function ensureSchema(db: DrizzleDb) {
  const { readFileSync, existsSync, readdirSync } = await import("node:fs");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "drizzle");
  if (!existsSync(dir)) return;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const raw = readFileSync(path.join(dir, file), "utf8");
    for (const statement of raw.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      try {
        await db.execute(trimmed as never);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/already exists/i.test(message)) throw error;
      }
    }
  }
}

export async function getDb(): Promise<DrizzleDb> {
  if (globalForDb.__weddingDb) return globalForDb.__weddingDb;
  if (!globalForDb.__weddingDbReady) {
    globalForDb.__weddingDbReady = createDb().then((db) => {
      globalForDb.__weddingDb = db;
      return db;
    });
  }
  return globalForDb.__weddingDbReady;
}

export { schema };
