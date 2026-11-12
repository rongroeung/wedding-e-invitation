import { and, eq } from "drizzle-orm";
import { ok } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const { id } = await params;
  const db = await getDb();
  await db.delete(rsvps).where(and(eq(rsvps.id, id), eq(rsvps.weddingId, weddingId)));
  return ok({ deleted: id });
}
