import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, randomCode, readJson, requireAdmin, slugify } from "@/lib/api";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().max(40).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  nameLatin: z.string().max(160).optional(),
  allowedSeats: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(400).optional(),
  code: z.string().max(80).optional(),
  /** Issues a brand-new random invitation code, invalidating the old link. */
  regenerateCode: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  const { id } = await params;

  const db = await getDb();
  const { regenerateCode, ...values } = parsed.data;

  if (regenerateCode) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = randomCode(8 + Math.floor(attempt / 3));
      const clash = await db.select().from(guests).where(eq(guests.code, candidate)).limit(1);
      if (clash.length === 0) {
        values.code = candidate;
        break;
      }
    }
  } else if (values.code) {
    values.code = slugify(values.code);
    const clash = await db.select().from(guests).where(eq(guests.code, values.code)).limit(1);
    if (clash[0] && clash[0].id !== id) return fail("លេខកូដនេះមានរួចហើយ", 409);
  }

  const [row] = await db.update(guests).set(values).where(eq(guests.id, id)).returning();
  if (!row) return fail("Not found", 404);
  return ok(row);
}

export async function DELETE(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const { id } = await params;
  const db = await getDb();
  await db.delete(guests).where(eq(guests.id, id));
  return ok({ deleted: id });
}
