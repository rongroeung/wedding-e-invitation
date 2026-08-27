import { desc } from "drizzle-orm";
import { RsvpTable } from "@/components/admin/RsvpTable";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminRsvpPage() {
  const db = await getDb();
  const rows = await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));
  return <RsvpTable rsvps={rows} />;
}
