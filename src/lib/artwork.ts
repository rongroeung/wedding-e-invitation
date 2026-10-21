import { backdropPreset } from "@/lib/backgrounds";
import type { Wedding } from "@/lib/db/schema";

/**
 * The couple's own artwork, resolved once.
 *
 * Four surfaces can now carry an upload — the envelope's paper, the curtain
 * panels, the page behind everything and the card's own stock — and each of
 * them is read in at least two places: the guest's invitation, and the
 * dashboard preview that promises what the guest will see. Resolving the same
 * record twice is how those two drift apart, and this project has already paid
 * for that once (the upload validator that existed in two files and disagreed
 * with itself). So every question about artwork is answered here.
 *
 * Everything returns `null` when nothing is uploaded, and every caller is
 * written so that `null` means "draw what you drew before". That is the whole
 * safety property of this feature: an invitation with no uploads is not taking
 * a different code path with the same result, it is taking the same code path.
 */

/** How a picture is fitted to a surface that is not its own shape. */
export type Fit = "cover" | "contain" | "tile" | "stretch";

/** A media row, as a URL the browser can fetch. */
export function mediaSrc(id: string | null | undefined): string {
  return id ? `/api/media/${id}` : "";
}

/**
 * `fit` as SVG's `preserveAspectRatio`.
 *
 * `slice` crops to fill and `meet` letterboxes to fit — the same two choices
 * CSS spells `cover` and `contain`. There is no SVG equivalent of `tile`, so a
 * surface drawn in SVG does not offer it.
 */
export function svgFit(fit: string): string {
  if (fit === "contain") return "xMidYMid meet";
  if (fit === "stretch") return "none";
  return "xMidYMid slice";
}

/** `fit` as the CSS background triple. */
export function cssFit(fit: string): { size: string; repeat: string; position: string } {
  if (fit === "tile") return { size: "auto", repeat: "repeat", position: "top left" };
  if (fit === "contain") return { size: "contain", repeat: "no-repeat", position: "center" };
  if (fit === "stretch") return { size: "100% 100%", repeat: "no-repeat", position: "center" };
  return { size: "cover", repeat: "no-repeat", position: "center" };
}

export type EnvelopeFace = {
  src: string;
  /** For the `<image>` inside the envelope's own coordinate space. */
  preserveAspectRatio: string;
  /** 0–1: how much of the paper colour is laid back over the picture. */
  scrim: number;
  /** Whether the gilt frame and the blind emboss are still struck over it. */
  ornament: boolean;
};

export function envelopeFace(wedding: Wedding): EnvelopeFace | null {
  const src = mediaSrc(wedding.envelopeFaceMediaId);
  if (!src) return null;
  return {
    src,
    preserveAspectRatio: svgFit(wedding.envelopeFaceFit),
    scrim: clamp01(wedding.envelopeFaceScrim),
    ornament: wedding.envelopeFaceOrnament,
  };
}

export type CurtainSkin = {
  src: string;
  kind: "image" | "video";
  /** The frame shown while a film loads, and instead of it if it will not. */
  poster: string;
  /** CSS `object-fit`; `tile` is served by a repeating background instead. */
  fit: Fit;
  /** Whether the drawn folds are blended over it as light and shade. */
  folds: boolean;
  /** 0–1: how strongly. */
  shade: number;
};

export function curtainSkin(wedding: Wedding): CurtainSkin | null {
  const src = mediaSrc(wedding.curtainMediaId);
  if (!src) return null;
  return {
    src,
    kind: wedding.curtainMediaKind === "video" ? "video" : "image",
    poster: mediaSrc(wedding.curtainPosterId),
    fit: (wedding.curtainFit as Fit) ?? "cover",
    folds: wedding.curtainFolds,
    shade: clamp01(wedding.curtainShade),
  };
}

/** `tile` is the on-screen size of one repeat, for a built-in design. */
export type Backdrop = { src: string; fit: Fit; scrim: number; tile?: string };

/**
 * An upload first; otherwise the chosen built-in design, laid the way that
 * design is meant to be laid (a repeat at its own size, or one picture across
 * the surface); otherwise nothing.
 */
function backdropOf(mediaId: string | null, preset: string, fit: string, scrim: number): Backdrop | null {
  const src = mediaSrc(mediaId);
  if (src) return { src, fit: (fit as Fit) ?? "cover", scrim: clamp01(scrim) };
  const design = backdropPreset(preset);
  if (!design) return null;
  return { src: design.src, fit: design.fit, scrim: clamp01(scrim), tile: design.tile };
}

export function pageBackdrop(wedding: Wedding): Backdrop | null {
  return backdropOf(wedding.pageBgMediaId, wedding.pageBgPreset, wedding.pageBgFit, wedding.pageBgScrim);
}

export function cardBackdrop(wedding: Wedding): Backdrop | null {
  return backdropOf(wedding.cardBgMediaId, wedding.cardBgPreset, wedding.cardBgFit, wedding.cardBgScrim);
}

/**
 * One backdrop as the custom properties a stylesheet consumes.
 *
 * Two layers: the couple's picture, and a flat wash of the surface's own colour
 * over it. A wash rather than `opacity`, and the difference is not cosmetic —
 * lowering a picture's opacity lets whatever is behind *the whole element*
 * through, which for the card is the room and for the room is the browser's own
 * canvas. A half-strength photograph on the card would then be sitting on the
 * room rather than on the paper. A gradient of the paper's own colour
 * composites against the paper and nothing else.
 *
 * Both stops of that gradient are the same colour: CSS has no flat-colour image
 * type, and a background layer has to be an image.
 *
 * Written as CSS text rather than as a React style object on purpose. These go
 * into a `<style>` block, where a `url("…")` can carry the double quotes that
 * an inline `style` attribute would end the attribute on.
 */
export function backdropVars(
  name: "page" | "card",
  backdrop: Backdrop | null,
  /** The `r g b` triple of the colour being washed over the picture. */
  groundRgb: string,
): string {
  if (!backdrop) return "";
  const fitted = cssFit(backdrop.fit);
  const { repeat, position } = fitted;
  const size = backdrop.tile && backdrop.fit === "tile" ? backdrop.tile : fitted.size;
  const wash = `linear-gradient(rgb(${groundRgb} / ${backdrop.scrim}), rgb(${groundRgb} / ${backdrop.scrim}))`;
  return [
    `--${name}-bg:${wash}, url("${backdrop.src}");`,
    `--${name}-bg-size:auto, ${size};`,
    `--${name}-bg-repeat:repeat, ${repeat};`,
    `--${name}-bg-position:center, ${position};`,
  ].join("");
}

/** A 0–100 admin figure as a 0–1 fraction, whatever was actually stored. */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value)) / 100;
}
