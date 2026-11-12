import { desc, eq } from "drizzle-orm";
import { fail } from "@/lib/api";
import { getAdminContext } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { guests, rsvps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** CSV export of guests or RSVPs (UTF-8 BOM so Excel renders Khmer correctly). */
export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return fail("Unauthorized", 401);
  const weddingId = ctx.weddingId;
  if (!weddingId) return fail("No workspace", 403);

  const type = new URL(request.url).searchParams.get("type") === "guests" ? "guests" : "rsvps";
  const db = await getDb();

  let rows: string[][];
  if (type === "guests") {
    const data = await db.select().from(guests).where(eq(guests.weddingId, weddingId)).orderBy(desc(guests.createdAt));
    rows = [
      ["ឈ្មោះ", "ងារ", "ឈ្មោះឡាតាំង", "ចំនួនកៅអី", "លេខកូដ", "តំណអញ្ជើញ", "ចំនួនមើល", "កំណត់ចំណាំ"],
      ...data.map((g) => [
        g.name, g.title, g.nameLatin, String(g.allowedSeats), g.code,
        `/invite/${g.code}`, String(g.views), g.notes,
      ]),
    ];
  } else {
    const data = await db.select().from(rsvps).where(eq(rsvps.weddingId, weddingId)).orderBy(desc(rsvps.updatedAt));
    rows = [
      ["ឈ្មោះ", "វត្តមាន", "ចំនួនអ្នកចូលរួម", "សារជូនពរ", "កាលបរិច្ឆេទ"],
      ...data.map((r) => [
        r.name, r.attending ? "ចូលរួម" : "មិនអាចចូលរួម",
        String(r.guestCount), r.message, new Date(r.createdAt).toISOString(),
      ]),
    ];
  }

  const csv =
    "﻿" +
    rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
