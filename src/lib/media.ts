/** Resolves either an uploaded media id or an external URL to an <img> src. */
export function mediaSrc(mediaId?: string | null, url?: string | null): string {
  if (mediaId) return `/api/media/${mediaId}`;
  if (url) return url;
  return "";
}

/**
 * The widths photos are shown at (the media route resizes to these only):
 * a full-screen photo or the card's paper, a wide page backdrop, a gallery
 * tile, a portrait.
 */
export const PHOTO_W = { full: 1280, wide: 1920, tile: 960, portrait: 640 } as const;

/**
 * A photo at the size it is shown: an upload is asked for resized
 * (`/api/media/<id>?w=1280`, WebP); an outside URL is used as it is.
 */
export function photoSrc(mediaId: string | null | undefined, url: string | null | undefined, width: number): string {
  if (mediaId) return `/api/media/${mediaId}?w=${width}`;
  if (url) return url;
  return "";
}
