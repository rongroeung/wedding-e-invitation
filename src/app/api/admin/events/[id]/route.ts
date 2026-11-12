import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { weddingEvents } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  groupName: z.string().max(80).optional(),
  groupIcon: z.string().max(8).optional(),
  timeLabel: z.string().max(80).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  icon: z.string().max(8).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  const { id } = await params;
  const db = await getDb();
  const [row] = await db
    .update(weddingEvents)
    .set(parsed.data)
    .where(and(eq(weddingEvents.id, id), eq(weddingEvents.weddingId, weddingId)))
    .returning();
  if (!row) return fail("Not found", 404);
  return ok(row);
}

export async function DELETE(request: Request, { params }: Params) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const { id } = await params;
  const db = await getDb();
  await db.delete(weddingEvents).where(and(eq(weddingEvents.id, id), eq(weddingEvents.weddingId, weddingId)));
  return ok({ deleted: id });
}
