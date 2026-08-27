import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, randomCode, readJson, requireAdmin, slugify } from "@/lib/api";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const guestSchema = z.object({
  title: z.string().max(40).default("លោក"),
  name: z.string().trim().min(1).max(160),
  nameLatin: z.string().max(160).default(""),
  allowedSeats: z.number().int().min(1).max(20).default(1),
  notes: z.string().max(400).default(""),
  code: z.string().max(80).optional(),
});

const bulkSchema = z.object({
  /** One guest per line: `ឈ្មោះ, ចំនួនកៅអី` */
  text: z.string().min(1).max(20000),
  title: z.string().max(40).default("លោក"),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(guests).orderBy(desc(guests.createdAt)));
}

const CODE_LENGTH = 8;

/**
 * Invitation codes are random, never derived from the guest's name — a name in
 * the URL leaks who was invited to anyone who sees the link, and lets people
 * guess each other's invitations. A custom code can still be set by hand in the
 * dashboard when someone wants a memorable one.
 */
async function uniqueCode(preferred?: string) {
  const db = await getDb();
  let code = preferred || randomCode(CODE_LENGTH);
  for (let attempt = 0; attempt < 8; attempt++) {
    const clash = await db.select().from(guests).where(eq(guests.code, code)).limit(1);
    if (clash.length === 0) return code;
    code = randomCode(CODE_LENGTH + Math.floor(attempt / 3));
  }
  return randomCode(CODE_LENGTH + 4);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const body = await readJson<unknown>(request);

  // Bulk import mode
  const bulk = bulkSchema.safeParse(body);
  if (bulk.success && "text" in (body as Record<string, unknown>)) {
    const db = await getDb();
    const created = [];
    for (const line of bulk.data.text.split("\n")) {
      const [name, seats] = line.split(/[,\t;]/).map((part) => part.trim());
      if (!name) continue;
      const code = await uniqueCode();
      const [row] = await db
        .insert(guests)
        .values({
          code,
          title: bulk.data.title,
          name,
          allowedSeats: Math.min(20, Math.max(1, Number(seats) || 1)),
        })
        .returning();
      created.push(row);
    }
    return ok({ imported: created.length, guests: created }, { status: 201 });
  }

  const parsed = guestSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid data", 422);

  const db = await getDb();
  // An explicit code is honoured (slugified); otherwise it is random.
  const code = await uniqueCode(parsed.data.code ? slugify(parsed.data.code) : undefined);
  const [row] = await db.insert(guests).values({ ...parsed.data, code }).returning();
  return ok(row, { status: 201 });
}
