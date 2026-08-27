import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  fail,
  ok,
  requireAdmin,
} from "@/lib/api";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
  const kind = String(form.get("kind") ?? "image") === "audio" ? "audio" : "image";
  if (!(file instanceof File)) return fail("សូមជ្រើសរើសឯកសារ", 422);

  const allowed = kind === "audio" ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxBytes = kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;

  if (!allowed.includes(file.type)) {
    return fail(`ប្រភេទឯកសារមិនត្រូវបានអនុញ្ញាត (${file.type || "unknown"})`, 415);
  }
  if (file.size > maxBytes) {
    return fail(`ឯកសារធំពេក អតិបរមា ${Math.round(maxBytes / 1024 / 1024)}MB`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extra safety: verify the magic bytes match the declared image type.
  if (kind === "image" && !looksLikeImage(buffer, file.type)) {
    return fail("ឯកសារមិនមែនជារូបភាពត្រឹមត្រូវទេ", 415);
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

function looksLikeImage(buffer: Buffer, mimeType: string) {
  const hex = buffer.subarray(0, 12).toString("hex");
  if (mimeType === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mimeType === "image/png") return hex.startsWith("89504e470d0a1a0a");
  if (mimeType === "image/gif") return hex.startsWith("474946383");
  if (mimeType === "image/webp") return hex.startsWith("52494646") && hex.includes("57454250");
  if (mimeType === "image/avif") return buffer.subarray(4, 12).toString("ascii").includes("ftyp");
  if (mimeType === "image/svg+xml") {
    const head = buffer.subarray(0, 400).toString("utf8").toLowerCase();
    return head.includes("<svg") || head.includes("<?xml");
  }
  return true;
}
