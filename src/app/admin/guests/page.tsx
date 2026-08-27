import { desc } from "drizzle-orm";
import { GuestManager } from "@/components/admin/GuestManager";
import { getDb } from "@/lib/db";
import { guests, rsvps } from "@/lib/db/schema";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminGuestsPage() {
  const db = await getDb();
  const [guestRows, rsvpRows] = await Promise.all([
    db.select().from(guests).orderBy(desc(guests.createdAt)),
    db.select().from(rsvps).orderBy(desc(rsvps.createdAt)),
  ]);
  return <GuestManager guests={guestRows} rsvps={rsvpRows} siteUrl={siteUrl()} />;
}
