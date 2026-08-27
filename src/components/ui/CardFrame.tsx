import type { FrameConfig } from "@/lib/frame";
import { FrameArt } from "./FrameArt";
import { OrnamentBand } from "./OrnamentBand";

/**
 * The frame around an invitation card, in one of two layouts.
 *
 * **Corner** mirrors one piece of artwork into all four corners.
 *
 * **Band** crowns the head and foot and joins them with hairline rules. It is
 * laid out as a flex column so the rules simply fill whatever space the bands
 * leave — which means artwork of any height lines up without the app having to
 * know its dimensions.
 */
export function CardFrame({ frame }: { frame: FrameConfig }) {
  if (frame.layout === "corner") return <CornerFrame src={frame.cornerSrc} tint={frame.tint} />;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col text-gold-frame"
      aria-hidden="true"
    >
      {frame.art ? (
        <FrameArt src={frame.topSrc} tint={frame.tint} className="w-full shrink-0" />
      ) : (
        <OrnamentBand motif={frame.motif} className="w-full shrink-0" />
      )}

      <div
        className={`mx-[1.6%] min-h-0 flex-1 ${frame.sideRules ? "border-x border-gold-frame/35" : ""}`}
      />

      {frame.art ? (
        <FrameArt
          src={frame.bottomSrc}
          tint={frame.tint}
          flip={frame.mirrorBottom}
          className="w-full shrink-0"
        />
      ) : (
        <OrnamentBand motif={frame.motif} flip className="w-full shrink-0" />
      )}
    </div>
  );
}

/** One ornament, mirrored into each corner. */
function CornerFrame({ src, tint }: { src: string; tint: boolean }) {
  if (!src) return null;
  const common = "absolute w-[46%]";
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <FrameArt src={src} tint={tint} className={`${common} left-0 top-0`} />
      <FrameArt src={src} tint={tint} className={`${common} right-0 top-0 -scale-x-100`} />
      <FrameArt src={src} tint={tint} className={`${common} bottom-0 left-0 -scale-y-100`} />
      <FrameArt src={src} tint={tint} className={`${common} bottom-0 right-0 -scale-100`} />
    </div>
  );
}
