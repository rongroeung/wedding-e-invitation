import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { weddingEvents } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  groupName: z.string().max(160).default("ពេលព្រឹក"),
  groupIcon: z.string().max(16).default("🌸"),
  timeLabel: z.string().max(80).default(""),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(500).default(""),
  location: z.string().max(200).default(""),
  icon: z.string().max(40).default(""),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export async function GET(request: Request) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(weddingEvents).where(eq(weddingEvents.weddingId, weddingId)).orderBy(asc(weddingEvents.sortOrder)));
}

export async function POST(request: Request) {
  const { weddingId, response } = await requireWorkspace(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  const db = await getDb();
  const [row] = await db.insert(weddingEvents).values({ ...parsed.data, weddingId }).returning();
  return ok(row, { status: 201 });
}
