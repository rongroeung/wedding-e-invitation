import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users, wedding, workspaceMembers } from "@/lib/db/schema";
import { hashPassword, passwordRule } from "@/lib/passwords";
import { requireOwner } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const addSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  name: z.string().trim().max(120).optional(),
  /** Needed only when the email has no account yet. */
  password: passwordRule.optional().or(z.literal("")),
});

/** Give a workspace an admin (owner only): an existing account, or a new one. */
export async function POST(request: Request, { params }: Params) {
  const { response } = await requireOwner(request);
  if (response) return response;
  const { id } = await params;
  const parsed = addSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);

  const db = await getDb();
  const [w] = await db.select({ id: wedding.id }).from(wedding).where(eq(wedding.id, id)).limit(1);
  if (!w) return fail("Not found", 404);

  let [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  let created = false;
  if (!user) {
    if (!parsed.data.password) return fail("សូមកំណត់ពាក្យសម្ងាត់សម្រាប់គណនីថ្មី", 422);
    [user] = await db
      .insert(users)
      .values({ email: parsed.data.email, name: parsed.data.name || "Admin", passwordHash: await hashPassword(parsed.data.password) })
      .returning({ id: users.id });
    created = true;
  }
  await db.insert(workspaceMembers).values({ userId: user.id, weddingId: id }).onConflictDoNothing();
  return ok({ userId: user.id, created }, { status: 201 });
}

/** Take an admin off a workspace (owner only). Their account stays. */
export async function DELETE(request: Request, { params }: Params) {
  const { response } = await requireOwner(request);
  if (response) return response;
  const { id } = await params;
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  const db = await getDb();
  const gone = await db
    .delete(workspaceMembers)
    .where(and(eq(workspaceMembers.weddingId, id), eq(workspaceMembers.userId, userId)))
    .returning({ userId: workspaceMembers.userId });
  if (!gone.length) return fail("Not found", 404);
  return ok({ removed: userId });
}
