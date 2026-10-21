import type { FrameConfig } from "@/lib/frame";
import { FrameArt } from "./FrameArt";
import { Flourish } from "./Ornaments";

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
  const foil = { emboss: frame.emboss, depth: frame.depth };

  /*
   * The botanical suites' own corners (scripts/botanical-art.py), always in
   * the markup and shown only while a suite's paper is chosen — the paper is
   * the guest's choice and changes without a render, so CSS decides
   * (paperThemes.ts, the composed papers). Each corner is its own drawing,
   * mirrored in the SVG, so nothing here is flipped.
   */
  const suite = frame.custom ? null : (
    <>
      <span className={`bt-frame bt-corner ${bottom ? "bt-bl" : "bt-tl"}`} />
      <span className={`bt-frame bt-corner ${bottom ? "bt-br" : "bt-tr"}`} />
    </>
  );
  const hasBt = frame.custom ? "" : "has-bt";

  /*
   * What joins the corners to one another: a hairline from each piece meeting
   * a fleuron at the centre. It is what stops four ornaments reading as four
   * unrelated pictures, and it fills the gap the band leaves when the frame is
   * scaled below full width. Printed, like the rest of it — it does not draw
   * itself on.
   */
  const join = (
    <span
      className="frame-join pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center justify-center gap-[0.55rem] text-gold-frame"
      style={{
        // a band's hairline starts past its scaled half; a corner's runs on
        // from the tip of the corner's own horizontal stroke. Corners are
        // capped by the screen's height as well as the card's width, so a
        // wide card does not hand half its height to the frame.
        paddingInline:
          frame.layout === "corner"
            ? `calc(min(${(frame.cornerWidth * frame.scale) / 100}%, 17dvh) - 0.6%)`
            : `${frame.scale / 2 + 1}%`,
        // the corner's own run, mirrored for the foot
        top: `${(bottom ? 1 - frame.joinY : frame.joinY) * 100}%`,
      }}
      aria-hidden="true"
    >
      <span className="frame-rule frame-rule-left h-px flex-1" />
      <Flourish
        role="fleuron"
        className={`frame-centre w-[clamp(22px,7%,40px)] ${bottom ? "-scale-y-100" : ""}`}
      />
      <span className="frame-rule frame-rule-right h-px flex-1" />
    </span>
  );
  // The artwork scales with the card's width, so one percentage governs both
  // how wide it draws and — the aspect ratio being fixed — how much height it
  // takes from the invitation.
  const scale = frame.scale / 100;

  if (frame.layout === "corner") {
    if (!frame.cornerSrc) return null;
    return (
      <div
        className={`frame-edge ${hasBt} pointer-events-none relative flex w-full shrink-0 justify-between`}
        aria-hidden="true"
      >
        {join}
        {suite}
        <FrameArt
          src={frame.cornerSrc}
          tint={frame.tint}
          {...foil}
          style={{ width: `min(${frame.cornerWidth * scale}%, 17dvh)` }}
          className={bottom ? "-scale-y-100" : "frame-corner-tl"}
        />
        <FrameArt
          src={frame.cornerSrc}
          tint={frame.tint}
          {...foil}
          style={{ width: `min(${frame.cornerWidth * scale}%, 17dvh)` }}
          className={bottom ? "-scale-100 frame-corner-br" : "-scale-x-100"}
        />
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
      className={`frame-edge ${hasBt} pointer-events-none relative flex w-full shrink-0 justify-between text-gold-frame`}
      aria-hidden="true"
    >
      {join}
      {suite}
      <span className="overflow-hidden" style={half}>
        <FrameArt
          src={src}
          tint={frame.tint}
          flip={flip}
          {...foil}
          style={art}
          className="block"
        />
      </span>
      <span className="flex justify-end overflow-hidden" style={half}>
        <FrameArt
          src={src}
          tint={frame.tint}
          flip={flip}
          {...foil}
          style={art}
          className="block"
        />
      </span>
    </div>
  );
}
