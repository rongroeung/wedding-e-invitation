import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Applies the generated SQL migrations exactly once each.
 *
 * An earlier version simply replayed every file and swallowed "already exists"
 * errors. That works until a migration drops a column — replaying it then fails
 * with "does not exist", which is not the same error and is not safe to ignore
 * in general. So the applied filenames are recorded in a ledger table instead,
 * which is what a migration runner should do.
 */
export type SqlRunner = {
  exec: (sql: string) => Promise<unknown>;
  rows: (sql: string) => Promise<{ name: string }[]>;
};

const LEDGER = "__wedding_migrations";

export async function applyMigrations(runner: SqlRunner, log: (message: string) => void = () => {}) {
  const dir = path.join(process.cwd(), "drizzle");
  if (!existsSync(dir)) return;

  await runner.exec(
    `CREATE TABLE IF NOT EXISTS "${LEDGER}" (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );

  const applied = new Set((await runner.rows(`SELECT name FROM "${LEDGER}"`)).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const raw = readFileSync(path.join(dir, file), "utf8");
    for (const statement of raw.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      await runner.exec(trimmed);
    }

    await runner.exec(`INSERT INTO "${LEDGER}" (name) VALUES ('${file.replace(/'/g, "''")}')`);
    log(`✔ applied ${file}`);
  }
}

/**
 * Adopts a database that already carries the schema but predates the ledger, so
 * upgrading an existing deployment does not try to re-run migration 0000.
 */
export async function adoptExistingSchema(runner: SqlRunner) {
  const dir = path.join(process.cwd(), "drizzle");
  if (!existsSync(dir)) return;

  const tables = await runner.rows(
    `SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'wedding'`,
  );
  if (tables.length === 0) return; // fresh database: nothing to adopt

  const ledger = await runner.rows(
    `SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '${LEDGER}'`,
  );
  if (ledger.length > 0) return; // already tracked

  await runner.exec(
    `CREATE TABLE IF NOT EXISTS "${LEDGER}" (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
  const first = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()[0];
  if (first) {
    await runner.exec(`INSERT INTO "${LEDGER}" (name) VALUES ('${first.replace(/'/g, "''")}')`);
  }
}
