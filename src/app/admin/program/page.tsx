import { asc, eq } from "drizzle-orm";
import { ProgramManager } from "@/components/admin/ProgramManager";
import { getDb } from "@/lib/db";
import { storyItems, weddingEvents } from "@/lib/db/schema";
import { pageWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AdminProgramPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  const db = await getDb();
  const [events, story] = await Promise.all([
    db.select().from(weddingEvents).where(eq(weddingEvents.weddingId, weddingId)).orderBy(asc(weddingEvents.sortOrder)),
    db.select().from(storyItems).where(eq(storyItems.weddingId, weddingId)).orderBy(asc(storyItems.sortOrder)),
  ]);
  return <ProgramManager events={events} story={story} />;
}
