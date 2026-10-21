import { useId } from "react";
import type { EnvelopeFace } from "@/lib/artwork";
import { Monogram } from "@/components/ui/Monogram";
import { NameLogo } from "@/components/ui/NameLogo";
import { Flourish } from "@/components/ui/Ornaments";
import { WaxSeal } from "./WaxSeal";

/**
 * The envelope, built as one small physical scene.
 *
 * Everything lives in a single `preserve-3d` world with real depth, so what is
 * in front of what is decided by geometry, not by `z-index`:
 *
 *   z = 0   rear panel (its inside is what shows when the flap is open)
 *   z = 1   the invitation card, inside the pocket
 *   z = 3   the pocket: left and right folds under the bottom fold
 *   z = 4   the closing flap, while it is closed
 *   z = 6   the wax seal
 *
 * **The flap's hinge axis sits at z = 1.5**, between the card and the pocket.
 * A 180° turn about an axis offset like that carries the flap from z = 4 to
 * z = −1: it starts in front of the pocket and finishes behind the card, and it
 * crosses the card exactly when a real flap would — past upright — because that
 * is simply where the geometry puts it. The old build faked this with a
 * `z-index` swap on a timer.
 *
 * **The lining is the flap's other face**, turned with `rotateY(180°)` inside
 * the same hinge. The old lining was turned with `rotateX(180°)` about its own
 * centre, which mirrored it top-to-bottom a second time: the open flap hung
 * point-down above the envelope, detached from its hinge. A face flipped about
 * the vertical axis is the same shape (the flap is symmetrical) facing the
 * other way, and it stays attached along the top edge throughout the turn.
 *
 * Geometry is HTML with `clip-path` polygons in percentages, so it scales as
 * one piece; SVG is used only for the hairline contours and the gold foil.
 * Every shade and highlight answers one key light, from the upper left.
 *
 * Nothing in the world carries `filter`, `opacity`, `overflow` or `clip-path`
 * on an element that has 3D children — any of those flattens the scene. They
 * are only ever on leaves.
 */

type Pt = [number, number];

const poly = (pts: Pt[]) =>
  `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ")})`;
const line = (pts: Pt[]) => pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

/** Points along a gently bowed edge from `a` to `b`. `bow` > 0 bulges to the
 *  right of travel. */
function bowed(a: Pt, b: Pt, bow: number, n = 18): Pt[] {
  const [x0, y0] = a;
  const [x1, y1] = b;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dy / len;
  const ny = -dx / len;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const k = Math.sin(t * Math.PI) * bow;
    out.push([x0 + dx * t + nx * k, y0 + dy * t + ny * k]);
  }
  return out;
}

/** A small rounded point between two edges, so no fold ends in a needle. */
function tip(c: Pt, r: number, from: number, to: number, n = 6): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i += 1) {
    const a = from + ((to - from) * i) / n;
    out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
  }
  return out;
}

/* ── The flap, in its own box (full width, FLAP_H of the envelope) ───────── */
const FLAP_H = 58; // % of the envelope's height
const FLAP: Pt[] = [
  [0, 0],
  [100, 0],
  ...bowed([100, 0], [52.6, 95.2], 2.6).slice(1, -1),
  ...tip([50, 94], 3.2, Math.PI * 0.2, Math.PI * 0.8),
  ...bowed([47.4, 95.2], [0, 0], 2.6).slice(1, -1),
];
/* The gold foil follows the edge, a little inside it. */
const FOIL: Pt[] = [
  [3.2, 3.6],
  [96.8, 3.6],
  ...bowed([96.8, 3.6], [51.9, 88.6], 2.3).slice(1, -1),
  ...tip([50, 87.4], 2.6, Math.PI * 0.2, Math.PI * 0.8),
  ...bowed([48.1, 88.6], [3.2, 3.6], 2.3).slice(1, -1),
  [3.2, 3.6],
];

/* ── The pocket, in the envelope's own box ───────────────────────────────── */
const LEFT: Pt[] = [
  [0, 0.4],
  ...bowed([0, 0.4], [48.2, 51.4], -1.8).slice(1, -1),
  ...tip([47.9, 52.6], 1.3, -Math.PI * 0.42, Math.PI * 0.42),
  ...bowed([48.2, 53.8], [0, 99.6], -1.8).slice(1, -1),
  [0, 99.6],
];
const RIGHT: Pt[] = LEFT.map(([x, y]) => [100 - x, y] as Pt).reverse();
const BOTTOM: Pt[] = [
  [0, 100],
  ...bowed([0, 100], [48.6, 46.4], 1.4).slice(1, -1),
  ...tip([50, 45.4], 1.6, Math.PI * 1.2, Math.PI * 1.8),
  ...bowed([51.4, 46.4], [100, 100], 1.4).slice(1, -1),
  [100, 100],
];
/* The visible free edges, for the hairlines. */
const EDGE_BOTTOM_L = BOTTOM.slice(0, Math.ceil(BOTTOM.length / 2));
const EDGE_BOTTOM_R = BOTTOM.slice(Math.floor(BOTTOM.length / 2));
const EDGE_LEFT_TOP = LEFT.slice(0, 22);
const EDGE_RIGHT_TOP = RIGHT.slice(-22);

export type EnvelopePhase = {
  /** The seal is pressed against the paper. */
  pressed: boolean;
  /** The seal has been lifted and is being taken away. */
  lifted: boolean;
  /** The flap is turning back on its hinge. */
  flapOpen: boolean;
  /** The card is being drawn out of the pocket. */
  cardOut: boolean;
  /** The envelope drops away; the card comes toward the camera. */
  lowered: boolean;
};

export function Envelope({
  envelope,
  phase,
  face,
  groom,
  bride,
  monogramFont,
  monogramText,
  flapMark = "namelogo",
  sealText,
  cardLines,
}: {
  envelope: { showSeal: boolean };
  phase: EnvelopePhase;
  /** The couple's own picture on the paper, or `null` for the plain stock. */
  face: EnvelopeFace | null;
  groom: string;
  bride: string;
  monogramFont?: string | null;
  /** The couple's initials monogram, for a flap set to show it. */
  monogramText?: string;
  /**
   * What is foil-stamped on the flap, chosen in the dashboard: the couple's
   * full name mark (the same `NameLogo` as the card and the cover), or the
   * initials monogram. A monogram with no initials entered falls back to the
   * name mark rather than leaving the flap blank.
   */
  flapMark?: "namelogo" | "monogram";
  /** The couple's own words for the seal; empty for the pressed crest. */
  sealText: string;
  /** What is printed on the card. */
  cardLines: { lead: string; title: string };
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ornament = face ? face.ornament : true;
  const art = face
    ? ({
        ["--pe-art" as string]: `url("${face.src.replace(/"/g, "%22")}")`,
        ["--pe-art-scrim" as string]: String(face.scrim),
      } as React.CSSProperties)
    : undefined;

  const state = [
    "pe",
    phase.pressed ? "pe-pressed" : "",
    phase.lifted ? "pe-lifted" : "",
    phase.flapOpen ? "pe-open" : "",
    phase.cardOut ? "pe-card-out" : "",
    phase.lowered ? "pe-lowered" : "",
    face ? "pe-has-art" : "",
  ].join(" ");

  return (
    <div className={state} data-phase={phaseName(phase)} style={art}>
      <div className="pe-world">
        {/* the envelope's shadow on the table */}
        <span className="pe-table-shadow" aria-hidden="true" />

        <div className="pe-body">
          {/* ── z 0 · the rear panel and its inside ─────────────────────── */}
          <div className="pe-back" aria-hidden="true">
            <span className="pe-back-inside" />
            <span className="pe-hinge" />
          </div>

          {/* ── z 3 · the pocket ────────────────────────────────────────── */}
          <div className="pe-pocket" aria-hidden="true">
            <div className="pe-fold-wrap">
              <span className="pe-fold pe-fold-left" style={{ clipPath: poly(LEFT) }} />
            </div>
            <div className="pe-fold-wrap">
              <span className="pe-fold pe-fold-right" style={{ clipPath: poly(RIGHT) }} />
            </div>
            <div className="pe-fold-wrap pe-fold-wrap-bottom">
              <span className="pe-fold pe-fold-bottom" style={{ clipPath: poly(BOTTOM) }} />
            </div>
            <svg className="pe-contours" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* edges that face the light catch it; edges that face away
                  are a shade darker — nothing here is an outline */}
              <polyline points={line(EDGE_RIGHT_TOP)} className="pe-edge-lit" />
              <polyline points={line(EDGE_BOTTOM_L)} className="pe-edge-lit" />
              <polyline points={line(EDGE_LEFT_TOP)} className="pe-edge-soft" />
              <polyline points={line(EDGE_BOTTOM_R)} className="pe-edge-dark" />
            </svg>
            {/* the flap's shadow on the pocket, while the flap is down */}
            <div className="pe-flap-shade-wrap">
              <span className="pe-flap-shade" style={{ clipPath: poly(FLAP) }} />
            </div>
          </div>

          {/* ── z 4 → −1 · the flap, two faces on one hinge ─────────────── */}
          <div className="pe-flap" aria-hidden="true">
            <div className="pe-flap-out" style={{ clipPath: poly(FLAP) }}>
              <svg className="pe-flap-edge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={line(FLAP.slice(2))} />
              </svg>
              {ornament && (
                <>
                  <svg className="pe-foil" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`foil-${id}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#f3e3c0" />
                        <stop offset="0.28" stopColor="#c9a96e" />
                        <stop offset="0.55" stopColor="#8f7140" />
                        <stop offset="0.78" stopColor="#d9bf8a" />
                        <stop offset="1" stopColor="#9c7c45" />
                      </linearGradient>
                    </defs>
                    <polyline points={line(FOIL)} stroke={`url(#foil-${id})`} />
                  </svg>
                  {/*
                    * The couple's name mark — the very component the card
                    * and the cover draw — foil-stamped on the flap. It is a
                    * child of the flap's outer face, so it turns with the
                    * flap and goes with its back face past 90°.
                    */}
                  {flapMark === "monogram" && monogramText?.trim() ? (
                    <div className="pe-flap-mono">
                      <Monogram
                        text={monogramText}
                        groom={groom}
                        bride={bride}
                        font={monogramFont ?? undefined}
                        play={false}
                        className="h-auto w-full text-gold-frame"
                      />
                    </div>
                  ) : (
                    <div className="pe-flap-names">
                      <NameLogo groom={groom} bride={bride} font={monogramFont} state="still" className="pe-flap-logo" />
                    </div>
                  )}
                  {/* the kit's medallion, printed under the mark */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={`pe-flap-flourish kit-only-vintage-flourish ${
                      flapMark === "monogram" && monogramText?.trim() ? "pe-flap-flourish-mono" : ""
                    }`}
                    src="/kit/flourish/medallion.svg"
                    alt=""
                    draggable={false}
                  />
                  {/* a generated kit's medallion, in foil (lib/designKit) */}
                  <span
                    className={`pe-flap-flourish pe-flap-kitmark kit-generated ${
                      flapMark === "monogram" && monogramText?.trim() ? "pe-flap-flourish-mono" : ""
                    }`}
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
            <div className="pe-flap-in" style={{ clipPath: poly(FLAP) }}>
              <svg className="pe-lining-rule" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points={line(FOIL)} />
              </svg>
            </div>
          </div>
        </div>

        {/* ── z 1 · the card. Not inside the body, so the envelope can drop
            away while the card stays; still in the same 3D world, so the
            pocket hides it until it is drawn out. ───────────────────────── */}
        <div className="pe-card" aria-hidden="true">
          <div className="pe-card-face">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Flourish role="crest" className="pe-card-crest" />
            {cardLines.title && <p className="pe-card-title khmer-wrap">{cardLines.title}</p>}
            <NameLogo groom={groom} bride={bride} font={monogramFont} state="still" className="pe-card-names" />
            {cardLines.lead && <p className="pe-card-lead khmer-wrap">{cardLines.lead}</p>}
          </div>
        </div>

        {/* ── z 6 · the seal, and the shadow it throws on the flap ────────── */}
        {envelope.showSeal && (
          <>
            <span className="pe-seal-shadow" aria-hidden="true" />
            <div className="pe-seal" aria-hidden="true">
              <WaxSeal text={sealText} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** For `?diag=1` and the tests: which beat the drawing is in. */
function phaseName(p: EnvelopePhase) {
  if (p.lowered) return "lowered";
  if (p.cardOut) return "card";
  if (p.flapOpen) return "flap";
  if (p.lifted) return "lifted";
  if (p.pressed) return "pressed";
  return "closed";
}

export const FLAP_HEIGHT = FLAP_H;
