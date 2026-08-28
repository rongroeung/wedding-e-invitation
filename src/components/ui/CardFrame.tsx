import type { FrameConfig } from "@/lib/frame";
import { FrameArt } from "./FrameArt";
import { OrnamentBand } from "./OrnamentBand";

/**
 * One edge of the card's frame — the head or the foot.
 *
 * The frame is structural rather than an overlay: it sits above and below the
 * scrolling content instead of floating over it. That is what lets the frame
 * stay put on screen while the invitation scrolls between its edges, and it
 * means content can never pass beneath the ornament and show through its gaps.
 *
 * A band frame is one wide piece per edge. A corner frame is two pieces per
 * edge, mirrored, with the gap between them left open.
 */
export function FrameEdge({
  frame,
  edge,
}: {
  frame: FrameConfig;
  edge: "top" | "bottom";
}) {
  const bottom = edge === "bottom";
  // The artwork scales with the card's width, so one percentage governs both
  // how wide it draws and — the aspect ratio being fixed — how much height it
  // takes from the invitation.
  const scale = frame.scale / 100;

  if (frame.layout === "corner") {
    if (!frame.cornerSrc) return null;
    return (
      <div
        className="pointer-events-none relative flex w-full shrink-0 justify-between"
        aria-hidden="true"
      >
        <FrameArt
          src={frame.cornerSrc}
          tint={frame.tint}
          style={{ width: `${46 * scale}%` }}
          className={bottom ? "-scale-y-100" : ""}
        />
        <FrameArt
          src={frame.cornerSrc}
          tint={frame.tint}
          style={{ width: `${46 * scale}%` }}
          className={bottom ? "-scale-100" : "-scale-x-100"}
        />
      </div>
    );
  }

  // A generated band is built around a centre motif, so it scales about the
  // centre.
  if (!frame.art) {
    return (
      <div
        className="pointer-events-none flex w-full shrink-0 justify-center text-gold-frame"
        aria-hidden="true"
      >
        <OrnamentBand motif={frame.motif} flip={bottom} style={{ width: `${frame.scale}%` }} />
      </div>
    );
  }

  /*
   * Band artwork is drawn in halves anchored to the card's edges rather than
   * scaled about the centre. Scaling a whole band pulls its corner ornaments
   * inward and leaves the card's own corners bare, which stops reading as a
   * frame. Each half is a window onto the scaled artwork, so the ornaments stay
   * in the corners at any size and only the quiet middle opens up. At 100% the
   * halves meet and reassemble the band exactly.
   *
   * The window is scale/2 of the card and the artwork is scale of the card, so
   * within the window the artwork is always exactly 200% — the ratio does not
   * depend on the scale.
   */
  const src = bottom ? frame.bottomSrc : frame.topSrc;
  const flip = bottom && frame.mirrorBottom;
  const half = { width: `${frame.scale / 2}%` };
  const art = { width: "200%", maxWidth: "none" };

  return (
    <div
      className="pointer-events-none flex w-full shrink-0 justify-between text-gold-frame"
      aria-hidden="true"
    >
      <span className="overflow-hidden" style={half}>
        <FrameArt src={src} tint={frame.tint} flip={flip} style={art} className="block" />
      </span>
      <span className="flex justify-end overflow-hidden" style={half}>
        <FrameArt src={src} tint={frame.tint} flip={flip} style={art} className="block" />
      </span>
    </div>
  );
}
