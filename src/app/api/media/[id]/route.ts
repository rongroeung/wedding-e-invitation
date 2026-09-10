import { eq, sql } from "drizzle-orm";
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
  /*
   * Everything except the bytes.
   *
   * `select()` used to bring the whole column back and then slice it in
   * JavaScript, which is fine for a QR code and quietly disastrous for a
   * wedding film: every request for two bytes of a 64 MB video read 64 MB out
   * of the database into the function's memory first. The embedded database
   * used in development does not survive it at all — it fails with
   * `memory access out of bounds`, which is a WASM heap giving up — and a
   * serverless instance in production would be paying for it on every seek.
   *
   * The size is a column, so the range arithmetic below needs no bytes at all,
   * and `slice()` fetches only the window that was actually asked for.
   */
  const rows = await db
    .select({
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      complete: media.complete,
    })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  const file = rows[0];
  if (!file) return new Response("Not found", { status: 404 });
  /*
   * A file still arriving is not a file.
   *
   * Large uploads are appended piece by piece, so between the first piece and
   * the last this row holds a prefix of a video. Served, that is a film which
   * plays for a second and stops — which looks like a broken invitation rather
   * than an upload still in progress. Rows written before chunking existed are
   * `complete` by default, so nothing that worked before changes.
   */
  if (file.complete === false) return new Response("Still uploading", { status: 404 });

  /**
   * One window of the file, read in the database rather than in memory here.
   *
   * `substring(bytea from x for n)` is 1-indexed, which is the only sharp edge.
   */
  const slice = async (start: number, length: number): Promise<Buffer> => {
    const [row] = await db
      .select({ part: sql<Buffer>`substring(${media.data} from ${start + 1} for ${length})` })
      .from(media)
      .where(eq(media.id, id))
      .limit(1);
    const part = row?.part;
    if (!part) return Buffer.alloc(0);
    return Buffer.isBuffer(part) ? part : Buffer.from(part as unknown as Uint8Array);
  };

  const size = file.size;

  const headers: Record<string, string> = {
    "Content-Type": file.mimeType,
    "Content-Length": String(size),
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

    const part = await slice(start, end - start + 1);
    return new Response(new Uint8Array(part), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(part.byteLength),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }

  /*
   * No range asked for, so the whole file — streamed a window at a time rather
   * than assembled. A browser playing a video always sends a range and never
   * reaches this; a direct link, a download or a poster image does, and there
   * is no reason for a 64 MB file to exist in memory even then.
   */
  const WINDOW = 1024 * 1024;
  let at = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (at >= size) {
        controller.close();
        return;
      }
      const part = await slice(at, Math.min(WINDOW, size - at));
      if (!part.byteLength) {
        controller.close();
        return;
      }
      at += part.byteLength;
      controller.enqueue(new Uint8Array(part));
    },
  });
  return new Response(stream, { headers });
}
