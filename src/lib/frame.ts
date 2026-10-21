import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";

type BuiltinArt =
  | {
      layout: "corner";
      corner: string;
      /**
       * Where the corner's own horizontal run meets the edge, as a fraction of
       * its height from the outer edge — the hairline joining the corners is
       * drawn at that height so it continues the ornament instead of crossing
       * it. Defaults to the middle.
       */
      joinY?: number;
      /** What sits at the centre of that hairline. */
      joinMark?: "lotus" | "fleuron";
      /**
       * How wide one corner is at full scale, as a fraction of the card. The
       * flourish corners are open linework rather than a dense block, so they
       * need more width than the royal corners to carry the same weight.
       */
      width?: number;
    }
  | { layout: "band"; top: string; bottom: string };

/** Built-in frames that are artwork rather than a generated band. */
export const BUILTIN_ART: Record<string, BuiltinArt> = {
  kbach: {
    layout: "band",
    top: "/frames/kbach-top.png",
    bottom: "/frames/kbach-bottom.png",
  },
  /*
   * The couple's vintage flourish pack (`design/vintage-flourish/`): its two
   * corner ornaments, each turned to face the top left and mirrored into the
   * other three corners. The acanthus corner is the default frame.
   */
  flourish: {
    layout: "corner",
    corner: "/kit/flourish/corner.svg",
    joinY: 0.05,
    width: 0.42,
    joinMark: "fleuron",
  },
  "flourish-loop": {
    layout: "corner",
    corner: "/kit/flourish/corner-loop.svg",
    joinY: 0.066,
    width: 0.42,
    joinMark: "fleuron",
  },
};

/**
 * Every frame a couple can choose, in the order the dashboard lists them.
 *
 * The one list both the dashboard and the server's validation read, so the
 * two can never disagree about what is allowed — which is exactly what went
 * wrong when the flourish frames were added to the dashboard and not to the
 * server's list, and saving them failed with "Invalid data".
 */
export const FRAME_MOTIFS = ["flourish", "flourish-loop", "kbach"] as const satisfies readonly (keyof typeof BUILTIN_ART)[];
export type FrameMotif = (typeof FRAME_MOTIFS)[number];

export const FRAME_LABELS: Record<FrameMotif, string> = {
  flourish: "ក្បាច់វល្លិបុរាណ",
  "flourish-loop": "ក្បាច់វល្លិបុរាណ (រង្វង់)",
  kbach: "ក្បាច់ខ្មែរមាស",
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
  /** True when the frame is drawn from artwork rather than the generated band. */
  art: boolean;
  /**
   * The couple uploaded their own frame. A botanical paper suite brings its
   * own corners and double rule, but never over a frame the couple made.
   */
  custom: boolean;
  /** Recolour the artwork to the title colour, keeping its relief. */
  tint: boolean;
  /** Hold the frame on screen and scroll the invitation inside it. */
  sticky: boolean;
  /** Artwork size as a percentage of the card's width. */
  scale: number;
  /** Height of the hairline joining the corners, from the outer edge (0–1). */
  joinY: number;
  /** The mark at the centre of that hairline. */
  joinMark: "lotus" | "fleuron";
  /** One corner's width at full scale, as a percentage of the card. */
  cornerWidth: number;

  /* ── Foil treatment ───────────────────────────────────────────────────
     The artwork is a flat picture of gold; these make it read as gold that
     was pressed into the paper. Both are static — the frame is printed
     stationery and printed things do not move. Only artwork can take them: a
     generated band already draws itself in the theme colour. */
  /** Raise the ornament off the paper with a shadow and a lit edge. */
  emboss: boolean;
  /** How far it stands off, 0–1. */
  depth: number;
};

export function frameConfig(wedding: Wedding): FrameConfig {
  const uploadedTop = mediaSrc(wedding.frameTopMediaId, wedding.frameTopUrl);
  const uploadedBottom = mediaSrc(wedding.frameBottomMediaId, wedding.frameBottomUrl);

  // A custom frame only takes effect once there is actually something to draw,
  // so a half-finished upload never leaves the card with no frame at all.
  const custom = wedding.frameSource === "custom" && Boolean(uploadedTop);
  // A frame that is no longer offered (or was never valid) falls back to the
  // default rather than to nothing.
  const builtin = custom ? undefined : (BUILTIN_ART[wedding.frameMotif] ?? BUILTIN_ART.flourish);

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
    art: custom || Boolean(builtin),
    custom,
    // Only artwork needs tinting; the generated bands already use the theme.
    tint: wedding.frameTint && (custom || Boolean(builtin)),
    sticky: wedding.frameSticky,
    scale: Math.min(100, Math.max(30, wedding.frameScale)),
    joinY: builtin?.layout === "corner" ? (builtin.joinY ?? 0.5) : 0.5,
    joinMark: "fleuron",
    cornerWidth: (builtin?.layout === "corner" ? (builtin.width ?? 0.28) : 0.28) * 100,
    // Only artwork can be embossed; the generated bands are drawn in the theme
    // colour and have no relief to catch light on.
    emboss: wedding.frameEmboss && (custom || Boolean(builtin)),
    depth: Math.min(100, Math.max(0, wedding.frameDepth)) / 100,
  };
}
