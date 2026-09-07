import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordRule, verifyPassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordRule,
});

/**
 * Change your own password.
 *
 * The current password is required even though the session already proves who
 * you are — it is what stops a borrowed browser from locking the real owner
 * out of their own dashboard.
 */
export async function PUT(request: Request) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  const limit = rateLimit(clientKey(request, "password"), 8, 10 * 60 * 1000);
  if (!limit.ok) return fail("ការព្យាយាមច្រើនពេក សូមរង់ចាំបន្តិច", 429);

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return fail("ពាក្យសម្ងាត់ថ្មីត្រូវខុសពីពាក្យសម្ងាត់ចាស់", 422);
  }

  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, session!.sub)).limit(1);
  const user = rows[0];
  if (!user) return fail("រកមិនឃើញគណនី", 404);

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return fail("ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ", 401);

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, user.id));

  return ok({ id: user.id });
}
