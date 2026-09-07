import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, passwordRule } from "@/lib/passwords";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  name: z.string().trim().min(1).max(120).default("Admin"),
  password: passwordRule,
});

/** The admin roster. Password hashes are never returned. */
export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
  return ok(rows);
}

/** Add another administrator. */
export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const parsed = createSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);
  }

  const db = await getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing.length > 0) return fail("អ៊ីមែលនេះមានរួចហើយ", 409);

  const [row] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt });

  return ok(row, { status: 201 });
}
