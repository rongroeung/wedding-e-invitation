"use client";

import type { Guest, Wedding } from "@/lib/db/schema";
import { CoverContent } from "./CoverContent";
import { LiveBackdrop } from "./LiveBackdrop";
import { mediaSrc } from "@/lib/media";

/**
 * The closed card. A monogram, the guest's name, and one button — nothing else,
 * so opening the invitation feels like lifting the flap on a printed envelope.
 *
 * It fills the framed region rather than the whole card, so the frame's head
 * and foot stay visible around it.
 */
export function Cover({
  wedding,
  guest,
  opened,
  onOpen,
  reveal = false,
}: {
  wedding: Wedding;
  guest: Guest | null;
  opened: boolean;
  onOpen: () => void;
  /** The velvet is parting: the monogram may draw itself in. */
  reveal?: boolean;
}) {
  /*
   * The couple's cover photograph, when there is one, fills the cover under a
   * controlled dark overlay and the writing turns light. Without one the cover
   * is the card's own paper, exactly as before.
   */
  const photo = mediaSrc(wedding.coverPhotoId, wedding.coverPhotoUrl);
  return (
    <div
      className={`cover-root absolute inset-0 z-30 transition-all duration-[900ms] ease-[cubic-bezier(.7,0,.25,1)] ${
        opened ? "pointer-events-none -translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
      aria-hidden={opened}
    >
      <div
        /*
         * Transparent: the card's own sheet shows through. It used to carry its
         * own `.paper`, which made the cover a second, differently toned piece
         * of paper laid between the frame's head and foot.
         */
        className={`cover-shell relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${
          photo ? "cover-on-photo" : ""
        }`}
      >
        {photo && (
          <span
            className="cover-photo"
            style={{ ["--cover-photo" as string]: `url("${photo.replace(/"/g, "%22")}")` }}
            aria-hidden="true"
          />
        )}
        {/* No sheen: it is clipped to this box, so each pass lit a band with
            hard top and bottom edges across the sheet. */}
        <LiveBackdrop count={14} sheen={false} />

        <CoverContent
          wedding={wedding}
          guest={guest}
          reveal={reveal}
          action={
            <button type="button" onClick={onOpen} className="btn-gold cv-open min-w-[200px] khmer-wrap">
              {wedding.openButton}
            </button>
          }
        />
      </div>
    </div>
  );
}
