/** Read helpers used by the public invitation pages. */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  galleryImages,
  guests,
  pageViews,
  rsvps,
  storyItems,
  wedding,
  weddingEvents,
  type GalleryImage,
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
};

/**
 * A workspace's wedding row. The default workspace ("main", served at "/") is
 * created on first run; any other id that does not exist throws, since only
 * the owner creates workspaces (lib/workspace).
 */
export async function getWedding(weddingId = "main"): Promise<Wedding> {
  const db = await getDb();
  const rows = await db.select().from(wedding).where(eq(wedding.id, weddingId)).limit(1);
  if (rows.length > 0) return rows[0];
  if (weddingId !== "main") throw new Error(`workspace not found: ${weddingId}`);
  const [created] = await db
    .insert(wedding)
    .values({ id: "main", slug: "main" })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(wedding).where(eq(wedding.id, "main")).limit(1))[0];
}

/** The wedding at /w/<slug>, or null. */
export async function getWeddingBySlug(slug: string): Promise<Wedding | null> {
  if (!slug) return null;
  const db = await getDb();
  const rows = await db.select().from(wedding).where(eq(wedding.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getInvitationData(weddingId = "main"): Promise<InvitationData> {
  const db = await getDb();
  const [weddingRow, events, story, gallery] = await Promise.all([
    getWedding(weddingId),
    db.select().from(weddingEvents).where(eq(weddingEvents.weddingId, weddingId)).orderBy(asc(weddingEvents.sortOrder)),
    db.select().from(storyItems).where(eq(storyItems.weddingId, weddingId)).orderBy(asc(storyItems.sortOrder)),
    db.select().from(galleryImages).where(eq(galleryImages.weddingId, weddingId)).orderBy(asc(galleryImages.sortOrder)),
  ]);
  return { wedding: weddingRow, events, story, gallery };
}

/** A guest by their invitation code. Codes are unique across every workspace,
 *  so the guest row also says which wedding the link belongs to. */
export async function getGuestByCode(code: string): Promise<Guest | null> {
  if (!code) return null;
  const db = await getDb();
  const rows = await db.select().from(guests).where(eq(guests.code, code)).limit(1);
  return rows[0] ?? null;
}

/** Records an invitation view (guest counter + anonymous page-view log). */
export async function trackView(weddingId: string, path: string, guestCode = "") {
  const db = await getDb();
  await db.insert(pageViews).values({ weddingId, path, guestCode });
  if (guestCode) {
    await db
      .update(guests)
      .set({ views: sql`${guests.views} + 1`, lastViewedAt: new Date() })
      .where(and(eq(guests.code, guestCode), eq(guests.weddingId, weddingId)));
  }
}

/** The guest's most recent RSVP, used to show their status on the invitation. */
/**
 * The guest's most recent reply, or null if they have not answered yet.
 *
 * The invitation needs the whole row, not just the verdict: once a guest has
 * replied the RSVP section shows what they said rather than an empty form, so
 * it needs the seat count and the blessing back as well.
 */
export async function getGuestRsvp(code: string) {
  if (!code) return null;
  const db = await getDb();
  const rows = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.guestCode, code))
    .orderBy(desc(rsvps.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGuestRsvpStatus(code: string): Promise<"attending" | "declined" | "pending"> {
  const row = await getGuestRsvp(code);
  if (!row) return "pending";
  return row.attending ? "attending" : "declined";
}

export async function getDashboardStats(weddingId: string) {
  const db = await getDb();
  const [guestRows, rsvpRows, viewRows] = await Promise.all([
    db.select().from(guests).where(eq(guests.weddingId, weddingId)),
    db.select().from(rsvps).where(eq(rsvps.weddingId, weddingId)).orderBy(desc(rsvps.updatedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(pageViews).where(eq(pageViews.weddingId, weddingId)),
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
