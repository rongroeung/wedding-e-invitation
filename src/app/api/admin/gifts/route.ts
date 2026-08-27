import { asc } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { giftAccounts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  bankName: z.string().trim().min(1).max(120),
  accountName: z.string().trim().min(1).max(160),
  accountNumber: z.string().trim().min(1).max(80),
  note: z.string().max(200).default(""),
  qrMediaId: z.string().max(80).nullable().optional(),
  qrUrl: z.string().max(600).default(""),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const db = await getDb();
  return ok(await db.select().from(giftAccounts).orderBy(asc(giftAccounts.sortOrder)));
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422);
  const db = await getDb();
  const [row] = await db.insert(giftAccounts).values(parsed.data).returning();
  return ok(row, { status: 201 });
}
