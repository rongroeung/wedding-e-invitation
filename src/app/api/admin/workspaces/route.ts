import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users, wedding, workspaceMembers } from "@/lib/db/schema";
import { hashPassword, passwordRule } from "@/lib/passwords";
import { WORKSPACE_COOKIE, normaliseSlug, requireOwner, workspaceCookieOptions } from "@/lib/workspace";
import { listWorkspaces } from "@/lib/workspaceAdmin";

export const dynamic = "force-dynamic";

/** Every workspace, with its admins and a guest count (owner only). */
export async function GET(request: Request) {
  const { response } = await requireOwner(request);
  if (response) return response;
  return ok(await listWorkspaces());
}

const createSchema = z.object({
  slug: z.string().min(1).max(60),
  name: z.string().trim().max(120).default(""),
  /** Optional first admin: an existing account (email only) or a new one. */
  adminEmail: z.string().trim().toLowerCase().email().max(160).optional().or(z.literal("")),
  adminName: z.string().trim().max(120).optional(),
  adminPassword: passwordRule.optional().or(z.literal("")),
});

/**
 * Create a workspace (owner only), optionally with its first admin.
 *
 * A new wedding starts with the app's own wording and design, and with the
 * couple's and parents' names left empty: they are the couple's to fill in,
 * and the first wedding's names must not appear on someone else's invitation.
 */
export async function POST(request: Request) {
  const { response } = await requireOwner(request);
  if (response) return response;
  const parsed = createSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ", 422);
  const slug = normaliseSlug(parsed.data.slug);
  if (!slug) return fail("អាសយដ្ឋានត្រូវមានអក្សរឡាតាំង លេខ ឬ - (២ ដល់ ៤៨ តួ)", 422);

  const db = await getDb();
  const clash = await db.select({ id: wedding.id }).from(wedding).where(eq(wedding.slug, slug)).limit(1);
  if (clash.length) return fail("អាសយដ្ឋាននេះមានរួចហើយ", 409);

  const { adminEmail, adminName, adminPassword } = parsed.data;
  let adminId: string | null = null;
  if (adminEmail) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
    if (existing) adminId = existing.id;
    else if (!adminPassword) return fail("សូមកំណត់ពាក្យសម្ងាត់សម្រាប់គណនីថ្មី", 422);
  }

  const id = crypto.randomUUID();
  const [row] = await db
    .insert(wedding)
    .values({
      id,
      slug,
      workspaceName: parsed.data.name,
      groomName: "",
      groomFullName: "",
      groomFatherName: "",
      groomMotherName: "",
      brideName: "",
      brideFullName: "",
      brideFatherName: "",
      brideMotherName: "",
    })
    .returning({ id: wedding.id, slug: wedding.slug });

  if (adminEmail && !adminId) {
    const [created] = await db
      .insert(users)
      .values({ email: adminEmail, name: adminName || "Admin", passwordHash: await hashPassword(adminPassword!) })
      .returning({ id: users.id });
    adminId = created.id;
  }
  if (adminId) await db.insert(workspaceMembers).values({ userId: adminId, weddingId: id }).onConflictDoNothing();

  // the owner goes straight to the new workspace
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, id, workspaceCookieOptions);
  return ok(row, { status: 201 });
}
