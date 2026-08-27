import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Serves an uploaded photo / audio file straight from the database. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  const file = rows[0];
  if (!file) return new Response("Not found", { status: 404 });

  const body = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data as unknown as Uint8Array);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
