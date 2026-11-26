"use client";

import { preload } from "react-dom";
import type { InvitationData } from "@/lib/queries";
import { cardBackdrop, pageBackdrop } from "@/lib/artwork";
import { frameConfig } from "@/lib/frame";
import { sceneOf, themeKeyOf } from "@/lib/invitationTheme";
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
export function ImagePreload({
  data,
  opening,
  filmPoster = "",
}: {
  data: InvitationData;
  /** the opening page will be shown */
  opening: boolean;
  /** the pre-wedding film's poster, shown the moment the film opens */
  filmPoster?: string;
}) {
  const { first, later } = invitationImages(data, opening, filmPoster);
  const seen = new Set<string>();
  const ask = (src: string, fetchPriority: "high" | "low") => {
    if (seen.has(src)) return;
    seen.add(src);
    preload(src, { as: "image", fetchPriority });
  };
  first.forEach((src) => ask(src, "high"));
  later.forEach((src) => ask(src, "low"));
  return null;
}

/**
 * The invitation's pictures: what is seen first, then the rest. Shared by the
 * preloading above and by the opening page, which waits for all of them
 * (useOpeningReady) before it lets the guest open the invitation.
 */
export function invitationImages(data: InvitationData, opening: boolean, filmPoster = "") {
  const { wedding, gallery } = data;
  const theme = themeKeyOf(wedding.invitationTheme);
  const frame = frameConfig(wedding);

  const first = [
    theme === "photo" ? mediaSrc(wedding.openingPhotoId, wedding.openingPhotoUrl) : "",
    // a film theme opens on the film's first frame and holds on its last
    opening ? sceneOf(theme)?.first ?? "" : "",
    sceneOf(theme)?.still ?? "",
    cardBackdrop(wedding)?.src ?? "",
    pageBackdrop(wedding)?.src ?? "",
    frame.shown ? frame.cornerSrc : "",
    frame.shown ? frame.topSrc : "",
    frame.shown ? frame.bottomSrc : "",
    // the name plate is only on the opening page
    opening && !sceneOf(theme) ? "/frames/kbach-name-frame.webp" : "",
    opening && !sceneOf(theme) ? "/frames/kbach-name-panel-mask.png" : "",
    wedding.nameLogoMediaId ? mediaSrc(wedding.nameLogoMediaId, "") : "",
    // the pre-wedding film's picture, on screen as soon as the envelope opens
    opening ? filmPoster : "",
  ];
  const later = [
    mediaSrc(wedding.groomPhotoId, wedding.groomPhotoUrl),
    mediaSrc(wedding.bridePhotoId, wedding.bridePhotoUrl),
    ...gallery.map((g) => mediaSrc(g.mediaId, g.url)),
    mediaSrc(wedding.giftQrMediaId, wedding.giftQrUrl),
    mediaSrc(wedding.venueMapMediaId, ""),
  ];
  const clean = (list: string[]) => list.filter((src) => src && !src.startsWith("data:"));
  return { first: clean(first), later: clean(later) };
}
