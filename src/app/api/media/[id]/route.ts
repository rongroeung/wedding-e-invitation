import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Serves an uploaded photo, audio file or video straight from the database.
 *
 * **Range requests are answered, and for video that is not an optimisation.**
 * A `<video>` element asks for a byte range before it will play; Safari in
 * particular sends `Range: bytes=0-1`, and if the answer is a 200 with the
 * whole file rather than a 206 with `Content-Range`, it decides the source is
 * not seekable and refuses to play it at all. The video simply sits there, with
 * no error anywhere, on exactly the devices most of these guests are holding.
 * Scrubbing needs it too, but playing at all is the reason it is here.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  const file = rows[0];
  if (!file) return new Response("Not found", { status: 404 });

  const body = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data as unknown as Uint8Array);

  const headers: Record<string, string> = {
    "Content-Type": file.mimeType,
    "Content-Length": String(body.byteLength),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };

  // SVG is markup: served from our own origin it could run script if opened
  // directly. It stays inert inside an <img>, and this makes it inert anywhere.
  if (file.mimeType === "image/svg+xml") {
    headers["Content-Security-Policy"] =
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";
  }

  /*
   * A single `bytes=start-end` range, which is all any media element sends.
   * Multipart ranges are legal HTTP and no browser asks for them for media, so
   * anything with a comma in it is answered with the whole file rather than
   * with a wrong 206 — the client is allowed to be given more than it asked for
   * and is not allowed to be given the wrong bytes.
   */
  const range = request.headers.get("range");
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (match && !range.includes(",")) {
    const size = body.byteLength;
    const hasStart = match[1] !== "";
    // `bytes=-500` means the *last* 500 bytes, not "from 0 to 500".
    const start = hasStart ? Number(match[1]) : Math.max(0, size - Number(match[2] || 0));
    const end = hasStart ? Math.min(size - 1, Number(match[2] || size - 1)) : size - 1;

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
      });
    }

    const slice = body.subarray(start, end + 1);
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(slice.byteLength),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }

  return new Response(new Uint8Array(body), { headers });
}
