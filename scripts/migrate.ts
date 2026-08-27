import "./load-env";
/**
 * Applies the generated SQL migrations to whichever database is configured.
 *   npm run db:migrate
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

async function main() {
  const dir = path.join(process.cwd(), "drizzle");
  if (!existsSync(dir)) {
    console.error("No ./drizzle folder — run `npm run db:generate` first.");
    process.exit(1);
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  const run = await connect();
  for (const file of files) {
    const raw = readFileSync(path.join(dir, file), "utf8");
    for (const statement of raw.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      try {
        await run(trimmed);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/already exists/i.test(message)) throw error;
      }
    }
    console.log(`✔ applied ${file}`);
  }
  console.log("Database schema is up to date.");
  process.exit(0);
}

async function connect(): Promise<(sql: string) => Promise<unknown>> {
  if (process.env.DATABASE_URL) {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: /sslmode=require|neon\.tech|supabase|vercel-storage/.test(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : undefined,
    });
    await client.connect();
    console.log("→ PostgreSQL");
    return (sql: string) => client.query(sql);
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dataDir = process.env.PGLITE_DIR || ".data/wedding";
  mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  console.log("→ embedded PGlite (./.data)");
  return (sql: string) => client.exec(sql);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
