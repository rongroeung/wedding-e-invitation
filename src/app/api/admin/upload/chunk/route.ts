import { and, eq, sql } from "drizzle-orm";
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  fail,
  ok,
  guard,
  requireAdmin,
} from "@/lib/api";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { looksLikeAudio, looksLikeImage, looksLikeVideo } from "@/lib/media-magic";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * A large upload, one piece at a time.
 *
 * The single-shot endpoint next door is the right thing for a photo and cannot
 * be the right thing for a wedding film, because the limit that stops it is not
 * ours: a serverless host refuses a request body over its own cap — 4.5 MB on
 * Vercel — **before the application runs at all**. No amount of raising
 * `MAX_VIDEO_BYTES` reaches that decision. It is why the failure arrived as
 * `Unexpected token 'R'`: the reply was the platform's plain words "Request
 * Entity Too Large", not our JSON.
 *
 * So the browser cuts the file into pieces that fit comfortably under the cap
 * and posts them in order, and they are appended here in the database. Postgres
 * concatenates `bytea` with `||`, so each piece is one `UPDATE` and the file is
 * never held in a function's memory in full — which matters as much as the cap
 * does, since 64 MB through a small serverless instance is its own problem.
 *
 * The row is created by the first piece and only marked `complete` by the last,
 * and `/api/media/[id]` will not serve an incomplete one. An upload abandoned
 * half way therefore leaves a row that is never shown; that is deliberate, and
 * cheaper than a scheme where a half-file is indistinguishable from a whole one.
 */
export async function POST(request: Request) {
  return guard(async () => {
  const { response } = await requireAdmin(request);
  if (response) return response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload", 400);
  }

  const uploadId = String(form.get("uploadId") ?? "");
  const index = Number(form.get("index"));
  const total = Number(form.get("total"));
  const asked = String(form.get("kind") ?? "image");
  const kind = asked === "audio" || asked === "video" ? asked : "image";
  const filename = String(form.get("filename") ?? "upload");
  const mimeType = String(form.get("mimeType") ?? "");
  const piece = form.get("chunk");

  /* An id from the client names a row, so it has to be a shape we chose. */
  if (!/^[0-9a-f-]{36}$/i.test(uploadId)) return fail("Bad upload id", 422);
  if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total < 1 || index >= total) {
    return fail("Bad chunk index", 422);
  }
  if (!(piece instanceof File)) return fail("សូមជ្រើសរើសឯកសារ", 422);

  const allowed =
    kind === "audio" ? ALLOWED_AUDIO_TYPES : kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxBytes =
    kind === "audio" ? MAX_AUDIO_BYTES : kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (!allowed.includes(mimeType)) {
    return fail(`ប្រភេទឯកសារមិនត្រូវបានអនុញ្ញាត (${mimeType || "unknown"})`, 415);
  }

  const buffer = Buffer.from(await piece.arrayBuffer());
  const db = await getDb();

  if (index === 0) {
    /*
     * The magic bytes live at the front of a file, so the first piece is the
     * only one that can be asked — and the only one that needs to be. A file
     * whose header is not what it claims is refused before a single byte of it
     * is stored.
     */
    const looksRight =
      kind === "image"
        ? looksLikeImage(buffer, mimeType)
        : kind === "video"
          ? looksLikeVideo(buffer, mimeType)
          : looksLikeAudio(buffer, mimeType);
    if (!looksRight) {
      return fail(
        kind === "image"
          ? "ឯកសារមិនមែនជារូបភាពត្រឹមត្រូវទេ"
          : kind === "video"
            ? "ឯកសារមិនមែនជាវីដេអូត្រឹមត្រូវទេ"
            : "ឯកសារមិនមែនជាសំឡេងត្រឹមត្រូវទេ",
        415,
      );
    }
    if (buffer.byteLength > maxBytes) return fail("ឯកសារធំពេក", 413);

    await db
      .insert(media)
      .values({
        id: uploadId,
        filename,
        mimeType,
        kind,
        size: buffer.byteLength,
        data: buffer,
        complete: total === 1,
      })
      .onConflictDoNothing();
    return ok({ id: uploadId, received: 1, of: total });
  }

  /*
   * Append, and let the database decide whether it is allowed to.
   *
   * The size ceiling is in the `WHERE`, not in a read-then-write above it: two
   * pieces arriving at once would both read a size under the limit and both
   * append. One statement cannot race with itself.
   */
  const appended = await db
    .update(media)
    .set({
      data: sql`${media.data} || ${buffer}`,
      size: sql`${media.size} + ${buffer.byteLength}`,
      complete: index === total - 1,
    })
    .where(and(eq(media.id, uploadId), sql`${media.size} + ${buffer.byteLength} <= ${maxBytes}`))
    .returning({ id: media.id, size: media.size, complete: media.complete });

  if (!appended.length) {
    return fail(`ឯកសារធំពេក អតិបរមា ${Math.round(maxBytes / 1024 / 1024)}MB`, 413);
  }
  return ok({ id: uploadId, received: index + 1, of: total, size: appended[0].size });
  });
}
