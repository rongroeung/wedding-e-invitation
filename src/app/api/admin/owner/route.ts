import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { systemOwner } from "@/lib/db/schema";
import { getSystemOwner } from "@/lib/queries";
import { requireOwner } from "@/lib/workspace";

/**
 * The system owner's details (SystemOwner, at the end of every invitation).
 * Only the site owner, and only from the main workspace, may read or change
 * them here — they belong to the whole site, not to one couple's wedding.
 */
async function guard(request: Request) {
  const g = await requireOwner(request);
  if (g.response) return g;
  if (g.ctx.weddingId !== "main") return { ctx: null, response: fail("Only from the main workspace", 403) };
  return g;
}

const text = (max: number) => z.string().trim().max(max);
const url = z.string().trim().max(400).regex(/^https?:\/\/\S+$/i, "A link starting with https://");

const schema = z.object({
  enabled: z.boolean().optional(),
  message: text(600).optional(),
  phone: text(40).optional(),
  telegram: text(200).optional(),
  instagram: text(200).optional(),
  facebook: text(200).optional(),
  tiktok: text(200).optional(),
  youtube: text(200).optional(),
  website: text(300).optional(),
  links: z.array(z.object({ label: text(40).min(1), url })).max(8).optional(),
});

export async function GET(request: Request) {
  const g = await guard(request);
  if (g.response) return g.response;
  return ok(await getSystemOwner());
}

export async function PUT(request: Request) {
  const g = await guard(request);
  if (g.response) return g.response;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return fail("Invalid data", 422, { issues: parsed.error.flatten() });
  await getSystemOwner(); // the row exists
  const db = await getDb();
  const [row] = await db
    .update(systemOwner)
    .set({ ...parsed.data, updatedAt: sql`now()` })
    .where(eq(systemOwner.id, "site"))
    .returning();
  return ok(row);
}
