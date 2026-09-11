"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The velvet curtains that frame the invitation, and part to reveal it.
 *
 * Drawn in SVG rather than built from CSS gradients, and that choice is the
 * whole reason this reads as cloth. A curtain's folds are not parallel stripes:
 * the fabric is gathered tight at the heading and hangs free at the hem, so
 * every fold is *wider at the bottom than at the top* and no two are the same
 * width. A `repeating-linear-gradient` can only give evenly spaced vertical
 * bands of constant width, which is a corrugated iron roof, not a curtain.
 * Here each fold is a real quadrilateral with curved sides, so it can flare.
 *
 * Four things separate this from the pale, smooth version it replaces, and
 * every one of them is a property of *velvet* specifically rather than of
 * draped cloth in general:
 *
 * **The body is dark and the crest is narrow.** Velvet's pile stands on end and
 * absorbs light from almost every angle; it only returns it where the fibres
 * are caught end-on, which is a thin band along the top of each fold. A ramp
 * that spends most of its range in the light half is satin — and that is
 * exactly what the first attempt looked like on a wide screen.
 *
 * **It keeps its hue in shadow.** The dark tones are mixed toward the theme's
 * primary rather than toward black. Velvet in shadow is a deeper version of its
 * own colour; cloth that greys as it darkens is felt.
 *
 * **It has a nap.** Two layers of fractal noise — a fine speckle for the ends
 * of the pile and a stretched vertical grain for the direction it is brushed —
 * laid over the folds in `overlay`, so they lighten the crests and darken the
 * valleys instead of fogging the panel evenly. Without them the folds are clean
 * mathematical gradients and the eye reads plastic.
 *
 * **Its edges glow.** The pile catches light at a grazing angle, so the leading
 * edge goes bright while the face stays deep. Take that away and the same
 * geometry reads as satin again.
 *
 * They part by translating outward *and* compressing horizontally about their
 * outer edge, which is what gathering is: the cloth does not slide away
 * rigidly, it bunches. Because every fold is drawn rather than tiled, the
 * compression narrows all of them together and the folds crowd up at the side
 * exactly as real ones do.
 */

/*
 * Written out in full, for the same reason as the sliding cover's panels:
 * Tailwind scans the source as text and purges any `@layer components` rule
 * whose class name it cannot find, so `curtain-${side}` is never seen and its
 * rule never ships. The curtains would hang without a transform origin and part
 * in the wrong direction, with nothing anywhere reporting a problem.
 */
const PANEL_SIDE = { left: "curtain-left", right: "curtain-right" } as const;

/** One way of gathering the cloth: where the folds are, and how each is lit. */
type FoldSet = {
  seams: number[];
  flare: number[];
  sway: number[];
  crest: number[];
  gain: number[];
};

/**
 * Where the folds meet, as fractions of the panel's width.
 *
 * **Six per panel**, and the number is the difference between cloth and
 * corrugated iron. What matters is not how many folds one panel has but how
 * many cross the screen: two panels of nine put eighteen of them over a phone,
 * one every twenty pixels, and at that pitch the eye stops reading folds of
 * fabric and starts reading a ribbed surface. Nine looked right in isolation —
 * a single panel the full width of the window — and wrong the moment there were
 * two of them, which is the trap. Real curtain folds are roughly a hand's width
 * apart whatever they are hung on.
 *
 * The spacing is hand-set and deliberately uneven: gathered cloth never falls
 * into equal parts, and equal parts are the other half of why the first attempt
 * looked machined. They widen towards the leading edge, which is the part
 * hanging free rather than pulled towards the wall.
 */
const WIDE: FoldSet = {
  seams: [0, 0.135, 0.295, 0.44, 0.6, 0.79, 1],
  /**
   * How far each seam wanders outward between the heading and the hem.
   *
   * Flare is how much *wider* a fold gets on the way down, so it has to stay
   * small: six folds each spreading by eight per cent of the panel add up to a
   * hem half again as wide as the heading, which is cloth cut as a fan rather
   * than hung as a sheet.
   */
  flare: [0, 0.035, 0.058, 0.07, 0.066, 0.04, 0],
  /**
   * How far each fold bows sideways on its way down.
   *
   * Different for every seam, so no two folds hang alike. Hanging cloth sways:
   * a fold whose sides are straight lines from top to bottom is a folded sheet
   * of card.
   */
  sway: [0, 13, -10, 16, -9, 12, 0],
  /**
   * Where the crest of each fold sits, as a fraction across it.
   *
   * Not the same number for all of them. One light crossing a rank of cylinders
   * strikes each at a slightly different angle depending on how far round the
   * curve it stands, so the highlight walks across the panel — near the middle
   * of the folds facing the light and crowded to one side of those turning
   * away. Giving every fold an identical crest is the most common way this
   * effect fails, and it fails by reading as a row of matching tubes.
   */
  crest: [0.46, 0.4, 0.44, 0.36, 0.42, 0.34],
  /**
   * How much light each fold actually catches.
   *
   * The missing ingredient, and the one that separates a photograph of a
   * curtain from a diagram of one. A stage light is a *point* off to the side:
   * the two or three folds turned towards it flare, and the rest sit in their
   * own shade with barely a crest at all. Giving every fold the same crest —
   * which is what one gradient recipe applied six times does — produces a rank
   * of identical lit cylinders, and no amount of wandering the crest *position*
   * fixes it, because the brightness is what the eye reads as lighting.
   *
   * So two folds here are catch-lights and the other four are quiet.
   */
  gain: [0.32, 0.6, 0.28, 0.36, 0.64, 0.3],
};

/**
 * The same cloth on a phone, gathered into four folds instead of six.
 *
 * Not a performance setting — this one is purely about width, and it is the
 * mistake that survived every previous round. A fold is a physical size: about
 * a hand across, whatever it is hung on. On a laptop each panel is five hundred
 * pixels wide and six folds is a hand apiece; on a phone the same panel is a
 * hundred and eighty, the same six folds are thirty pixels each, and a curtain
 * becomes corduroy. It looked right every time it was checked because it was
 * checked one panel at a time, filling the window — and there are always two.
 *
 * Four folds over a hundred and eighty pixels is about forty-five each, which
 * is as close to a hand's width as a phone gets.
 */
const NARROW: FoldSet = {
  seams: [0, 0.2, 0.44, 0.71, 1],
  flare: [0, 0.045, 0.072, 0.055, 0],
  sway: [0, 14, -11, 15, 0],
  crest: [0.46, 0.4, 0.44, 0.36],
  gain: [0.34, 0.62, 0.3, 0.42],
};

/**
 * The cross-section of one fold, as a curve rather than as five stops.
 *
 * Hand-placed stops were the previous approach and they are why the folds read
 * as corduroy: five colours with hard offsets between them make a ridge with a
 * bright wire down the middle, because the ramp jumps a whole tone in the space
 * of a few per cent of the fold's width. Cloth does not do that. The section of
 * a hanging fold is a rounded body with a *soft* peak somewhere on it, and the
 * only honest way to draw it is to evaluate that shape and let the colour
 * follow.
 *
 * Three terms:
 *
 * - `ed`, the seam darkening. Smoothstepped over the outer tenth of the fold,
 *   so the cloth turns back into the valley instead of arriving there.
 * - `body`, a wide Gaussian: the fold's own curvature, most of a tone across
 *   the whole width.
 * - `peak`, a narrow one at the crest, scaled by how much light this
 *   particular fold catches.
 *
 * The result is 0 in the valleys and a little under 1 on a catch-light, which
 * indexes straight into the theme's velvet scale.
 */
function section(t: number, crest: number, gain: number) {
  const d = Math.min(t, 1 - t);
  const e = Math.max(0, Math.min(1, d / 0.1));
  const ed = e * e * (3 - 2 * e);
  const body = 0.34 * Math.exp(-(((t - crest) / 0.46) ** 2));
  const peak = gain * Math.exp(-(((t - crest) / 0.15) ** 2));
  return ed * (body + peak);
}

/** How many tones `ThemeStyle` resamples the velvet into. */
const TONES = 33;

/** The stops of one fold's gradient, with runs of a single tone collapsed. */
function sectionStops(crest: number, gain: number) {
  const steps = 18;
  const out: { at: number; tone: number }[] = [];
  for (let k = 0; k <= steps; k += 1) {
    const at = k / steps;
    const v = section(at, crest, gain);
    const tone = Math.max(0, Math.min(TONES - 1, Math.round(v * (TONES - 1))));
    if (k > 0 && k < steps && out[out.length - 1].tone === tone) continue;
    out.push({ at, tone });
  }
  return out;
}

/**
 * Turbulence into grey, and the one line that decides whether any of this is
 * visible at all.
 *
 * The obvious matrix — flat grey with the noise driving *alpha* — produces
 * nothing. `overlay` treats mid grey as its identity, so a 50% grey laid over
 * anything at any opacity leaves it exactly as it was; all the varying alpha
 * did was vary how much of that nothing was applied. The noise has to drive
 * the **colour**: R goes into all three channels and alpha is held at 1, so the
 * layer is light where the noise is high and dark where it is low, which is
 * what overlay reads.
 *
 * The 1.6 slope and −0.3 offset stretch turbulence's rather timid distribution
 * around its own midpoint: 0.5 stays 0.5, and the tails reach black and white
 * instead of dying out in the middle of the range.
 */
const GRAIN = "1.6 0 0 0 -0.3 1.6 0 0 0 -0.3 1.6 0 0 0 -0.3 0 0 0 0 1";

const W = 500;
const H = 1000;

/**
 * Where the cloth starts.
 *
 * This was 74 — a band across the top where the fabric was gathered into
 * tighter pleats and washed darker, because a pelmet hung over it and a heading
 * in shadow is what a curtain looks like under a board.
 *
 * The pelmet is gone, and the heading went from a detail nobody could see to a
 * hard horizontal seam across the top of the screen: triangular gathers above,
 * hanging folds below, and a straight line where the two met. Asked for a
 * seamless surface, and it is the right ask — without something above it to
 * cast the shadow, a heading is just a join.
 *
 * At 0 the folds run the full height and the cloth is one continuous sheet. The
 * pleat geometry below is kept, unused, for whoever puts a pelmet back.
 */
const HEAD = 0;

/**
 * One fold, as a closed path from the heading down to the hem.
 *
 * Each side is a cubic with its own sway, so the fold narrows and widens on the
 * way down instead of tapering evenly. Fabric hanging under its own weight is
 * never a trapezium.
 */
function seamPath(f: FoldSet, i: number) {
  const top = f.seams[i] * W;
  const bot = (f.seams[i] + f.flare[i]) * W;
  const sway = f.sway[i];
  return `C${(top + sway).toFixed(1)} ${H * 0.38} ${(bot + sway * 0.6).toFixed(1)} ${H * 0.74} ${bot.toFixed(1)} ${H}`;
}

function foldPath(f: FoldSet, i: number) {
  const topR = f.seams[i + 1] * W;
  const botR = (f.seams[i + 1] + f.flare[i + 1]) * W;
  const swayR = f.sway[i + 1];
  return [
    `M${(f.seams[i] * W).toFixed(1)} ${HEAD}`,
    seamPath(f, i),
    `L${botR.toFixed(1)} ${H}`,
    `C${(botR + swayR * 0.6).toFixed(1)} ${H * 0.74} ${(topR + swayR).toFixed(1)} ${H * 0.38} ${topR.toFixed(1)} ${HEAD}`,
    "Z",
  ].join(" ");
}

/** Just the crease between two folds, for drawing the valley on its own. */
function creasePath(f: FoldSet, i: number) {
  return `M${(f.seams[i] * W).toFixed(1)} ${HEAD} ${seamPath(f, i)}`;
}

/** One pleat in the heading, where the cloth is bunched onto the track. */
function pleatPath(f: FoldSet, i: number) {
  const l = f.seams[i] * W;
  const r = f.seams[i + 1] * W;
  const m = (l + r) / 2;
  return `M${l.toFixed(1)} 0 L${r.toFixed(1)} 0 L${(m + (r - l) * 0.22).toFixed(1)} ${HEAD} L${(m - (r - l) * 0.22).toFixed(1)} ${HEAD} Z`;
}

/**
 * Which way the cloth is gathered, decided by how wide the panels actually are.
 *
 * The narrow set is the default and the server's answer, for the same reason
 * `useRichDevice` starts at `false`: if the two disagree it should be the phone
 * that is right first. A wide window upgrades in a layout effect, before the
 * first paint, so nothing is ever seen being re-gathered.
 *
 * The threshold is the panel, not the window — each is half of it, and 900
 * pixels of window is where a panel passes 450 and six folds stop being narrow.
 */
function useFoldSet(): FoldSet {
  const [wide, setWide] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return wide ? WIDE : NARROW;
}

function Panel({
  side,
  open,
  rich,
  folds,
}: {
  side: "left" | "right";
  open: boolean;
  rich: boolean;
  folds: FoldSet;
}) {
  const uid = side;
  /* The leading edge is the one that faces the middle of the stage. */
  const leading = side === "left" ? "right" : "left";

  return (
    <svg
      className={`curtain ${PANEL_SIDE[side]} ${open ? "curtain-open" : ""}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/*
          * One gradient per fold, sampled from `section` rather than written
          * out, and tilted six per cent off vertical so the crest runs down the
          * cloth at a slight angle — fabric that hangs and sways is never lit
          * in a line exactly parallel to the seam beside it.
          */}
        {folds.crest.map((c, i) => (
          <linearGradient key={i} id={`fold-${uid}-${i}`} x1="0" y1="0" x2="1" y2="0.06">
            {sectionStops(c, folds.gain[i]).map((stop) => (
              <stop
                key={stop.at}
                offset={stop.at.toFixed(4)}
                stopColor={`var(--vel-t${stop.tone})`}
              />
            ))}
          </linearGradient>
        ))}

        {/*
          * The vertical fall of light: deep under the heading, brightest at
          * chest height where the key light reaches, deep again into the floor.
          * This is laid over every fold at once, so it ties six separately
          * shaded folds into one hanging sheet — without it they read as six
          * ribbons side by side.
          *
          * The hem is lighter than it was. Now that the velvet's own dark tone
          * is genuinely dark, 0.92 of it across the bottom fifth was not a
          * shadow but a black band, and the folds simply stopped being visible
          * before they reached the floor.
          */}
        <linearGradient id={`fall-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--vel-dark-rgb) / 0.66)" />
          <stop offset="0.16" stopColor="rgb(var(--vel-dark-rgb) / 0.14)" />
          <stop offset="0.4" stopColor="rgb(var(--vel-glint-rgb) / 0.2)" />
          <stop offset="0.62" stopColor="rgb(var(--vel-dark-rgb) / 0.04)" />
          <stop offset="0.86" stopColor="rgb(var(--vel-dark-rgb) / 0.3)" />
          <stop offset="1" stopColor="rgb(var(--vel-dark-rgb) / 0.62)" />
        </linearGradient>

        {/*
          * The key light falling off across the panel, and the bounce coming
          * back up off the floor.
          *
          * A lamp lights the near side of a set and the far side goes away into
          * the wings; a curtain lit evenly from edge to edge is a curtain lit by
          * a photocopier. `key` darkens towards the outer edge — away from the
          * middle of the stage, where the light is — and `pool` puts a thin
          * lift along the very bottom, which is the floor throwing a little of
          * it back. Together they are most of what makes the two panels read as
          * standing in a room rather than as wallpaper.
          */}
        <linearGradient
          id={`key-${uid}`}
          x1={leading === "right" ? "1" : "0"}
          y1="0"
          x2={leading === "right" ? "0" : "1"}
          y2="0"
        >
          <stop offset="0" stopColor="rgb(var(--vel-dark-rgb) / 0)" />
          <stop offset="0.55" stopColor="rgb(var(--vel-dark-rgb) / 0.15)" />
          <stop offset="1" stopColor="rgb(var(--vel-dark-rgb) / 0.34)" />
        </linearGradient>
        <linearGradient id={`pool-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="rgb(var(--vel-glint-rgb) / 0.13)" />
          <stop offset="0.12" stopColor="rgb(var(--vel-glint-rgb) / 0)" />
        </linearGradient>

        {/* A wide, weak sheen where the key light actually lands. */}
        <radialGradient id={`sheen-${uid}`}>
          <stop offset="0" stopColor="rgb(var(--vel-glint-rgb) / 0.08)" />
          <stop offset="0.55" stopColor="rgb(var(--vel-glint-rgb) / 0.03)" />
          <stop offset="1" stopColor="rgb(var(--vel-glint-rgb) / 0)" />
        </radialGradient>

        {/* The pile going bright at the grazing angle of the leading edge. */}
        <linearGradient
          id={`edge-${uid}`}
          x1={leading === "right" ? "1" : "0"}
          y1="0"
          x2={leading === "right" ? "0" : "1"}
          y2="0"
        >
          <stop offset="0" stopColor="var(--vel-glint)" stopOpacity="0.4" />
          <stop offset="0.06" stopColor="var(--vel-glint)" stopOpacity="0.16" />
          <stop offset="0.24" stopColor="var(--vel-glint)" stopOpacity="0.05" />
          <stop offset="1" stopColor="var(--vel-glint)" stopOpacity="0" />
        </linearGradient>

        {/* The shadow the curtain throws onto the stage beside it. */}
        <linearGradient
          id={`cast-${uid}`}
          x1={leading === "right" ? "0" : "1"}
          y1="0"
          x2={leading === "right" ? "1" : "0"}
          y2="0"
        >
          <stop offset="0" stopColor="rgb(var(--room-far-rgb) / 0)" />
          <stop offset="1" stopColor="rgb(var(--room-far-rgb) / 0.55)" />
        </linearGradient>

        {/*
          * The pile itself.
          *
          * Two turbulences rather than one, because velvet has two textures at
          * two scales and only the pair reads correctly. `pile` is a fine
          * isotropic speckle — the ends of the fibres. `nap` is the same noise
          * stretched forty to one vertically, which is the direction the cloth
          * is brushed and hangs in; on its own it is a scratched surface, and
          * under the speckle it is the grain that stops the fold gradients
          * looking calculated.
          *
          * Both are laid over the folds in `overlay` rather than painted on:
          * overlay lightens what is already light and darkens what is dark, so
          * the noise follows the lighting instead of fogging the panel flat.
          *
          * `numOctaves` is 2 and not 4. These sit on an element that is
          * transformed for two and a half seconds while the curtains part, so
          * the filter is re-rasterised as it scales — this is the one place in
          * the whole sequence where an expensive paint would actually be felt.
          */}
        {rich && (
          <>
            <filter id={`ao-${uid}`} x="-10%" y="-5%" width="120%" height="110%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <filter id={`pile-${uid}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" />
              <feColorMatrix type="matrix" values={GRAIN} />
            </filter>
            <filter id={`nap-${uid}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.22 0.025" numOctaves="2" seed="11" />
              <feColorMatrix type="matrix" values={GRAIN} />
            </filter>
          </>
        )}
      </defs>

      {/* the folds, hanging */}
      {folds.crest.map((_, i) => (
        <path key={i} d={foldPath(folds, i)} fill={`url(#fold-${uid}-${i})`} />
      ))}

      {/*
        * The valleys, struck on their own — and *blurred*, which is the whole
        * point of them.
        *
        * There used to be two hard strokes here, a wide soft one and a narrow
        * dark one, and the narrow one is what made the seams look drawn: a
        * crease of constant width running the full height is a pen line, and a
        * pen line down a gradient is exactly what the eye picks out as a rib.
        * What is actually happening in a fold's hollow is ambient occlusion —
        * the two faces shade each other, strongest where they are closest and
        * fading over some distance — and that has no edge at all. One wide
        * stroke through a nine-unit blur has none either.
        *
        * On a phone the blur is skipped and the soft stroke is drawn alone.
        * It reads a little flatter and costs nothing, which is the trade this
        * whole component makes everywhere `rich` appears.
        */}
      <g filter={rich ? `url(#ao-${uid})` : undefined} opacity={rich ? 0.55 : 0.32}>
        {folds.seams.slice(1, -1).map((_, i) => (
          <path
            key={`ao${i}`}
            d={creasePath(folds, i + 1)}
            fill="none"
            stroke="var(--vel-t0)"
            strokeWidth={rich ? 11 : 16}
          />
        ))}
      </g>

      {/* the pile, and the nap it is brushed into */}
      {rich && (
        <g style={{ mixBlendMode: "overlay" }}>
          {/*
            * These carry a fill they will never show — the filter chain starts at
            * `feTurbulence` and never reads the source graphic. Chrome declines to
            * render a `fill="none"` rect with no stroke at all, filter or not, so
            * the noise silently did not ship the first time round.
            */}
          <rect x="0" y="0" width={W} height={H} fill="#808080" filter={`url(#pile-${uid})`} opacity={0.2} />
          <rect x="0" y="0" width={W} height={H} fill="#808080" filter={`url(#nap-${uid})`} opacity={0.12} />
        </g>
      )}

      {/* where the key light lands, before it is shaped by the fall */}
      <ellipse cx={W * 0.5} cy={H * 0.33} rx={W * 0.85} ry={H * 0.42} fill={`url(#sheen-${uid})`} />

      {/* the fall of light down the whole sheet */}
      <rect x="-40" y={HEAD} width={W + 80} height={H - HEAD} fill={`url(#fall-${uid})`} />

      {/* the lamp falling off towards the wings, and the floor bouncing back */}
      <rect x="0" y="0" width={W} height={H} fill={`url(#key-${uid})`} />
      <rect x="0" y="0" width={W} height={H} fill={`url(#pool-${uid})`} />

      {/* the pile catching the light along the leading edge */}
      <rect x="0" y="0" width={W} height={H} fill={`url(#edge-${uid})`} />

      {/* and the shadow it drops on what it is standing in front of */}
      <rect x="0" y="0" width={W} height={H} fill={`url(#cast-${uid})`} />
    </svg>
  );
}

/**
 * The pelmet, and the braid along the bottom of it.
 *
 * Its own stretched SVG across the whole opening rather than a CSS band,
 * because the one thing a pelmet must have is a *scalloped* lower edge: a
 * straight one is a shelf, and a shelf across the top of two curtains reads as
 * a piece of browser furniture rather than as part of the set.
 *
 * Only shapes that survive being stretched are used — scallops, horizontal
 * braid, vertical gathers. The SVG is squashed to whatever width the column
 * happens to be, so anything that depends on its aspect (a tassel, a rosette, a
 * circle of any kind) would arrive somewhere else on every screen.
 */
const SCALLOPS = 9;
const PW = 900;
const PH = 100;
const STEP = PW / SCALLOPS;

/**
 * The swagged lower edge, as one arc per scallop dipping between its ends.
 *
 * Written right-to-left so the same string can be reused, with its opening
 * `M0 0 H…` trimmed off, as the *stroke* the braid follows. Tracing the braid
 * separately is how the two used to drift apart by a unit or two, which shows
 * up as gold appearing above the cloth on one scallop and below it on the next.
 */
const PELMET_HEM = Array.from({ length: SCALLOPS }, (_, i) => {
  const x0 = PW - i * STEP;
  const x1 = PW - (i + 1) * STEP;
  const mid = (x0 + x1) / 2;
  return `C${(mid + STEP * 0.18).toFixed(1)} ${PH} ${(mid - STEP * 0.18).toFixed(1)} ${PH} ${x1.toFixed(1)} ${PH * 0.52}`;
}).join(" ");

const PELMET_EDGE = `M${PW} ${PH * 0.52} ${PELMET_HEM}`;

/**
 * How far the SVG runs below the scallops.
 *
 * The pelmet's shadow cannot be a CSS `box-shadow`: that follows the element's
 * *border box*, which is a rectangle, so a scalloped pelmet acquires a hard
 * horizontal shadow line running straight across the curtains at the bottom of
 * its box — the one edge in the whole set that has nothing behind it. The
 * shadow is drawn inside the SVG instead, following the scallops, and this is
 * the room it needs to fall into.
 */
const PELMET_DROP = 40;
const PELMET_BODY = `M0 0 H${PW} V${PH * 0.52} ${PELMET_HEM} V0 Z`;

function Pelmet({ rich }: { rich: boolean }) {
  return (
    <svg
      className="curtain-pelmet"
      viewBox={`0 0 ${PW} ${PH + PELMET_DROP}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pelmet-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--vel-dark)" />
          <stop offset="0.28" stopColor="var(--vel-deep)" />
          <stop offset="0.5" stopColor="var(--vel-mid)" />
          <stop offset="0.76" stopColor="var(--vel-deep)" />
          <stop offset="1" stopColor="var(--vel-dark)" />
        </linearGradient>
        {/* The shadow the swag throws onto the cloth hanging behind it. */}
        <filter id="pelmet-shadow" x="-5%" y="-20%" width="110%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        {/* The same pile the panels have, so the swag is cut from one cloth. */}
        {rich && (
          <filter id="pelmet-pile" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="3" />
            <feColorMatrix type="matrix" values={GRAIN} />
          </filter>
        )}
        {/* Foil, so the braid brightens and dims along its length like metal. */}
        <linearGradient id="pelmet-braid" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--gold-frame)" stopOpacity="0.45" />
          <stop offset="0.26" stopColor="var(--gold-frame)" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="var(--gold-frame)" stopOpacity="0.5" />
          <stop offset="0.76" stopColor="var(--gold-frame)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--gold-frame)" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* first the shadow, cast down onto the curtains from the scalloped edge */}
      <g filter="url(#pelmet-shadow)" opacity={0.55}>
        <path
          d={`${PELMET_BODY.slice(0, -2)} V0 Z`}
          fill="rgb(var(--room-far-rgb) / 0.9)"
          transform={`translate(0 ${PELMET_DROP * 0.42})`}
        />
      </g>

      <path d={PELMET_BODY} fill="url(#pelmet-fall)" />

      {rich && (
        <g style={{ mixBlendMode: "overlay" }} opacity={0.15}>
          <path d={PELMET_BODY} fill="#808080" filter="url(#pelmet-pile)" />
        </g>
      )}

      {/*
        * Gathers in the pelmet, at half the pitch of the scallops and offset
        * from them. Line them up and the band reads as one stamp repeated;
        * offset, it reads as cloth pulled up over a board.
        */}
      {Array.from({ length: SCALLOPS * 2 }, (_, i) => {
        const x = (i + 0.5) * (STEP / 2);
        return (
          <path
            key={i}
            d={`M${x.toFixed(1)} 0 C${(x + 7).toFixed(1)} ${PH * 0.36} ${(x - 6).toFixed(1)} ${PH * 0.62} ${(x + 4).toFixed(1)} ${PH * 0.94}`}
            stroke="var(--vel-dark)"
            strokeWidth={2.4}
            fill="none"
            opacity={0.3}
          />
        );
      })}

      {/* the braid, on the scalloped edge itself, over its own shadow */}
      <path
        d={PELMET_EDGE}
        stroke="rgb(var(--vel-dark-rgb) / 0.55)"
        strokeWidth={5}
        fill="none"
        transform="translate(0 3)"
      />
      <path d={PELMET_EDGE} stroke="url(#pelmet-braid)" strokeWidth={4.2} fill="none" />

      {/* and a gold line along the top, where the board is */}
      <rect x="0" y="0" width={PW} height="3" fill="url(#pelmet-braid)" opacity="0.55" />
    </svg>
  );
}

/**
 * Both panels, and the track they hang from.
 *
 * Three states: **closed**, **open**, and then **struck** — faded out and
 * unmounted, because a curtain that has finished revealing something has no
 * further business standing in front of it.
 *
 * There was a fourth once — *absent*, fading in on a cue from the envelope — and
 * removing it is what made the hand-over reliable. The velvet hangs behind an
 * opaque overlay until that overlay dissolves, so nobody can see it arrive; all
 * the fade ever did was create a race between a CSS transition and a React
 * render of the entire page, and on a desktop the render lost. It was still
 * half transparent when the dissolve reached it. Hung from the first paint
 * there is nothing to get wrong: the velvet is simply already there, and the
 * envelope's veil coming off is the only thing that has to happen.
 *
 * They sit above the invitation and below nothing: the page is already there,
 * live and laid out, before the cloth ever moves off it. These are not a
 * loading screen with a picture behind them.
 */
export function VelvetCurtains({
  open,
  struck,
  rich = true,
}: {
  open: boolean;
  /** Finished opening: fade out, and be unmounted a moment later. */
  struck: boolean;
  /**
   * Whether this device can afford the nap.
   *
   * Two `feTurbulence` filters per panel, plus one in the swag, is what makes
   * this cloth read as velvet rather than satin — and on a phone it is also,
   * measurably, the most expensive thing on the page. An SVG filter is
   * rasterised on the CPU, and these sit on elements that are transformed while
   * the curtains part, so they are re-rasterised as they scale. Without it the
   * velvet is a shade flatter. With it, on the wrong device, the page stops
   * answering the guest at all — and a flatter curtain is not a trade, it is
   * the only one of the two that is still an invitation.
   */
  rich?: boolean;
}) {
  const folds = useFoldSet();

  return (
    <div
      className={`curtains ${open ? "curtains-open" : ""} ${struck ? "curtains-struck" : ""}`}
      aria-hidden="true"
    >
      <Panel side="left" open={open} rich={rich} folds={folds} />
      <Panel side="right" open={open} rich={rich} folds={folds} />
      {/*
        * The dark seam where the two panels meet — the one part of a closed set
        * that no light reaches at all, and the first thing missing from a pair
        * of curtains that were drawn as two independent sheets. It goes as they
        * part, because by then there is no join for it to be in.
        */}
      <span className={`curtain-seam ${open ? "curtain-seam-gone" : ""}`} />
      {/*
        * No pelmet.
        *
        * There was a scalloped swag across the top, on the reasoning that
        * curtains hang from *something* and two panels without a board above
        * them read as two separate sheets rather than one set. That is sound
        * for a stage, and wrong for this: on a phone the swag ate an eighth of
        * the height before the invitation had begun, and the first thing a
        * guest saw after the envelope was a band of fabric rather than the
        * curtains parting. The couple asked for it gone, and the set reads
        * perfectly well as one because the two panels meet in the middle.
        *
        * `Pelmet` and its CSS are left in place, unused, so it is one line to
        * put back.
        */}
    </div>
  );
}
