import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { galleryImages, media } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  url: z.string().max(600).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  const { id } = await params;
  const db = await getDb();
  const [row] = await db.update(galleryImages).set(parsed.data).where(eq(galleryImages.id, id)).returning();
  if (!row) return fail("Not found", 404);
  return ok(row);
}

export async function DELETE(request: Request, { params }: Params) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const { id } = await params;
  const db = await getDb();
  const [row] = await db.delete(galleryImages).where(eq(galleryImages.id, id)).returning();
  // Remove the orphaned binary as well so the database does not grow forever.
  if (row?.mediaId) await db.delete(media).where(eq(media.id, row.mediaId));
  return ok({ deleted: id });
}
