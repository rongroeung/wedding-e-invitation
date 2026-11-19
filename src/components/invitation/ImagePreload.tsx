"use client";

import { preload } from "react-dom";
import type { InvitationData } from "@/lib/queries";
import { cardBackdrop, pageBackdrop } from "@/lib/artwork";
import { frameConfig } from "@/lib/frame";
import { GARDEN_MEDIA, themeKeyOf } from "@/lib/invitationTheme";
import { mediaSrc } from "@/lib/media";

/**
 * Every picture the invitation will show, asked for as the page is first
 * served, so nothing pops in later: React writes each one into the page's
 * <head> as `<link rel="preload" as="image">`, which the browser starts
 * fetching before it has even laid the page out.
 *
 * What is seen first — the opening picture, the paper and the room, the card's
 * frame and the name plate — goes at high priority; the rest (the couple's
 * portraits, the gallery, the gift QR, the map picture) at low priority, so it
 * all arrives early without slowing the first screen.
 */
export function ImagePreload({ data, opening }: { data: InvitationData; /** the opening page will be shown */ opening: boolean }) {
  const { wedding, gallery } = data;
  const theme = themeKeyOf(wedding.invitationTheme);
  const frame = frameConfig(wedding);

  const first = [
    theme === "photo" ? mediaSrc(wedding.openingPhotoId, wedding.openingPhotoUrl) : "",
    theme === "garden" ? GARDEN_MEDIA.still : "",
    cardBackdrop(wedding)?.src ?? "",
    pageBackdrop(wedding)?.src ?? "",
    frame.shown ? frame.cornerSrc : "",
    frame.shown ? frame.topSrc : "",
    frame.shown ? frame.bottomSrc : "",
    // the name plate is only on the opening page
    opening && theme !== "garden" ? "/frames/kbach-name-frame.webp" : "",
    opening && theme !== "garden" ? "/frames/kbach-name-panel-mask.png" : "",
    wedding.nameLogoMediaId ? mediaSrc(wedding.nameLogoMediaId, "") : "",
  ];
  const later = [
    mediaSrc(wedding.groomPhotoId, wedding.groomPhotoUrl),
    mediaSrc(wedding.bridePhotoId, wedding.bridePhotoUrl),
    ...gallery.map((g) => mediaSrc(g.mediaId, g.url)),
    mediaSrc(wedding.giftQrMediaId, wedding.giftQrUrl),
    mediaSrc(wedding.venueMapMediaId, ""),
  ];

  const seen = new Set<string>();
  const ask = (src: string, fetchPriority: "high" | "low") => {
    if (!src || seen.has(src) || src.startsWith("data:")) return;
    seen.add(src);
    preload(src, { as: "image", fetchPriority });
  };
  first.forEach((src) => ask(src, "high"));
  later.forEach((src) => ask(src, "low"));
  return null;
}
