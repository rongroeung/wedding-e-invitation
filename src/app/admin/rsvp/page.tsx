import { desc, eq } from "drizzle-orm";
import { RsvpTable } from "@/components/admin/RsvpTable";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";
import { pageWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AdminRsvpPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  const db = await getDb();
  const rows = await db.select().from(rsvps).where(eq(rsvps.weddingId, weddingId)).orderBy(desc(rsvps.updatedAt));
  return <RsvpTable rsvps={rows} />;
}
