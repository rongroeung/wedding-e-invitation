import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, isSameOrigin, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
});

/** Admin sign-in. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Bad origin", 403);

  const limit = rateLimit(clientKey(request, "login"), 8, 10 * 60 * 1000);
  if (!limit.ok) return fail("ការព្យាយាមច្រើនពេក សូមរង់ចាំបន្តិច", 429);

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ", 422);

  const db = await getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);
  const user = rows[0];

  // Always run a hash comparison so timing does not reveal whether the
  // account exists.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!user || !valid) return fail("អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ", 401);

  const token = await createSessionToken({ sub: user.id, email: user.email, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);

  return ok({ email: user.email, name: user.name });
}
