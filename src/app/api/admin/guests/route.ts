import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, randomCode, readJson, requireAdmin, slugify } from "@/lib/api";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const guestSchema = z.object({
  title: z.string().max(40).default("លោក"),
  name: z.string().trim().min(1).max(160),
  phone: z.string().max(40).default(""),
  allowedSeats: z.number().int().min(1).max(20).default(1),
  notes: z.string().max(400).default(""),
  code: z.string().max(80).optional(),
});

const bulkSchema = z.object({
  /** One guest per line: `ឈ្មោះ, លេខទូរស័ព្ទ, ចំនួនកៅអី` */
  text: z.string().min(1).max(20000),
  title: z.string().max(40).default("លោក"),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(guests).orderBy(desc(guests.createdAt)));
}

async function uniqueCode(base: string) {
  const db = await getDb();
  let code = base || randomCode();
  for (let i = 0; i < 6; i++) {
    const clash = await db.select().from(guests).where(eq(guests.code, code)).limit(1);
    if (clash.length === 0) return code;
    code = `${base}-${randomCode(3).toLowerCase()}`;
  }
  return randomCode(10);
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
      const [name, phone, seats] = line.split(/[,\t;]/).map((part) => part.trim());
      if (!name) continue;
      const code = await uniqueCode(slugify(name) || randomCode());
      const [row] = await db
        .insert(guests)
        .values({
          code,
          title: bulk.data.title,
          name,
          phone: phone ?? "",
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
  const code = await uniqueCode(
    parsed.data.code ? slugify(parsed.data.code) : slugify(parsed.data.name) || randomCode(),
  );
  const [row] = await db.insert(guests).values({ ...parsed.data, code }).returning();
  return ok(row, { status: 201 });
}
