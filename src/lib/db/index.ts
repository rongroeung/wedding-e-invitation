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
    const { pgConnection } = await import("./pgConfig");
    /*
     * Every wait has an end. Without these a request could wait for ever —
     * for a free connection, or on a connection the host had quietly cut while
     * the function was frozen between requests — until Vercel killed it at
     * 300 seconds ("Task timed out after 300 seconds"), with every picture on
     * the page waiting behind it. Now a stuck wait fails in seconds and the
     * next request gets a fresh connection.
     */
    const pool = new Pool({
      ...pgConnection(process.env.DATABASE_URL),
      max: 8,
      connectionTimeoutMillis: 10_000, // waiting for a connection
      idleTimeoutMillis: 10_000, // let idle connections go before the host drops them
      keepAlive: true, // notice a dead socket instead of waiting on it
      query_timeout: 30_000, // the client gives up on a query
      statement_timeout: 30_000, // and so does the server
    });
    // a connection that dies while idle is dropped from the pool, not fatal
    pool.on("error", (err) => console.error("[db] idle connection error:", err.message));
    try {
      // on Vercel's Fluid compute: close idle connections before the instance
      // is suspended, so none is reused dead when it wakes
      const { attachDatabasePool } = await import("@vercel/functions");
      attachDatabasePool(pool);
    } catch {
      /* not on Vercel */
    }
    const db = drizzle(pool, { schema }) as unknown as DrizzleDb;
    await ensureSchemaOnServer(pool);
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

/** The embedded database: one process, nothing to race. */
async function ensureSchema(db: DrizzleDb) {
  const { adoptExistingSchema, applyMigrations } = await import("./migrate");
  const runner = {
    exec: (sql: string) => db.execute(sql as never),
    rows: async (sql: string) => {
      const result = (await db.execute(sql as never)) as unknown as { rows?: { name: string }[] };
      return result?.rows ?? [];
    },
  };
  await adoptExistingSchema(runner);
  await applyMigrations(runner);
}

/**
 * The real database, on a serverless host.
 *
 * **Most cold starts have nothing to do**, so the first step is a plain read of
 * the ledger: when every migration in the folder is already recorded, no lock
 * is taken at all.
 *
 * When there is work, it runs in ONE transaction on ONE connection, under a
 * *transaction-scoped* advisory lock (`pg_advisory_xact_lock`) with a time
 * limit. The old session lock (`pg_advisory_lock` … `pg_advisory_unlock`) was
 * the dangerous part: behind a connection pooler (Neon's and Supabase's
 * "pooled" URLs) the lock and the unlock can land on different server
 * connections, so the unlock frees nothing and the lock is held by a pooled
 * connection for good. Every instance that started after that waited on it
 * for ever, along with every request it was serving — the 300-second
 * timeouts. A transaction lock is released by the commit or rollback itself,
 * on the same connection, whatever sits in between; and `lock_timeout` turns a
 * wait that cannot end into an error after 20 seconds.
 */
async function ensureSchemaOnServer(pool: import("pg").Pool) {
  const { adoptExistingSchema, applyMigrations, migrationFiles } = await import("./migrate");
  const files = migrationFiles();
  if (files.length === 0) return;

  const recorded = await pool
    .query<{ name: string }>(`SELECT name FROM "__wedding_migrations"`)
    .then((r) => new Set(r.rows.map((row) => row.name)))
    .catch(() => null); // no ledger yet
  if (recorded && files.every((f) => recorded.has(f))) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '20s'");
    await client.query("SET LOCAL statement_timeout = '120s'");
    await client.query(`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK})`);
    const runner = {
      exec: (sql: string) => client.query(sql),
      rows: async (sql: string) => (await client.query<{ name: string }>(sql)).rows,
    };
    await adoptExistingSchema(runner);
    await applyMigrations(runner);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function getDb(): Promise<DrizzleDb> {
  if (globalForDb.__weddingDb) return globalForDb.__weddingDb;
  if (!globalForDb.__weddingDbReady) {
    globalForDb.__weddingDbReady = createDb().then(
      (db) => {
        globalForDb.__weddingDb = db;
        return db;
      },
      (err) => {
        // a failed start is not remembered: the next request tries again
        globalForDb.__weddingDbReady = undefined;
        throw err;
      },
    );
  }
  return globalForDb.__weddingDbReady;
}

export { schema };
