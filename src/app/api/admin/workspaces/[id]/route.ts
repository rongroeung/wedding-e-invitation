import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { galleryImages, guests, media, pageViews, rsvps, storyItems, wedding, weddingEvents } from "@/lib/db/schema";
import { DEFAULT_WORKSPACE, WORKSPACE_COOKIE, normaliseSlug, requireOwner } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().max(120).optional(),
  slug: z.string().min(1).max(60).optional(),
});

/** Rename a workspace, or move its address (owner only; the default stays at "/"). */
export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireOwner(request);
  if (response) return response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("ទិន្នន័យមិនត្រឹមត្រូវ", 422);

  const patch: { workspaceName?: string; slug?: string } = {};
  if (parsed.data.name !== undefined) patch.workspaceName = parsed.data.name;
  if (parsed.data.slug !== undefined) {
    if (id === DEFAULT_WORKSPACE) return fail("អាសយដ្ឋានរបស់កន្លែងធ្វើការដើម មិនអាចប្ដូរបានទេ", 409);
    const slug = normaliseSlug(parsed.data.slug);
    if (!slug || slug === DEFAULT_WORKSPACE) return fail("អាសយដ្ឋានត្រូវមានអក្សរឡាតាំង លេខ ឬ - (២ ដល់ ៤៨ តួ)", 422);
    const db = await getDb();
    const [clash] = await db.select({ id: wedding.id }).from(wedding).where(eq(wedding.slug, slug)).limit(1);
    if (clash && clash.id !== id) return fail("អាសយដ្ឋាននេះមានរួចហើយ", 409);
    patch.slug = slug;
  }
  if (!Object.keys(patch).length) return fail("គ្មានអ្វីត្រូវកែ", 422);
  const db = await getDb();
  const [row] = await db.update(wedding).set(patch).where(eq(wedding.id, id)).returning({ id: wedding.id, slug: wedding.slug });
  if (!row) return fail("Not found", 404);
  return ok(row);
}

const deleteSchema = z.object({ confirm: z.string() });

/**
 * Delete a workspace and everything in it (owner only): its details,
 * programme, story, gallery, guests, replies, views and uploads. The default
 * workspace cannot be deleted, and the request must repeat the workspace's
 * address, so a slip of the mouse cannot do it.
 */
export async function DELETE(request: Request, { params }: Params) {
  const { response } = await requireOwner(request);
  if (response) return response;
  const { id } = await params;
  if (id === DEFAULT_WORKSPACE) return fail("កន្លែងធ្វើការដើម មិនអាចលុបបានទេ", 409);
  const parsed = deleteSchema.safeParse(await readJson<unknown>(request));
  const db = await getDb();
  const [row] = await db.select({ slug: wedding.slug }).from(wedding).where(eq(wedding.id, id)).limit(1);
  if (!row) return fail("Not found", 404);
  if (!parsed.success || parsed.data.confirm !== row.slug) return fail("សូមវាយអាសយដ្ឋានឱ្យត្រូវ ដើម្បីបញ្ជាក់", 422);

  // replies first (they point at guests), then the rest, then the wedding (members cascade)
  await db.delete(rsvps).where(eq(rsvps.weddingId, id));
  await db.delete(guests).where(eq(guests.weddingId, id));
  await db.delete(pageViews).where(eq(pageViews.weddingId, id));
  await db.delete(galleryImages).where(eq(galleryImages.weddingId, id));
  await db.delete(storyItems).where(eq(storyItems.weddingId, id));
  await db.delete(weddingEvents).where(eq(weddingEvents.weddingId, id));
  await db.delete(media).where(eq(media.weddingId, id));
  await db.delete(wedding).where(eq(wedding.id, id));

  const store = await cookies();
  if (store.get(WORKSPACE_COOKIE)?.value === id) store.delete(WORKSPACE_COOKIE);
  return ok({ deleted: id });
}
