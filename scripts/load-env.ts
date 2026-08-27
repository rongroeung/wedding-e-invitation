/** Minimal .env loader so the CLI scripts see the same variables as Next.js. */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  const full = path.join(process.cwd(), file);
  if (!existsSync(full)) continue;
  for (const line of readFileSync(full, "utf8").split("\n")) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = (match[2] ?? "").trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    process.env[key] = value;
  }
}
