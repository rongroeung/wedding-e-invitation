import { desc, eq } from "drizzle-orm";
import { ok } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(rsvps).where(eq(rsvps.weddingId, weddingId)).orderBy(desc(rsvps.updatedAt)));
}
