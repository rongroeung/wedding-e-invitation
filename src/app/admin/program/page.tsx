import { asc } from "drizzle-orm";
import { ProgramManager } from "@/components/admin/ProgramManager";
import { getDb } from "@/lib/db";
import { storyItems, weddingEvents } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminProgramPage() {
  const db = await getDb();
  const [events, story] = await Promise.all([
    db.select().from(weddingEvents).orderBy(asc(weddingEvents.sortOrder)),
    db.select().from(storyItems).orderBy(asc(storyItems.sortOrder)),
  ]);
  return <ProgramManager events={events} story={story} />;
}
