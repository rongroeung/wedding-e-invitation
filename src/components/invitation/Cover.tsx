"use client";

import type { Guest, Wedding } from "@/lib/db/schema";
import { CardFrame } from "@/components/ui/CardFrame";
import type { FrameConfig } from "@/lib/frame";
import { Monogram } from "@/components/ui/Monogram";
import { LiveBackdrop } from "./LiveBackdrop";

/**
 * The closed card. A monogram, the guest's name, and one button — nothing else,
 * so opening the invitation feels like lifting the flap on a printed envelope.
 */
export function Cover({
  wedding,
  guest,
  frame,
  opened,
  onOpen,
}: {
  wedding: Wedding;
  guest: Guest | null;
  frame: FrameConfig;
  opened: boolean;
  onOpen: () => void;
}) {
  // Latin names carry small-caps letter-spacing well; Khmer clusters do not.
  const latin = guest?.nameLatin?.trim();
  const displayName = latin || (guest ? `${guest.title} ${guest.name}` : wedding.invitationHonorific);

  return (
    <div
      className={`absolute inset-x-0 top-0 z-30 h-[100svh] xl:h-[880px] transition-all duration-[900ms] ease-[cubic-bezier(.7,0,.25,1)] ${
        opened ? "pointer-events-none -translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
      aria-hidden={opened}
    >
      <div
        className="paper relative flex h-full w-full flex-col items-center justify-center px-8 text-center sm:px-10"
        style={{ paddingTop: frame.clearance, paddingBottom: frame.clearance }}
      >
        <CardFrame frame={frame} />
        <LiveBackdrop count={14} />

        <div className="relative z-20 flex w-full flex-col items-center">
          <Monogram
            text={wedding.monogram}
            groom={wedding.groomName}
            bride={wedding.brideName}
            className="h-[168px] w-[168px] text-gold-frame sm:h-[196px] sm:w-[196px]"
          />

          <p className="mt-14 text-sm text-gold-1 khmer-wrap">{wedding.subtitle}</p>

          <p
            className={
              latin
                ? "mt-4 text-xl font-semibold uppercase tracking-[0.08em] text-heading sm:text-2xl"
                : "mt-4 text-xl font-semibold text-heading khmer-wrap sm:text-2xl"
            }
          >
            {displayName}
          </p>

          <button type="button" onClick={onOpen} className="btn-gold mt-16 min-w-[210px] khmer-wrap">
            {wedding.openButton}
          </button>
        </div>
      </div>
    </div>
  );
}
