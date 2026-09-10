import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  fail,
  ok,
  requireAdmin,
} from "@/lib/api";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { looksLikeImage, looksLikeVideo } from "@/lib/media-magic";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Validated upload endpoint — stores the file as a row in the media table. */
export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload", 400);
  }

  const file = form.get("file");
  const asked = String(form.get("kind") ?? "image");
  const kind = asked === "audio" || asked === "video" ? asked : "image";
  if (!(file instanceof File)) return fail("សូមជ្រើសរើសឯកសារ", 422);

  const allowed =
    kind === "audio" ? ALLOWED_AUDIO_TYPES : kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxBytes =
    kind === "audio" ? MAX_AUDIO_BYTES : kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (!allowed.includes(file.type)) {
    return fail(`ប្រភេទឯកសារមិនត្រូវបានអនុញ្ញាត (${file.type || "unknown"})`, 415);
  }
  if (file.size > maxBytes) {
    return fail(`ឯកសារធំពេក អតិបរមា ${Math.round(maxBytes / 1024 / 1024)}MB`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extra safety: verify the magic bytes match the declared type.
  if (kind === "image" && !looksLikeImage(buffer, file.type)) {
    return fail("ឯកសារមិនមែនជារូបភាពត្រឹមត្រូវទេ", 415);
  }
  if (kind === "video" && !looksLikeVideo(buffer, file.type)) {
    return fail("ឯកសារមិនមែនជាវីដេអូត្រឹមត្រូវទេ", 415);
  }

  const db = await getDb();
  const [row] = await db
    .insert(media)
    .values({
      filename: file.name.slice(0, 160) || "upload",
      mimeType: file.type,
      size: buffer.byteLength,
      kind,
      data: buffer,
    })
    .returning({ id: media.id, filename: media.filename, mimeType: media.mimeType, size: media.size });

  return ok({ ...row, url: `/api/media/${row.id}` }, { status: 201 });
}
