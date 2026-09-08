import type { Guest, Wedding } from "@/lib/db/schema";
import { Monogram } from "@/components/ui/Monogram";

/**
 * What the closed invitation says: the monogram, the occasion, and who it is
 * addressed to.
 *
 * Pulled out of `Cover` so the card that rises from the 3D envelope can be the
 * real thing rather than a mock-up of it. Both render this, so the card the
 * guest lifts out is the cover they would otherwise have landed on, and the
 * two can never drift apart.
 */
export function coverName(wedding: Wedding, guest: Guest | null) {
  // Latin names carry small-caps letter-spacing well; Khmer clusters do not.
  const latin = guest?.nameLatin?.trim();
  return {
    latin: Boolean(latin),
    text: latin || (guest ? `${guest.title} ${guest.name}` : wedding.invitationHonorific),
  };
}

export function CoverContent({
  wedding,
  guest,
  action,
  compact = false,
  reveal = false,
}: {
  wedding: Wedding;
  guest: Guest | null;
  /** The open button, when this is the live cover rather than a card in an envelope. */
  action?: React.ReactNode;
  /**
   * The cover is about to be seen: draw the monogram in.
   *
   * Passed down rather than decided here, because "seen" is a fact about the
   * *page* — the velvet starting to part — and this component has no way to
   * know it. Left off, the mark is simply already there, which is what a
   * preview or a print sheet wants.
   */
  reveal?: boolean;
  /** Inside the envelope the card is small; give it a little less air. */
  compact?: boolean;
}) {
  const name = coverName(wedding, guest);

  return (
    <div className="relative z-20 flex w-full flex-col items-center">
      <Monogram
        text={wedding.monogram}
        groom={wedding.groomName}
        bride={wedding.brideName}
        font={wedding.monogramFont}
        play={reveal}
        className={
          compact
            ? "h-auto w-[62%] max-w-[210px] text-gold-frame"
            : "cover-monogram text-gold-frame"
        }
      />

      <p className={`text-sm text-gold-1 khmer-wrap ${compact ? "mt-[6%]" : "mt-10"}`}>
        {wedding.subtitle}
      </p>

      <p
        className={`${compact ? "mt-[3%] text-base" : "mt-4 text-xl"} font-semibold text-heading ${
          /*
           * `break-words` on the Latin branch: a long single surname is wider
           * than the card inside the envelope, and without it the name simply
           * runs off the paper and is cut by the card's own overflow. Khmer
           * takes `khmer-wrap` instead, which breaks between clusters and never
           * inside one.
           */
          name.latin ? "uppercase tracking-[0.08em] break-words" : "khmer-wrap"
        }`}
      >
        {name.text}
      </p>

      {action}
    </div>
  );
}
