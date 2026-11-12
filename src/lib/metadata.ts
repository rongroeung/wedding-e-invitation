import type { Metadata } from "next";
import type { Wedding } from "./db/schema";

/**
 * The share preview of one wedding: title, description and picture, for a
 * page that is not the default workspace's (whose values the root layout
 * sets). Messenger and Telegram read these, so a link to /w/<slug> or to a
 * guest's /invite/<code> shows that couple, not the first wedding on the site.
 */
export function weddingMetadata(w: Wedding, extra?: { title?: string; description?: string }): Metadata {
  const base = `${w.title} | ${w.groomName} & ${w.brideName}`;
  const title = extra?.title ?? base;
  const description = extra?.description ?? (w.metaDescription || `${w.weddingDateKhmer} • ${w.venueName}`);
  const image = w.coverPhotoId
    ? `/api/media/${w.coverPhotoId}`
    : w.coverPhotoUrl || `/api/og?w=${encodeURIComponent(w.slug)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "km_KH",
      siteName: base,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
