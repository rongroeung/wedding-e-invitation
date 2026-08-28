"use client";

import type { Guest, Wedding } from "@/lib/db/schema";
import { Monogram } from "@/components/ui/Monogram";
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
}: {
  wedding: Wedding;
  guest: Guest | null;
  opened: boolean;
  onOpen: () => void;
}) {
  // Latin names carry small-caps letter-spacing well; Khmer clusters do not.
  const latin = guest?.nameLatin?.trim();
  const displayName = latin || (guest ? `${guest.title} ${guest.name}` : wedding.invitationHonorific);

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

        <div className="relative z-20 flex w-full flex-col items-center">
          <Monogram
            text={wedding.monogram}
            groom={wedding.groomName}
            bride={wedding.brideName}
            className="h-[150px] w-[150px] text-gold-frame sm:h-[176px] sm:w-[176px]"
          />

          <p className="mt-10 text-sm text-gold-1 khmer-wrap">{wedding.subtitle}</p>

          <p
            className={
              latin
                ? "mt-4 text-xl font-semibold uppercase tracking-[0.08em] text-heading"
                : "mt-4 text-xl font-semibold text-heading khmer-wrap"
            }
          >
            {displayName}
          </p>

          <button type="button" onClick={onOpen} className="btn-gold mt-12 min-w-[210px] khmer-wrap">
            {wedding.openButton}
          </button>
        </div>
      </div>
    </div>
  );
}
