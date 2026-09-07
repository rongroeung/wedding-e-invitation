/** Shared helpers for the REST API routes. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Returns the signed-in admin, or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guards a mutating admin endpoint: valid session + same-origin request
 * (a lightweight CSRF defence on top of the SameSite=Lax session cookie).
 */
export async function requireAdmin(request: Request) {
  const session = await getSession();
  if (!session) return { session: null, response: fail("Unauthorized", 401) };
  if (!isSameOrigin(request)) return { session: null, response: fail("Bad origin", 403) };
  return { session, response: null };
}

export function isSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return true;
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client (curl, native app)
  try {
    const host = request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB
export const MAX_AUDIO_BYTES = 12 * 1024 * 1024; // 12 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];
export const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/aac", "audio/mp4"];

/**
 * A pre-wedding film, uploaded rather than linked.
 *
 * 64 MB, and the number is a compromise rather than a preference. The file is
 * read into memory as a `Buffer`, stored as one `bytea` row, and read back
 * whole on every range request — so this is the largest video the app can serve
 * without a real object store behind it. A wedding film is usually far bigger
 * than that, which is why the dashboard offers a *link* first and treats the
 * upload as the fallback for a short, already-compressed cut.
 */
export const MAX_VIDEO_BYTES = 64 * 1024 * 1024; // 64 MB
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Random, URL-safe invitation code. */
export function randomCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Turns a name into a URL slug, keeping Khmer characters intact. */
export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 60);
}
