"use client";

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

/**
 * Where the folds meet, as fractions of the panel's width.
 *
 * **Seven**, not eleven, and that number is the difference between cloth and
 * corrugated iron. Two panels of eleven folds each put twenty-two of them
 * across a phone — one every eighteen pixels — and at that pitch the eye stops
 * reading individual folds of fabric and starts reading a ribbed surface. Real
 * curtain folds are roughly a hand's width apart whatever they are hung on.
 *
 * The spacing is hand-set and deliberately uneven: gathered cloth never falls
 * into equal parts, and equal parts are the other half of why the first attempt
 * looked machined. They widen towards the leading edge, which is the part
 * hanging free rather than pulled towards the wall.
 */
const SEAMS = [0, 0.115, 0.255, 0.395, 0.54, 0.69, 0.85, 1];

/** How far each seam wanders outward between the heading and the hem. */
const FLARE = [0, 0.04, 0.068, 0.082, 0.08, 0.062, 0.036, 0];

/**
 * How far each fold bows sideways on its way down.
 *
 * Different for every seam, so no two folds hang alike. Hanging cloth sways: a
 * fold whose sides are straight lines from top to bottom is a folded sheet of
 * card.
 */
const SWAY = [0, 15, -11, 19, -13, 16, -9, 0];

/**
 * Where the crest of each fold sits, as a fraction across it.
 *
 * Not the same number for all of them. One light crossing a rank of cylinders
 * strikes each at a slightly different angle depending on how far round the
 * curve it stands, so the highlight walks across the panel — near the middle of
 * the folds facing the light and crowded to one side of those turning away.
 * Giving every fold an identical crest is the most common way this effect
 * fails, and it fails by reading as a row of matching tubes.
 */
const CREST = [0.42, 0.38, 0.33, 0.3, 0.28, 0.26, 0.24];

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

/** The heading the fabric is gathered into. */
const HEAD = 74;

/**
 * One fold, as a closed path from the heading down to the hem.
 *
 * Each side is a cubic with its own sway, so the fold narrows and widens on the
 * way down instead of tapering evenly. Fabric hanging under its own weight is
 * never a trapezium.
 */
function seamPath(i: number) {
  const top = SEAMS[i] * W;
  const bot = (SEAMS[i] + FLARE[i]) * W;
  const sway = SWAY[i];
  return `C${(top + sway).toFixed(1)} ${H * 0.38} ${(bot + sway * 0.6).toFixed(1)} ${H * 0.74} ${bot.toFixed(1)} ${H}`;
}

function foldPath(i: number) {
  const topR = SEAMS[i + 1] * W;
  const botR = (SEAMS[i + 1] + FLARE[i + 1]) * W;
  const swayR = SWAY[i + 1];
  return [
    `M${(SEAMS[i] * W).toFixed(1)} ${HEAD}`,
    seamPath(i),
    `L${botR.toFixed(1)} ${H}`,
    `C${(botR + swayR * 0.6).toFixed(1)} ${H * 0.74} ${(topR + swayR).toFixed(1)} ${H * 0.38} ${topR.toFixed(1)} ${HEAD}`,
    "Z",
  ].join(" ");
}

/** Just the crease between two folds, for drawing the valley on its own. */
function creasePath(i: number) {
  return `M${(SEAMS[i] * W).toFixed(1)} ${HEAD} ${seamPath(i)}`;
}

/** One pleat in the heading, where the cloth is bunched onto the track. */
function pleatPath(i: number) {
  const l = SEAMS[i] * W;
  const r = SEAMS[i + 1] * W;
  const m = (l + r) / 2;
  return `M${l.toFixed(1)} 0 L${r.toFixed(1)} 0 L${(m + (r - l) * 0.22).toFixed(1)} ${HEAD} L${(m - (r - l) * 0.22).toFixed(1)} ${HEAD} Z`;
}

function Panel({ side, open, rich }: { side: "left" | "right"; open: boolean; rich: boolean }) {
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
          * One gradient per fold, and each is a cylinder of *velvet*: valley,
          * body, a narrow crest, body, valley. The crest takes about a tenth of
          * the fold's width and everything either side of it falls away fast,
          * which is the whole difference between pile and a smooth weave — and
          * the reason the stops are bunched rather than evenly spread.
          */}
        {CREST.map((c, i) => (
          <linearGradient key={i} id={`fold-${uid}-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--vel-dark)" />
            <stop offset="0.05" stopColor="var(--vel-deep)" />
            <stop offset={Math.max(0.1, c - 0.16).toFixed(3)} stopColor="var(--vel-mid)" />
            <stop offset={Math.max(0.12, c - 0.035).toFixed(3)} stopColor="var(--vel-lit)" />
            <stop offset={c.toFixed(3)} stopColor="var(--vel-glint)" />
            <stop offset={(c + 0.04).toFixed(3)} stopColor="var(--vel-lit)" />
            <stop offset={(c + 0.2).toFixed(3)} stopColor="var(--vel-mid)" />
            <stop offset="0.82" stopColor="var(--vel-deep)" />
            <stop offset="1" stopColor="var(--vel-dark)" />
          </linearGradient>
        ))}

        {/*
          * The vertical fall of light. Deep under the heading, where the pelmet
          * shades the cloth; brightest at chest height where the key light
          * reaches; deep again into the floor, where the cloth pools and the
          * light never gets in. This is laid over every fold at once, so it
          * ties seven separately shaded folds into one hanging sheet — without
          * it they read as seven ribbons side by side.
          */}
        <linearGradient id={`fall-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--vel-dark-rgb) / 0.8)" />
          <stop offset="0.12" stopColor="rgb(var(--vel-dark-rgb) / 0.22)" />
          <stop offset="0.34" stopColor="rgb(var(--vel-glint-rgb) / 0.2)" />
          <stop offset="0.56" stopColor="rgb(var(--vel-dark-rgb) / 0.08)" />
          <stop offset="0.8" stopColor="rgb(var(--vel-dark-rgb) / 0.42)" />
          <stop offset="0.94" stopColor="rgb(var(--vel-dark-rgb) / 0.74)" />
          <stop offset="1" stopColor="rgb(var(--vel-dark-rgb) / 0.92)" />
        </linearGradient>

        {/* The pile going bright at the grazing angle of the leading edge. */}
        <linearGradient
          id={`edge-${uid}`}
          x1={leading === "right" ? "1" : "0"}
          y1="0"
          x2={leading === "right" ? "0" : "1"}
          y2="0"
        >
          <stop offset="0" stopColor="var(--vel-glint)" stopOpacity="0.62" />
          <stop offset="0.06" stopColor="var(--vel-glint)" stopOpacity="0.22" />
          <stop offset="0.24" stopColor="var(--vel-glint)" stopOpacity="0.06" />
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
            <filter id={`pile-${uid}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="5" />
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
      {CREST.map((_, i) => (
        <path key={i} d={foldPath(i)} fill={`url(#fold-${uid}-${i})`} />
      ))}

      {/*
        * The valleys, struck on their own. The fold gradients already darken
        * towards their edges, but two gradients meeting still meet in a
        * straight seam; a crease drawn over the join is what turns that seam
        * into a place where the cloth turns back on itself.
        *
        * Two weights, and the wide one matters more: a fold casts a soft
        * shadow into the hollow beside it for some distance, and only the last
        * few threads of it are the hard dark line. A single narrow crease is a
        * pen stroke on a gradient.
        */}
      {SEAMS.slice(1, -1).map((_, i) => (
        <path
          key={`w${i}`}
          d={creasePath(i + 1)}
          fill="none"
          stroke="var(--vel-deep)"
          strokeWidth={13}
          opacity={0.4}
        />
      ))}
      {SEAMS.slice(1, -1).map((_, i) => (
        <path
          key={`n${i}`}
          d={creasePath(i + 1)}
          fill="none"
          stroke="var(--vel-dark)"
          strokeWidth={3.4}
          opacity={0.6}
        />
      ))}

      {/* the pile, and the nap it is brushed into */}
      {rich && (
        <g style={{ mixBlendMode: "overlay" }}>
          {/*
            * These carry a fill they will never show — the filter chain starts at
            * `feTurbulence` and never reads the source graphic. Chrome declines to
            * render a `fill="none"` rect with no stroke at all, filter or not, so
            * the noise silently did not ship the first time round.
            */}
          <rect x="0" y="0" width={W} height={H} fill="#808080" filter={`url(#pile-${uid})`} opacity={0.26} />
          <rect x="0" y="0" width={W} height={H} fill="#808080" filter={`url(#nap-${uid})`} opacity={0.16} />
        </g>
      )}

      {/* the fall of light down the whole sheet */}
      <rect x="-40" y={HEAD} width={W + 80} height={H - HEAD} fill={`url(#fall-${uid})`} />

      {/* the heading: tighter pleats, and deeper because the pelmet shades them */}
      {CREST.map((_, i) => (
        <path key={i} d={pleatPath(i)} fill={`url(#fold-${uid}-${i})`} />
      ))}
      <rect x="0" y="0" width={W} height={HEAD} fill="rgb(var(--vel-dark-rgb) / 0.62)" />

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
  return (
    <div
      className={`curtains ${open ? "curtains-open" : ""} ${struck ? "curtains-struck" : ""}`}
      aria-hidden="true"
    >
      <Panel side="left" open={open} rich={rich} />
      <Panel side="right" open={open} rich={rich} />
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
