import type { FrameConfig } from "@/lib/frame";
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
  if (frame.layout === "corner") return <CornerFrame src={frame.cornerSrc} />;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col text-gold-frame"
      aria-hidden="true"
    >
      {frame.art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={frame.topSrc} alt="" className="w-full shrink-0 select-none" />
      ) : (
        <OrnamentBand motif={frame.motif} className="w-full shrink-0" />
      )}

      <div
        className={`mx-[1.6%] min-h-0 flex-1 ${frame.sideRules ? "border-x border-gold-frame/35" : ""}`}
      />

      {frame.art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame.bottomSrc}
          alt=""
          className={`w-full shrink-0 select-none ${frame.mirrorBottom ? "-scale-y-100" : ""}`}
        />
      ) : (
        <OrnamentBand motif={frame.motif} flip className="w-full shrink-0" />
      )}
    </div>
  );
}

/** One ornament, mirrored into each corner. */
function CornerFrame({ src }: { src: string }) {
  if (!src) return null;
  const common = "absolute w-[46%] select-none";
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element */}
      <img src={src} alt="" className={`${common} left-0 top-0`} />
      <img src={src} alt="" className={`${common} right-0 top-0 -scale-x-100`} />
      <img src={src} alt="" className={`${common} bottom-0 left-0 -scale-y-100`} />
      <img src={src} alt="" className={`${common} bottom-0 right-0 -scale-100`} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
