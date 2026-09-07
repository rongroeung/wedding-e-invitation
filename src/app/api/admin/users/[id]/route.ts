import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, passwordRule } from "@/lib/passwords";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  /** Set by one admin for another; changing your own goes through /api/admin/password. */
  password: passwordRule.optional(),
});

type Params = { params: Promise<{ id: string }> };

/** Rename another administrator, or reset their password. */
export async function PUT(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);
  }

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
 * Remove an administrator.
 *
 * Two things are refused: deleting yourself, which would end your own session
 * mid-request, and deleting the last account, which would lock everyone out of
 * the dashboard with no way back in.
 */
export async function DELETE(request: Request, { params }: Params) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  if (id === session!.sub) return fail("មិនអាចលុបគណនីផ្ទាល់ខ្លួនបានទេ", 409);

  const db = await getDb();
  const all = await db.select({ id: users.id }).from(users);
  if (all.length <= 1) return fail("ត្រូវរក្សាទុកគណនីគ្រប់គ្រងយ៉ាងតិចមួយ", 409);
  if (!all.some((u) => u.id === id)) return fail("រកមិនឃើញអ្នកប្រើប្រាស់", 404);

  await db.delete(users).where(eq(users.id, id));
  return ok({ id });
}
