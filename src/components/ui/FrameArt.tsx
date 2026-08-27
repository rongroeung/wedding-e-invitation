import type { CSSProperties } from "react";

/**
 * A piece of frame artwork, optionally recoloured to the title colour.
 *
 * Tinting lays the theme colour down through the artwork's alpha and draws the
 * artwork back over it in luminosity, so the gold's highlights and shadows
 * survive the change of hue. Untinted, it is just the image.
 */
export function FrameArt({
  src,
  className = "",
  tint = false,
  flip = false,
}: {
  src: string;
  className?: string;
  tint?: boolean;
  flip?: boolean;
}) {
  const flipClass = flip ? "-scale-y-100" : "";

  if (!tint) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${className} ${flipClass} select-none`} />;
  }

  return (
    <span
      className={`frame-tint ${className} ${flipClass}`}
      style={{ "--frame-art": `url(${src})` } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full select-none" />
    </span>
  );
}
