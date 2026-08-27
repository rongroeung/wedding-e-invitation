/** Read helpers used by the public invitation pages. */
import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  galleryImages,
  giftAccounts,
  guests,
  pageViews,
  rsvps,
  storyItems,
  wedding,
  weddingEvents,
  type GalleryImage,
  type GiftAccount,
  type Guest,
  type StoryItem,
  type Wedding,
  type WeddingEvent,
} from "./db/schema";

export type InvitationData = {
  wedding: Wedding;
  events: WeddingEvent[];
  story: StoryItem[];
  gallery: GalleryImage[];
  gifts: GiftAccount[];
};

/** Returns the wedding row, creating the default one on first run. */
export async function getWedding(): Promise<Wedding> {
  const db = await getDb();
  const rows = await db.select().from(wedding).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(wedding).values({ id: "main" }).returning();
  return created;
}

export async function getInvitationData(): Promise<InvitationData> {
  const db = await getDb();
  const [weddingRow, events, story, gallery, gifts] = await Promise.all([
    getWedding(),
    db.select().from(weddingEvents).orderBy(asc(weddingEvents.sortOrder)),
    db.select().from(storyItems).orderBy(asc(storyItems.sortOrder)),
    db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder)),
    db.select().from(giftAccounts).orderBy(asc(giftAccounts.sortOrder)),
  ]);
  return { wedding: weddingRow, events, story, gallery, gifts };
}

export async function getGuestByCode(code: string): Promise<Guest | null> {
  if (!code) return null;
  const db = await getDb();
  const rows = await db.select().from(guests).where(eq(guests.code, code)).limit(1);
  return rows[0] ?? null;
}

/** Records an invitation view (guest counter + anonymous page-view log). */
export async function trackView(path: string, guestCode = "") {
  const db = await getDb();
  await db.insert(pageViews).values({ path, guestCode });
  if (guestCode) {
    await db
      .update(guests)
      .set({ views: sql`${guests.views} + 1`, lastViewedAt: new Date() })
      .where(eq(guests.code, guestCode));
  }
}

/** The guest's most recent RSVP, used to show their status on the invitation. */
export async function getGuestRsvpStatus(code: string): Promise<"attending" | "declined" | "pending"> {
  if (!code) return "pending";
  const db = await getDb();
  const rows = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.guestCode, code))
    .orderBy(desc(rsvps.createdAt))
    .limit(1);
  if (rows.length === 0) return "pending";
  return rows[0].attending ? "attending" : "declined";
}

export async function getDashboardStats() {
  const db = await getDb();
  const [guestRows, rsvpRows, viewRows] = await Promise.all([
    db.select().from(guests),
    db.select().from(rsvps).orderBy(desc(rsvps.createdAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(pageViews),
  ]);

  const attending = rsvpRows.filter((r) => r.attending);
  const declined = rsvpRows.filter((r) => !r.attending);
  const respondedCodes = new Set(rsvpRows.map((r) => r.guestCode).filter(Boolean));

  return {
    totalGuests: guestRows.length,
    totalViews: Number(viewRows[0]?.count ?? 0),
    guestViews: guestRows.reduce((sum, g) => sum + g.views, 0),
    confirmed: attending.length,
    declined: declined.length,
    pending: guestRows.filter((g) => !respondedCodes.has(g.code)).length,
    expectedAttendees: attending.reduce((sum, r) => sum + r.guestCount, 0),
    recentRsvps: rsvpRows.slice(0, 8),
  };
}
