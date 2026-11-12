import { cookies } from "next/headers";
import { z } from "zod";
import { fail, isSameOrigin, ok, readJson } from "@/lib/api";
import { WORKSPACE_COOKIE, canManage, getAdminContext, workspaceCookieOptions } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().min(1).max(80) });

/** Switch the dashboard to another workspace this admin may manage. */
export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return fail("Unauthorized", 401);
  if (!isSameOrigin(request)) return fail("Bad origin", 403);
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  if (!canManage(ctx, parsed.data.id)) return fail("Not found", 404);
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, parsed.data.id, workspaceCookieOptions);
  return ok({ id: parsed.data.id });
}
