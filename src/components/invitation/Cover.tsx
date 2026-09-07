"use client";

import type { Guest, Wedding } from "@/lib/db/schema";
import { CoverContent } from "./CoverContent";
import { LiveBackdrop } from "./LiveBackdrop";

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
  return (
    <div
      className={`absolute inset-0 z-30 transition-all duration-[900ms] ease-[cubic-bezier(.7,0,.25,1)] ${
        opened ? "pointer-events-none -translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
      aria-hidden={opened}
    >
      {/*
        * The same `paper` treatment as the card beneath. A flat --c-bg here
        * reads lighter than the textured stock around it, which shows as a
        * seam where the cover meets the frame.
        */}
      <div className="paper relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-8 py-10 text-center sm:px-10">
        <LiveBackdrop count={14} />

        <CoverContent
          wedding={wedding}
          guest={guest}
          reveal={reveal}
          action={
            <button type="button" onClick={onOpen} className="btn-gold mt-12 min-w-[210px] khmer-wrap">
              {wedding.openButton}
            </button>
          }
        />
      </div>
    </div>
  );
}
