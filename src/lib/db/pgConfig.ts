import type { ConnectionOptions } from "node:tls";

/**
 * The connection string and TLS settings for node-postgres, from DATABASE_URL.
 *
 * The `sslmode` in the URL is read here and taken out of it, and the TLS
 * settings are passed to `pg` explicitly instead:
 *
 *   • pg 8 treats `sslmode=require` (and `prefer`, `verify-ca`) as
 *     `verify-full` — the certificate is fully verified — but warns on every
 *     cold start that pg 9 will weaken them to libpq's meaning. Deciding here
 *     keeps today's (secure) behaviour and ends the warning, whatever the
 *     provider's dashboard put in the URL.
 *   • A `sslmode` left in the URL also overrides any `ssl` option passed
 *     alongside it, so the URL and the code could quietly disagree. Now there
 *     is one source of truth.
 *
 * Hosted providers (Neon, Supabase, Vercel Postgres) always get TLS with the
 * certificate verified, even if the URL says nothing. `sslmode=disable` (a
 * local database) turns TLS off. The server's certificate must chain to a
 * trusted CA; for a provider with its own CA, put it in the
 * `NODE_EXTRA_CA_CERTS` file rather than turning verification off.
 */
export function pgConnection(url: string): { connectionString: string; ssl: boolean | ConnectionOptions | undefined } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // not a URL (e.g. a key=value string): leave it to pg as it is
    return { connectionString: url, ssl: undefined };
  }
  const mode = parsed.searchParams.get("sslmode")?.toLowerCase() ?? null;
  parsed.searchParams.delete("sslmode");
  // only meaningful alongside sslmode; pg would otherwise warn about it too
  parsed.searchParams.delete("uselibpqcompat");

  const hosted = /neon\.tech|supabase\.(co|com)|vercel-storage\.com|pooler\.supabase/.test(parsed.hostname);
  let ssl: boolean | ConnectionOptions | undefined;
  if (mode === "disable") ssl = false;
  else if (mode === "no-verify") ssl = { rejectUnauthorized: false };
  else if (mode || hosted) ssl = { rejectUnauthorized: true };
  else ssl = undefined;

  return { connectionString: parsed.toString(), ssl };
}
