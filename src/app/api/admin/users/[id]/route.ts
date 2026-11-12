import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { hashPassword, passwordRule } from "@/lib/passwords";
import { canAdminister, requireWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  /** Set by one admin for another; changing your own goes through /api/admin/password. */
  password: passwordRule.optional(),
});

type Params = { params: Promise<{ id: string }> };

/**
 * Rename another administrator, or reset their password.
 *
 * Only for an account that belongs to this workspace and to nothing this
 * admin cannot manage: a couple can look after their own co-admin, but not
 * reset the password of someone who also runs another wedding, nor the
 * owner's.
 */
export async function PUT(request: Request, { params }: Params) {
  const { ctx, weddingId, response } = await requireWorkspace(request);
  if (response) return response;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);
  }
  if (!(await canAdminister(ctx, weddingId, id))) return fail("រកមិនឃើញអ្នកប្រើប្រាស់", 404);

  const patch: Record<string, string> = {};
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.password) {
    patch.passwordHash = await hashPassword(parsed.data.password);
  }
  if (Object.keys(patch).length === 0) return fail("គ្មានអ្វីត្រូវកែ", 422);

  const db = await getDb();
  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email, name: users.name });
  if (!row) return fail("រកមិនឃើញអ្នកប្រើប្រាស់", 404);

  return ok(row);
}

/**
 * Remove an administrator from this workspace.
 *
 * Their account goes too once it manages nothing at all (and is not the
 * owner's). Refused: removing yourself, which would end your own access
 * mid-request, and removing a workspace's last admin unless you are the owner
 * (who can always get back in).
 */
export async function DELETE(request: Request, { params }: Params) {
  const { ctx, weddingId, response } = await requireWorkspace(request);
  if (response) return response;

  const { id } = await params;
  if (id === ctx.userId) return fail("មិនអាចលុបគណនីផ្ទាល់ខ្លួនបានទេ", 409);

  const db = await getDb();
  const members = await db.select({ userId: workspaceMembers.userId }).from(workspaceMembers).where(eq(workspaceMembers.weddingId, weddingId));
  if (!members.some((m) => m.userId === id)) return fail("រកមិនឃើញអ្នកប្រើប្រាស់", 404);
  if (!ctx.isOwner && members.length <= 1) return fail("ត្រូវរក្សាទុកគណនីគ្រប់គ្រងយ៉ាងតិចមួយ", 409);

  const [target] = await db.select({ isOwner: users.isOwner }).from(users).where(eq(users.id, id)).limit(1);
  if (target?.isOwner && !ctx.isOwner) return fail("រកមិនឃើញអ្នកប្រើប្រាស់", 404);

  await db.delete(workspaceMembers).where(and(eq(workspaceMembers.userId, id), eq(workspaceMembers.weddingId, weddingId)));
  const left = await db.select({ w: workspaceMembers.weddingId }).from(workspaceMembers).where(eq(workspaceMembers.userId, id)).limit(1);
  if (!left.length && !target?.isOwner) await db.delete(users).where(eq(users.id, id));
  return ok({ id });
}
