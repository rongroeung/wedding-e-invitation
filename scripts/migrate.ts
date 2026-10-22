import "./load-env";
/**
 * Applies the generated SQL migrations to whichever database is configured.
 *   npm run db:migrate
 */
import { adoptExistingSchema, applyMigrations, type SqlRunner } from "../src/lib/db/migrate";

async function main() {
  const runner = await connect();
  await adoptExistingSchema(runner);
  await applyMigrations(runner, (message) => console.log(message));
  console.log("Database schema is up to date.");
  process.exit(0);
}

async function connect(): Promise<SqlRunner> {
  if (process.env.DATABASE_URL) {
    const { Client } = await import("pg");
    const { pgConnection } = await import("../src/lib/db/pgConfig");
    const client = new Client(pgConnection(process.env.DATABASE_URL));
    await client.connect();
    console.log("→ PostgreSQL");
    return {
      exec: (sql: string) => client.query(sql),
      rows: async (sql: string) => (await client.query(sql)).rows,
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dataDir = process.env.PGLITE_DIR || ".data/wedding";
  mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  console.log("→ embedded PGlite (./.data)");
  return {
    exec: (sql: string) => client.exec(sql),
    rows: async (sql: string) => (await client.query(sql)).rows as { name: string }[],
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
