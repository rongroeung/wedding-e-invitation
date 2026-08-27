import { asc } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { galleryImages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  mediaId: z.string().max(80).nullable().optional(),
  url: z.string().max(600).default(""),
  caption: z.string().max(200).default(""),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder)));
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  if (!parsed.data.mediaId && !parsed.data.url) return fail("Photo required", 422);
  const db = await getDb();
  const [row] = await db.insert(galleryImages).values(parsed.data).returning();
  return ok(row, { status: 201 });
}
