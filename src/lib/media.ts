/** Resolves either an uploaded media id or an external URL to an <img> src. */
export function mediaSrc(mediaId?: string | null, url?: string | null): string {
  if (mediaId) return `/api/media/${mediaId}`;
  if (url) return url;
  return "";
}
