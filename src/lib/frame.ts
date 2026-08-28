import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import type { BandMotif } from "@/components/ui/OrnamentBand";

type BuiltinArt =
  | { layout: "corner"; corner: string }
  | { layout: "band"; top: string; bottom: string };

/** Built-in frames that are artwork rather than a generated band. */
export const BUILTIN_ART: Record<string, BuiltinArt> = {
  kbach: {
    layout: "band",
    top: "/frames/kbach-top.png",
    bottom: "/frames/kbach-bottom.png",
  },
  royal: {
    layout: "corner",
    corner: "/frames/royal-corner.png",
  },
  "royal-light": {
    layout: "corner",
    corner: "/frames/royal-light-corner.png",
  },
};

/** The corner-art frames, for the admin preview. */
export const CORNER_ART: Record<string, string> = Object.fromEntries(
  Object.entries(BUILTIN_ART)
    .filter(([, art]) => art.layout === "corner")
    .map(([key, art]) => [key, (art as { corner: string }).corner]),
);

/** Every built-in frame's artwork, keyed by motif, for the admin preview. */
export const BUILTIN_BAND_ART: Record<string, { top: string; bottom: string }> =
  Object.fromEntries(
    Object.entries(BUILTIN_ART)
      .filter(([, art]) => art.layout === "band")
      .map(([key, art]) => [key, art as { top: string; bottom: string }]),
  );

/**
 * Everything the card frame needs, resolved from the wedding record once so
 * both the cover and the scrolling card draw exactly the same thing.
 *
 * Two layouts: a band across the head and foot, or a piece of artwork mirrored
 * into all four corners.
 */
export type FrameConfig = {
  layout: "band" | "corner";
  /** Corner layout: the artwork, mirrored into the other three corners. */
  cornerSrc: string;
  /** Band layout: artwork for the head, and for the foot. */
  topSrc: string;
  bottomSrc: string;
  mirrorBottom: boolean;
  sideRules: boolean;
  motif: BandMotif;
  /** True when the frame is drawn from artwork rather than the generated band. */
  art: boolean;
  /** Recolour the artwork to the title colour, keeping its relief. */
  tint: boolean;
  /** Hold the frame on screen and scroll the invitation inside it. */
  sticky: boolean;
  /** Artwork size as a percentage of the card's width. */
  scale: number;
};

export function frameConfig(wedding: Wedding): FrameConfig {
  const uploadedTop = mediaSrc(wedding.frameTopMediaId, wedding.frameTopUrl);
  const uploadedBottom = mediaSrc(wedding.frameBottomMediaId, wedding.frameBottomUrl);

  // A custom frame only takes effect once there is actually something to draw,
  // so a half-finished upload never leaves the card with no frame at all.
  const custom = wedding.frameSource === "custom" && Boolean(uploadedTop);
  const builtin = custom ? undefined : BUILTIN_ART[wedding.frameMotif];

  const layout: "band" | "corner" = custom
    ? wedding.frameLayout === "corner"
      ? "corner"
      : "band"
    : (builtin?.layout ?? "band");

  const topSrc = custom ? uploadedTop : builtin?.layout === "band" ? builtin.top : "";
  const bottomSrc = custom
    ? uploadedBottom || uploadedTop
    : builtin?.layout === "band"
      ? builtin.bottom
      : "";

  return {
    layout,
    cornerSrc: custom ? uploadedTop : builtin?.layout === "corner" ? builtin.corner : "",
    topSrc,
    bottomSrc,
    // Built-in bands ship their own foot artwork, so nothing is mirrored.
    mirrorBottom: custom ? !uploadedBottom && wedding.frameMirrorBottom : false,
    // Artwork carries its own edge run; a rule between would fight it.
    sideRules: layout === "band" && !builtin && !custom && wedding.frameSideRules,
    motif: (wedding.frameMotif as BandMotif) ?? "lotus",
    art: custom || Boolean(builtin),
    // Only artwork needs tinting; the generated bands already use the theme.
    tint: wedding.frameTint && (custom || Boolean(builtin)),
    sticky: wedding.frameSticky,
    scale: Math.min(100, Math.max(30, wedding.frameScale)),
  };
}
