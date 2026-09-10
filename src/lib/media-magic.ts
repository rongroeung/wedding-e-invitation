/**
 * What a file's first bytes say it is, as opposed to what it claims.
 *
 * A declared content type is a claim made by the browser from the file
 * extension, and an extension is a claim made by whoever named the file. These
 * read the header instead.
 *
 * They live here rather than beside one route because there are two upload
 * paths now — a single request for a photo, and a chunked one for a film too
 * large for a serverless host to accept whole — and both have to reach the same
 * verdict about the same bytes. A validator that exists twice is a validator
 * that will eventually disagree with itself.
 *
 * Only the *first* piece of a chunked upload can be asked, which is also the
 * only one that needs to be: every signature here is at the front of the file.
 */

/**
 * MP4 and MOV are both ISO base media: a length-prefixed `ftyp` box at offset
 * 4. WebM is Matroska, whose EBML header is a fixed four bytes.
 */
export function looksLikeVideo(buffer: Buffer, mimeType: string) {
  const head = buffer.subarray(4, 12).toString("ascii");
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") return head.startsWith("ftyp");
  if (mimeType === "video/webm") return buffer.subarray(0, 4).toString("hex") === "1a45dfa3";
  return false;
}

export function looksLikeImage(buffer: Buffer, mimeType: string) {
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

/**
 * Audio is accepted on its declared type alone, which is what the single-shot
 * endpoint has always done — this only makes that explicit rather than implied
 * by an absent branch. The allow-list is already narrow, the file is served
 * with `nosniff` and its stored content type, and a mislabelled song is a
 * song that does not play rather than a security question.
 */
export function looksLikeAudio(_buffer: Buffer, _mimeType: string) {
  return true;
}
