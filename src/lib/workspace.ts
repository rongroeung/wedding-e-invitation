/**
 * Workspaces — one per wedding.
 *
 * Each wedding row is a workspace: its own details, programme, gallery,
 * guests, replies and uploads, all filed under its id (`wedding_id`). The
 * first one, "main", is the wedding that existed before workspaces, and it
 * still answers at "/". Every other one answers at /w/<slug>. Guest links stay
 * /invite/<code>: codes are unique across all workspaces, so the code alone
 * says which wedding a guest belongs to.
 *
 * Who may manage what:
 *   • the platform owner (`users.is_owner`) sees every workspace, creates
 *     them, and decides who administers each;
 *   • any other admin manages only the workspaces they are a member of
 *     (`workspace_members`), and switches between them if there are several.
 *
 * The workspace being managed is remembered in a cookie, and that cookie is
 * only ever a preference: every request checks it against the signed-in
 * admin's memberships, so changing it by hand reaches nothing new.
 */
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { fail, getSession, isSameOrigin } from "./api";
import type { SessionPayload } from "./auth";
import { getDb } from "./db";
import { media, users, wedding, workspaceMembers } from "./db/schema";

export const WORKSPACE_COOKIE = "wedding_workspace";
export const DEFAULT_WORKSPACE = "main";

export const workspaceCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export type WorkspaceSummary = { id: string; slug: string; name: string; label: string };

export type AdminContext = {
  session: SessionPayload;
  userId: string;
  isOwner: boolean;
  /** The workspace being managed; null when this admin has none yet. */
  weddingId: string | null;
  workspace: WorkspaceSummary | null;
  /** Every workspace this admin can manage (all of them, for the owner). */
  workspaces: WorkspaceSummary[];
};

/** A workspace's name for the dashboard: its own, else the couple's, else its address. */
export function workspaceLabel(w: { slug: string; workspaceName: string; groomName?: string; brideName?: string }) {
  if (w.workspaceName.trim()) return w.workspaceName.trim();
  const couple = [w.groomName, w.brideName].filter((v) => v && v.trim()).join(" & ");
  return couple || w.slug;
}

function summary(w: { id: string; slug: string; workspaceName: string; groomName: string; brideName: string }): WorkspaceSummary {
  return { id: w.id, slug: w.slug, name: w.workspaceName, label: workspaceLabel(w) };
}

export { workspacePath } from "./workspacePath";

/** Slugs a workspace may not take: they would shadow app routes or read as one. */
const RESERVED = new Set(["admin", "api", "invite", "w", "new", "login", "logout", "static", "_next"]);

/** Normalises a requested slug: lowercase latin letters, digits and dashes, 2–48 long. */
export function normaliseSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length < 2 || slug.length > 48 || RESERVED.has(slug)) return null;
  return slug;
}

/**
 * The signed-in admin, what they may manage, and which workspace they are in.
 * Null when there is no valid session (or the account no longer exists).
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await getSession();
  if (!session) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id, isOwner: users.isOwner }).from(users).where(eq(users.id, session.sub)).limit(1);
  if (!user) return null;

  const cols = { id: wedding.id, slug: wedding.slug, workspaceName: wedding.workspaceName, groomName: wedding.groomName, brideName: wedding.brideName };
  const rows = user.isOwner
    ? await db.select(cols).from(wedding).orderBy(asc(wedding.createdAt), asc(wedding.slug))
    : await db
        .select(cols)
        .from(workspaceMembers)
        .innerJoin(wedding, eq(wedding.id, workspaceMembers.weddingId))
        .where(eq(workspaceMembers.userId, user.id))
        .orderBy(asc(wedding.createdAt), asc(wedding.slug));
  const workspaces = rows.map(summary);

  const store = await cookies();
  const wanted = store.get(WORKSPACE_COOKIE)?.value;
  const active =
    workspaces.find((w) => w.id === wanted) ??
    workspaces.find((w) => w.id === DEFAULT_WORKSPACE) ??
    workspaces[0] ??
    null;

  return { session, userId: user.id, isOwner: user.isOwner, weddingId: active?.id ?? null, workspace: active, workspaces };
}

/** Whether this admin may manage the given workspace. */
export function canManage(ctx: AdminContext, weddingId: string) {
  return ctx.workspaces.some((w) => w.id === weddingId);
}

/**
 * Guards an admin API route that works on the current workspace: a valid
 * session, a same-origin request, and a workspace this admin may manage.
 */
export async function requireWorkspace(request: Request): Promise<
  { ctx: AdminContext; weddingId: string; response: null } | { ctx: null; weddingId: null; response: Response }
> {
  const ctx = await getAdminContext();
  if (!ctx) return { ctx: null, weddingId: null, response: fail("Unauthorized", 401) };
  if (!isSameOrigin(request)) return { ctx: null, weddingId: null, response: fail("Bad origin", 403) };
  if (!ctx.weddingId) return { ctx: null, weddingId: null, response: fail("No workspace", 403) };
  return { ctx, weddingId: ctx.weddingId, response: null };
}

/** Guards an owner-only API route. */
export async function requireOwner(request: Request): Promise<{ ctx: AdminContext; response: null } | { ctx: null; response: Response }> {
  const ctx = await getAdminContext();
  if (!ctx) return { ctx: null, response: fail("Unauthorized", 401) };
  if (!isSameOrigin(request)) return { ctx: null, response: fail("Bad origin", 403) };
  if (!ctx.isOwner) return { ctx: null, response: fail("Forbidden", 403) };
  return { ctx, response: null };
}

/**
 * The workspace for an admin page (server component). Pages render inside
 * the admin layout, which already shows the "no workspace" state, so a page
 * that gets null renders nothing of its own.
 */
export async function pageWorkspace(): Promise<string | null> {
  const ctx = await getAdminContext();
  return ctx?.weddingId ?? null;
}

/** Whether an uploaded file belongs to this workspace (so one wedding cannot
 *  attach, or delete, another wedding's upload by its id). */
export async function ownsMedia(weddingId: string, mediaId: string) {
  const db = await getDb();
  const rows = await db.select({ id: media.id }).from(media).where(and(eq(media.id, mediaId), eq(media.weddingId, weddingId))).limit(1);
  return rows.length > 0;
}

/**
 * Whether this admin may rename, or reset the password of, another account
 * from the given workspace: the owner may for anyone; anyone else only for a
 * non-owner account that is a member here and of no workspace they cannot
 * manage themselves.
 */
export async function canAdminister(ctx: AdminContext, weddingId: string, targetId: string) {
  const db = await getDb();
  const [target] = await db.select({ isOwner: users.isOwner }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return false;
  if (ctx.isOwner) return true;
  if (target.isOwner) return false;
  const theirs = await db.select({ w: workspaceMembers.weddingId }).from(workspaceMembers).where(eq(workspaceMembers.userId, targetId));
  if (!theirs.some((m) => m.w === weddingId)) return false;
  return theirs.every((m) => canManage(ctx, m.w));
}
