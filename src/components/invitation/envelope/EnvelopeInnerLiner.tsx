/**
 * The lining — the paper you see inside the envelope once the flap is back.
 *
 * Lined envelopes are one of the quiet marks of expensive stationery, and the
 * lining is never the same sheet as the outside: it is a shade deeper, and it
 * carries a pattern the outside does not. Here that pattern is Khmer kbach in
 * ivory-on-ivory — tonal, not gold — so it reads as a texture pressed into the
 * paper rather than as printing, and it only really appears where the light
 * rakes across it.
 *
 * It also does the work of hiding the card. Sitting between the invitation and
 * the pocket, it means the card can wait completely out of sight and then rise
 * — instead of being visible through the envelope's mouth from the start,
 * which would give away the one surprise the envelope has to offer.
 */
export function EnvelopeInnerLiner({ dim, mouthOpen }: { dim: boolean; mouthOpen: boolean }) {
  return (
    <div
      className="env-layer env-liner env-fade"
      /*
       * 8px, not the 18 it stood at when this envelope had a pocket. There the
       * lining had to be in *front* of the card so the card could wait unseen
       * and rise up behind it; in a gatefold the card lies on the lining, so
       * the lining is the backmost thing inside the envelope. Left at 18 it
       * painted over the card and over both front panels, and the whole
       * envelope came out as a flat pink rectangle.
       */
      style={{ transform: "translateZ(8px)", opacity: dim ? 0 : 1 }}
      aria-hidden="true"
    >
      <span className={`env-mouth ${mouthOpen ? "env-mouth-open" : ""}`} />
    </div>
  );
}
