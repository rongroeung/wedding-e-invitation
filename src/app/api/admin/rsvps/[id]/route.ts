import { eq } from "drizzle-orm";
import { ok, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const { id } = await params;
  const db = await getDb();
  await db.delete(rsvps).where(eq(rsvps.id, id));
  return ok({ deleted: id });
}
