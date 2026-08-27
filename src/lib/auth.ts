/** Admin authentication — bcrypt password hashing + signed JWT session cookie. */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "wedding_admin_session";
const ALG = "HS256";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set to a long random string in production.");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-please-change");
  }
  return new TextEncoder().encode(value);
}

export type SessionPayload = { sub: string; email: string; name: string };

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? "Admin"),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
