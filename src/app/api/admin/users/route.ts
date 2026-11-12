import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { hashPassword, passwordRule } from "@/lib/passwords";
import { requireWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  name: z.string().trim().min(1).max(120).default("Admin"),
  password: passwordRule,
});

/**
 * The admins of the current workspace. Password hashes are never returned.
 * (The platform owner manages every workspace's admins from /admin/workspaces.)
 */
export async function GET(request: Request) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, isOwner: users.isOwner, createdAt: users.createdAt })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.weddingId, weddingId))
    .orderBy(asc(users.createdAt));
  return ok(rows);
}

/**
 * Add another administrator to the current workspace, with a new account.
 *
 * An email that already has an account is refused here — attaching an
 * existing account to a wedding is the owner's call (/admin/workspaces), so a
 * couple cannot pull someone else's login into their workspace by guessing
 * an address.
 */
export async function POST(request: Request) {
  const { ctx, weddingId, response } = await requireWorkspace(request);
  if (response) return response;

  const parsed = createSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);
  }

  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) {
    if (!ctx.isOwner) return fail("អ៊ីមែលនេះមានរួចហើយ", 409);
    const already = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.userId, existing.id), eq(workspaceMembers.weddingId, weddingId)))
      .limit(1);
    if (already.length) return fail("អ៊ីមែលនេះមានរួចហើយ", 409);
    await db.insert(workspaceMembers).values({ userId: existing.id, weddingId });
    const [row] = await db
      .select({ id: users.id, email: users.email, name: users.name, isOwner: users.isOwner, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, existing.id));
    return ok(row, { status: 201 });
  }

  const [row] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning({ id: users.id, email: users.email, name: users.name, isOwner: users.isOwner, createdAt: users.createdAt });
  await db.insert(workspaceMembers).values({ userId: row.id, weddingId });

  return ok(row, { status: 201 });
}
