import { desc } from "drizzle-orm";
import { ok, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(rsvps).orderBy(desc(rsvps.createdAt)));
}
