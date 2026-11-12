import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return ok({ loggedOut: true });
}

/**
 * Sign-out by link, for a session whose account no longer exists (deleted,
 * or the database was reset or swapped). The cookie still verifies, so the
 * middleware lets it through and the login page would bounce it straight back
 * to the dashboard. Clearing it here breaks that loop. `next` must be a path
 * inside the dashboard.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "";
  const target = /^\/admin(\/[\w-]*)*$/.test(next) ? next : "/admin/login";
  const response = NextResponse.redirect(new URL(target, url.origin));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
