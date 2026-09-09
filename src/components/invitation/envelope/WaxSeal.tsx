"use client";

import { useId } from "react";

/**
 * The seal — the envelope's focal point, and the thing a guest's eye lands on
 * first.
 *
 * This is wax, poured and then struck: a blob with an edge that never repeats,
 * a raised rim where the metal pushed the wax outward, a sunken field, a ring
 * of beads and the couple's monogram at the bottom of it. It is deliberately
 * *not* a coin. A perfect circle with milled edges is a machined object, and a
 * machined object on a hand-folded envelope is the one wrong note that makes
 * everything around it look printed too.
 *
 * The edge is generated rather than drawn — a radius that breathes around the
 * circle, sampled and joined with smooth curves. Three harmonics, none of them
 * a multiple of another, so the shape never falls into a rhythm the eye can
 * follow round. It is computed once at module scope: it is the same seal every
 * time the page loads, because it is one seal, not a new one per render.
 */

/**
 * A closed, smooth path through points sampled off a breathing radius.
 *
 * Catmull–Rom converted to cubic Béziers: it passes *through* every sample, so
 * the wave amplitudes below mean what they say, and the joins are continuous
 * all the way round including across the seam.
 */
function wavyDisc(base: number, waves: [number, number, number][], samples = 72) {
  const pts = Array.from({ length: samples }, (_, i) => {
    const a = (i / samples) * Math.PI * 2;
    const r = waves.reduce((acc, [amp, freq, phase]) => acc + amp * Math.sin(freq * a + phase), base);
    return [r * Math.cos(a), r * Math.sin(a)] as const;
  });

  const at = (i: number) => pts[(i + samples) % samples];
  let d = `M${at(0)[0].toFixed(2)} ${at(0)[1].toFixed(2)}`;
  for (let i = 0; i < samples; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

/**
 * The wax as it ran: the outer edge, and the rim standing inside it.
 *
 * The weight is on the *low* harmonics — a broad three-lobed sway first, then a
 * seven and an eleven over the top of it. Loading the high frequencies instead
 * gave an even ripple all the way round, which does not read as wax at all: it
 * reads as a bottle cap. Poured wax spreads unevenly and then sets, so its
 * outline is a few wide swells with small irregularities riding on them.
 *
 * The rim inside repeats the same harmonics at reduced amplitude and identical
 * phase, so it follows the edge rather than wandering across it — on a real
 * seal the die pushes the wax outward from the middle, and the rim it leaves is
 * a smaller copy of wherever the wax happened to reach.
 */
const WAVES: [number, number, number][] = [
  [6.4, 3, 0.7],
  [4.0, 7, 2.3],
  [2.1, 11, 4.6],
  [1.0, 17, 1.2],
];
const WAX_EDGE = wavyDisc(110, WAVES);
const WAX_RIM = wavyDisc(95, WAVES.map(([a, f, p]) => [a * 0.62, f, p]));

/**
 * The wax that ran before it set.
 *
 * A second, smaller blob on different harmonics, drawn *under* the body and
 * offset down and left, so a little of it shows past the edge on one side only.
 * Poured wax is never one clean shape: it goes down in more than one moment and
 * the earlier pour is still spreading when the later one lands on it. One
 * asymmetric lobe is all it takes — make it symmetrical, or centre it, and the
 * seal goes straight back to being a stamped disc.
 */
const WAX_POUR = wavyDisc(99, [
  [7.8, 2, 1.9],
  [3.4, 5, 0.4],
  [1.8, 9, 3.1],
]);

export function WaxSeal({
  text,
  released,
  gold,
}: {
  /** The couple's initials, from the wedding record. */
  text: string;
  /** The paper beneath has let go: it lifts and turns a little. */
  released: boolean;
  /** Let the wax catch the light. */
  gold: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  /*
   * Sized by how much there is to set, not by a single threshold: two Khmer
   * initials joined by an ampersand is five characters and still wants to be
   * read across a room.
   */
  const size = text.length <= 3 ? 54 : text.length <= 6 ? 40 : 29;

  return (
    <div
      className="env-seal"
      style={{
        /*
         * It stands off the flap rather than being printed on it, which is
         * what gives it its own parallax: when the camera leans, a seal ten
         * pixels proud of the paper moves against the paper, and that
         * disagreement is what the eye reads as a separate object.
         */
        transform: released
          ? "translate3d(0.2em, -0.5em, 0) rotate(-7deg) scale(1.04)"
          : "translate3d(0, 0, 0) rotate(0deg) scale(1)",
      }}
      aria-hidden="true"
    >
      <svg viewBox="-130 -130 260 260" className={`env-seal-face ${gold ? "env-seal-lit" : ""}`}>
        <defs>
          {/* The wax: bronze, bright where it faces the key light and deep
              where it turns away. A flat fill is the one thing wax never is. */}
          <radialGradient id={`w-${uid}`} cx="0.32" cy="0.26" r="0.92">
            <stop offset="0" stopColor="var(--env-gold-light)" />
            <stop offset="0.22" stopColor="var(--env-gold-light)" />
            <stop offset="0.52" stopColor="var(--env-gold)" />
            <stop offset="0.86" stopColor="var(--env-gold-deep)" />
            <stop offset="1" stopColor="var(--env-gold-deep)" />
          </radialGradient>

          {/* the wet look: one soft specular where the key light lands */}
          <radialGradient id={`h-${uid}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fffdf4" stopOpacity="0.78" />
            <stop offset="0.55" stopColor="#fffdf4" stopOpacity="0.2" />
            <stop offset="1" stopColor="#fffdf4" stopOpacity="0" />
          </radialGradient>

          {/* The field inside the rim is sunken, so it is lit from the far
              side — the near wall of a depression is the one in shadow. */}
          <radialGradient id={`f-${uid}`} cx="0.62" cy="0.68" r="0.84">
            <stop offset="0" stopColor="var(--env-gold)" />
            <stop offset="0.62" stopColor="var(--env-gold-deep)" />
            <stop offset="1" stopColor="var(--env-gold-deep)" />
          </radialGradient>

          <linearGradient id={`s-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fffdf2" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>

          <clipPath id={`c-${uid}`}>
            <path d={WAX_EDGE} />
          </clipPath>

          {/*
            * The shadow the wax throws on the paper.
            *
            * Blurred, not offset. The old version was a hard copy of the blob
            * nudged five units down, which is a drop shadow in a slide deck —
            * a real seal is a few millimetres of wax sitting on paper under a
            * soft light, so its shadow is close, wide and has no edge at all.
            */}
          <filter id={`sh-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>

          {/*
            * Wax grain.
            *
            * Sealing wax is a resin full of pigment; under a raking light its
            * surface is faintly cloudy rather than smooth, and that cloudiness
            * is the difference between wax and enamel. Fractal noise at a low
            * frequency gives exactly the right scale of mottle — the alpha is
            * taken from one channel and laid over the body in `overlay`, so it
            * lightens where the wax is light and darkens where it is dark
            * instead of greying the whole thing evenly.
            */}
          <filter id={`gr-${uid}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.045" numOctaves="4" seed="7" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.5 0 0 0 0 0.44 0 0 0 0 0.3 0.9 0 0 0 0"
            />
          </filter>
        </defs>

        {/* the shadow the wax casts on the paper */}
        <g filter={`url(#sh-${uid})`}>
          <path d={WAX_EDGE} fill="rgb(58 40 26 / 0.34)" transform="translate(1 6) scale(1.02)" />
        </g>

        {/* the earlier pour, showing past the body on one side */}
        <path d={WAX_POUR} fill={`url(#f-${uid})`} transform="translate(-9 10)" opacity={0.95} />
        <path
          d={WAX_POUR}
          fill="none"
          stroke="rgb(58 40 26 / 0.22)"
          strokeWidth="2"
          transform="translate(-9 10)"
        />

        {/* the body */}
        <path d={WAX_EDGE} fill={`url(#w-${uid})`} />

        {/*
          * Its grain — and the one piece of this drawing that a phone does not
          * get. It is a four-octave `feTurbulence`, the most expensive filter on
          * the page, and it lives inside the element the camera scales, so it
          * was being re-rasterised on the CPU for every frame of a six-second
          * push. `.env-lite` takes it away; the wax loses a little cloudiness
          * and the page keeps answering the guest.
          */}
        <g className="env-seal-grain" clipPath={`url(#c-${uid})`} style={{ mixBlendMode: "overlay" }} opacity={0.34}>
          <rect x="-130" y="-130" width="260" height="260" filter={`url(#gr-${uid})`} />
        </g>
        {/* its rounded edge: light on the side facing the key, shade opposite */}
        <path
          d={WAX_EDGE}
          fill="none"
          stroke="rgb(255 252 240 / 0.4)"
          strokeWidth="3"
          transform="translate(-1.6 -1.8)"
          clipPath={`url(#c-${uid})`}
        />
        <path
          d={WAX_EDGE}
          fill="none"
          stroke="rgb(58 40 26 / 0.32)"
          strokeWidth="3.4"
          transform="translate(1.6 1.8)"
          clipPath={`url(#c-${uid})`}
        />

        {/*
          * The rim the die pushed up, and the field it pressed down inside it.
          * Struck wax has exactly this section: a wall standing proud around a
          * floor that sits below the surface of the blob.
          */}
        <path d={WAX_RIM} fill={`url(#f-${uid})`} />
        <path d={WAX_RIM} fill="none" stroke="rgb(58 40 26 / 0.34)" strokeWidth="2.6" />
        <path
          d={WAX_RIM}
          fill="none"
          stroke="rgb(255 252 240 / 0.34)"
          strokeWidth="1.6"
          transform="translate(0 -2.2)"
        />

        {/*
          * The beaded ring, the one ornament struck wax always carries — and
          * a second, finer ring of half as many beads inside it.
          *
          * Each bead is struck twice, a lit copy over a dark one a unit and a
          * half below: a bead is a hemisphere pressed into wax, so it has a rim
          * that catches the light and a shadow under it. A single flat circle
          * at this size is a printed dot, and forty printed dots in a ring is
          * the fastest way to make a seal look like a sticker.
          */}
        <g fill="var(--env-gold-deep)" opacity="0.42">
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} r="2.4" cy="-78.4" transform={`rotate(${i * 9})`} />
          ))}
        </g>
        <g fill="var(--env-gold-light)" opacity="0.55">
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} r="2.4" cy="-80" transform={`rotate(${i * 9})`} />
          ))}
        </g>
        <circle r="70" fill="none" stroke="rgb(58 40 26 / 0.2)" strokeWidth="1" />
        <circle r="66" fill="none" stroke="rgb(58 40 26 / 0.26)" strokeWidth="1.4" />
        <g fill="var(--env-gold-light)" opacity="0.34">
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} r="1.3" cy="-61" transform={`rotate(${i * 18 + 9})`} />
          ))}
        </g>

        {/* the specular, sat on the shoulder the light actually reaches */}
        <ellipse
          cx="-38"
          cy="-46"
          rx="46"
          ry="34"
          fill={`url(#h-${uid})`}
          transform="rotate(-24 -38 -46)"
          clipPath={`url(#c-${uid})`}
        />

        {/*
          * The monogram, struck into the wax: cut below, lit above.
          *
          * Centred with an explicit `dy`, **not** `dominant-baseline: central`.
          * WebKit's support for `dominant-baseline` on SVG text has never been
          * dependable, and when it is ignored the text falls back to its
          * alphabetic baseline — which puts the letters a third of their own
          * size above the middle of the seal. Measured here: on a 40px seal the
          * ink centre lands at −10.7 instead of +2.5, so the initials sit high
          * in the wax on a phone and dead centre on a desktop, which is exactly
          * what was reported.
          *
          * 0.33em is that same measurement expressed as a shift from the
          * alphabetic baseline, and every browser honours `dy`.
          */}
        <g textAnchor="middle" fontFamily="var(--f-heading), serif">
          <text y={2.5} dy="0.33em" fontSize={size} fill="rgb(255 252 240 / 0.5)">
            {text}
          </text>
          <text y={0} dy="0.33em" fontSize={size} fill="var(--env-gold-deep)">
            {text}
          </text>
        </g>

        {/* the light crossing the wax */}
        <g clipPath={`url(#c-${uid})`}>
          <rect
            className="env-seal-sheen"
            x="-320"
            y="-140"
            width="120"
            height="280"
            fill={`url(#s-${uid})`}
          />
        </g>
      </svg>
    </div>
  );
}
