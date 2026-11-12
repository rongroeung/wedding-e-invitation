import { desc, eq } from "drizzle-orm";
import { GuestManager } from "@/components/admin/GuestManager";
import { getDb } from "@/lib/db";
import { guests, rsvps } from "@/lib/db/schema";
import { siteUrl } from "@/lib/site";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AdminGuestsPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  const db = await getDb();
  const [wedding, guestRows, rsvpRows] = await Promise.all([
    getWedding(weddingId),
    db.select().from(guests).where(eq(guests.weddingId, weddingId)).orderBy(desc(guests.createdAt)),
    db.select().from(rsvps).where(eq(rsvps.weddingId, weddingId)).orderBy(desc(rsvps.updatedAt)),
  ]);
  return (
    <GuestManager
      guests={guestRows}
      rsvps={rsvpRows}
      siteUrl={siteUrl()}
      caption={{
        template: wedding.shareCaption,
        couple: [wedding.groomName, wedding.brideName].filter(Boolean).join(" & "),
        date: wedding.weddingDateKhmer,
        venue: wedding.venueName,
      }}
    />
  );
}
