import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { giftAccounts, media } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  bankName: z.string().trim().min(1).max(120).optional(),
  accountName: z.string().trim().min(1).max(160).optional(),
  accountNumber: z.string().trim().min(1).max(80).optional(),
  note: z.string().max(200).optional(),
  qrMediaId: z.string().max(80).nullable().optional(),
  qrUrl: z.string().max(600).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  const { id } = await params;
  const db = await getDb();
  const [row] = await db.update(giftAccounts).set(parsed.data).where(eq(giftAccounts.id, id)).returning();
  if (!row) return fail("Not found", 404);
  return ok(row);
}

export async function DELETE(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const { id } = await params;
  const db = await getDb();
  const [row] = await db.delete(giftAccounts).where(eq(giftAccounts.id, id)).returning();
  if (row?.qrMediaId) await db.delete(media).where(eq(media.id, row.qrMediaId));
  return ok({ deleted: id });
}
