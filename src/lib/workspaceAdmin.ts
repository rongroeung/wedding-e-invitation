import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { guests, users, wedding, workspaceMembers } from "./db/schema";
import { workspaceLabel } from "./workspace";

export type WorkspaceRow = Awaited<ReturnType<typeof listWorkspaces>>[number];

/** Every workspace, with its admins and a guest count, for the owner's page. */
export async function listWorkspaces() {
  const db = await getDb();
  const rows = await db
    .select({ id: wedding.id, slug: wedding.slug, workspaceName: wedding.workspaceName, groomName: wedding.groomName, brideName: wedding.brideName, createdAt: wedding.createdAt })
    .from(wedding)
    .orderBy(asc(wedding.createdAt), asc(wedding.slug));
  const members = await db
    .select({ weddingId: workspaceMembers.weddingId, id: users.id, email: users.email, name: users.name, isOwner: users.isOwner })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .orderBy(asc(users.email));
  const counts = await db
    .select({ weddingId: guests.weddingId, n: sql<number>`count(*)::int` })
    .from(guests)
    .groupBy(guests.weddingId);
  return rows.map((w) => ({
    id: w.id,
    slug: w.slug,
    name: w.workspaceName,
    label: workspaceLabel(w),
    createdAt: w.createdAt,
    guests: Number(counts.find((c) => c.weddingId === w.id)?.n ?? 0),
    admins: members.filter((m) => m.weddingId === w.id).map(({ weddingId: _w, ...m }) => m),
  }));
}

