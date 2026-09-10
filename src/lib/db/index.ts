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
    const db = drizzle(pool, { schema }) as unknown as DrizzleDb;
    await ensureSchema(db, true);
    return db;
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

/**
 * Brings the database up to date on first use — **both** databases.
 *
 * The embedded one always did this. The real one did not, and that asymmetry
 * is a trap with a long fuse: everything works in development, the deploy
 * succeeds, and then one endpoint fails with a bare 500 because the code knows
 * about a column the database has never heard of. It cost a couple their film
 * upload on a live invitation, and the next schema change would have cost them
 * something else at a worse moment. `npm run db:migrate` still exists and is
 * still the right thing to run deliberately; this is what happens when nobody
 * remembers to.
 *
 * **The advisory lock is not optional on a serverless host.** A deploy wakes
 * several instances at once and each one arrives here with the same work to do;
 * without the lock they interleave their DDL and race the ledger. `pg_advisory_lock`
 * is held on the connection, so the losers wait and then find nothing left to
 * apply. The key is an arbitrary constant — it only has to be the same in every
 * instance of this app.
 *
 * The migrations themselves are written to be safe to run twice (`IF NOT
 * EXISTS`, and a ledger of what has been applied), so the worst case is a
 * wasted round trip.
 */
const MIGRATION_LOCK = 8_314_527;

async function ensureSchema(db: DrizzleDb, lock = false) {
  const { adoptExistingSchema, applyMigrations } = await import("./migrate");
  const runner = {
    exec: (sql: string) => db.execute(sql as never),
    rows: async (sql: string) => {
      const result = (await db.execute(sql as never)) as unknown as { rows?: { name: string }[] };
      return result?.rows ?? [];
    },
  };
  if (!lock) {
    await adoptExistingSchema(runner);
    await applyMigrations(runner);
    return;
  }
  await runner.exec(`SELECT pg_advisory_lock(${MIGRATION_LOCK})`);
  try {
    await adoptExistingSchema(runner);
    await applyMigrations(runner);
  } finally {
    await runner.exec(`SELECT pg_advisory_unlock(${MIGRATION_LOCK})`);
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
