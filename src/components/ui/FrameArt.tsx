import type { CSSProperties } from "react";

/**
 * A piece of frame artwork, printed onto the card.
 *
 * The invitation is stationery, not a screen saver: this renders once, in its
 * finished state, and never moves again. What remains is what a print shop
 * would give you — relief and metal, both static.
 *
 *   • **Relief.** Two `drop-shadow` passes, dark below and light above, give
 *     the ornament a lit edge and a shadow where it meets the paper. Both
 *     follow the artwork's own alpha, so the relief traces every curl of the
 *     kbach rather than sitting in a box behind it.
 *   • **Metal.** Tinting lays the theme colour through the alpha and draws the
 *     artwork back in luminosity, so a recoloured frame keeps the highlights
 *     and shadows the gold was photographed with.
 *
 * There is no reveal, no sweep and no pointer response. Those lived here once;
 * they are gone, not merely switched off.
 */
export function FrameArt({
  src,
  className = "",
  tint = false,
  flip = false,
  emboss = false,
  depth = 0.55,
  style,
}: {
  src: string;
  className?: string;
  tint?: boolean;
  flip?: boolean;
  emboss?: boolean;
  depth?: number;
  style?: CSSProperties;
}) {
  const flipClass = flip ? "-scale-y-100" : "";
  const vars = {
    ...style,
    "--frame-art": `url(${src})`,
    // A hair under a pixel at rest; foil is pressed, not moulded.
    "--frame-emb": `${(0.45 + depth * 1.15).toFixed(2)}px`,
  } as CSSProperties;

  const inner = tint ? (
    <span className="frame-tint block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full select-none" />
    </span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full select-none" />
  );

  return (
    <span
      /*
       * `shrink-0` matters more than it looks. A band edge lays its second
       * half inside a flex box, and this wrapper's min-content width comes
       * from an image set to 100% of it — which is zero. Left to shrink, that
       * half collapses to half its width and the frame comes out lopsided.
       * (An <img> flex item held its own size here; a wrapper does not.)
       */
      className={`frame-art shrink-0 ${emboss ? "frame-emboss" : ""} ${className} ${flipClass}`}
      style={vars}
    >
      {inner}
    </span>
  );
}
