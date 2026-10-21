import { useId } from "react";

/**
 * A poured wax seal, lit from the upper left like everything else on the set.
 *
 * What made the old one read as an icon was symmetry and flatness: an evenly
 * scalloped rim, one gradient, and a crest laid on top. Wax is none of those.
 * It is poured, so the edge is irregular and slightly thicker in places; it
 * has a rim that stands up off the paper, catching light on the upper left and
 * falling into shade on the lower right; and the stamp is *pressed into* it, so
 * the crest is a hollow — dark on the side facing the light, lit on the side
 * away from it.
 *
 * Built from layered shapes and gradients only. No SVG filters: the seal sits
 * inside the element the camera moves, and a filter there is re-rasterised on
 * every frame of the move — the cost this project already paid once on phones.
 *
 * The couple's own seal text, when they have set one, is HTML over the wax,
 * never SVG `<text>` — it may well be Khmer.
 */

/* A deterministic, irregular outline: a circle with a few uneven lobes and a
   little drift, so it reads as poured rather than stamped from a die. */
function blob(radius: number, seed: number, lobes = 11, wobble = 0.075): string {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const offsets = Array.from({ length: lobes }, () => 1 + (rnd() - 0.5) * wobble * 2);
  const steps = 72;
  const pts: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const f = (a / (Math.PI * 2)) * lobes;
    const k = Math.floor(f);
    const t = f - k;
    const ease = (1 - Math.cos(t * Math.PI)) / 2;
    const r0 = offsets[k % lobes];
    const r1 = offsets[(k + 1) % lobes];
    // soft lobes: a small bulge between each pair of control radii
    const lobe = 1 + 0.035 * Math.sin(t * Math.PI);
    const r = radius * (r0 + (r1 - r0) * ease) * lobe;
    pts.push([(Math.cos(a) * r).toFixed(2), (Math.sin(a) * r).toFixed(2)].join(" "));
  }
  return ["M", pts.join(" L "), "Z"].join(" ");
}

const OUTER = blob(56, 48271);
const BODY = blob(50.5, 48271, 11, 0.06);

export function WaxSeal({ text = "" }: { text?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const custom = text.trim();

  return (
    <div className="pe-wax">
      <svg viewBox="-62 -62 124 124" aria-hidden="true">
        <defs>
          {/* the rim: thicker wax, lit upper left, in shade lower right */}
          <linearGradient id={`rim-${id}`} x1="0.15" y1="0.1" x2="0.85" y2="0.95">
            <stop offset="0" stopColor="#ecd6a8" />
            <stop offset="0.35" stopColor="#c7a163" />
            <stop offset="0.75" stopColor="#8d6a35" />
            <stop offset="1" stopColor="#5f4521" />
          </linearGradient>
          {/* the body of the pour */}
          <radialGradient id={`body-${id}`} cx="0.36" cy="0.32" r="0.78">
            <stop offset="0" stopColor="#e5c891" />
            <stop offset="0.45" stopColor="#c09a5c" />
            <stop offset="0.85" stopColor="#97733d" />
            <stop offset="1" stopColor="#80602f" />
          </radialGradient>
          {/* the pressed disc: a hollow, so it is darker where the light
              comes from (the wall facing away) and lighter opposite */}
          <linearGradient id={`well-${id}`} x1="0.2" y1="0.15" x2="0.8" y2="0.9">
            <stop offset="0" stopColor="#7d5e2e" />
            <stop offset="0.4" stopColor="#a8854c" />
            <stop offset="1" stopColor="#c8a568" />
          </linearGradient>
          <linearGradient id={`wall-${id}`} x1="0.2" y1="0.15" x2="0.8" y2="0.9">
            <stop offset="0" stopColor="#4d3818" stopOpacity="0.75" />
            <stop offset="0.5" stopColor="#4d3818" stopOpacity="0.15" />
            <stop offset="1" stopColor="#fff2d0" stopOpacity="0.55" />
          </linearGradient>
          {/* one soft specular where the key light lands on the rim */}
          <radialGradient id={`spec-${id}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fffaf0" stopOpacity="0.8" />
            <stop offset="0.6" stopColor="#fffaf0" stopOpacity="0.15" />
            <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`clip-${id}`}>
            <path d={BODY} />
          </clipPath>
        </defs>

        {/* thickness: the wax edge seen below the rim, toward the shadow */}
        <path d={OUTER} fill="#4a3517" transform="translate(1.6 2.2)" opacity="0.55" />
        <path d={OUTER} fill={`url(#rim-${id})`} />
        <path d={BODY} fill={`url(#body-${id})`} />

        <g clipPath={`url(#clip-${id})`}>
          {/* uneven distribution: a slightly thicker pool to the lower left */}
          <ellipse cx="-14" cy="18" rx="30" ry="22" fill="#8a6833" opacity="0.18" />
          <ellipse cx="18" cy="-20" rx="26" ry="18" fill="#f1dcb0" opacity="0.16" />
        </g>

        {/* the stamp's well */}
        <circle r="35" fill={`url(#well-${id})`} />
        <circle r="35" fill="none" stroke={`url(#wall-${id})`} strokeWidth="3.2" />
        <circle r="38.2" fill="none" stroke="#f3e2bb" strokeOpacity="0.45" strokeWidth="1" />

        {!custom && (
          <g transform="translate(0 4)">
            {/* debossed crest: lit edge offset away from the light, shadow
                toward it, then the wax itself on top */}
            {/* Each design kit's stamp, pressed into the wax; the active kit's
                stylesheet hides the others (`lib/designKit`). */}
            <g className="kit-only-vintage-flourish">
              <image href="/kit/flourish/seal-light.svg" x="-21.2" y="-24.2" width="44" height="44" opacity="0.6" />
              <image href="/kit/flourish/seal-dark.svg" x="-22.8" y="-25.8" width="44" height="44" opacity="0.65" />
              <image href="/kit/flourish/seal-wax.svg" x="-22" y="-25" width="44" height="44" />
            </g>
            <g className="kit-only-khmer-gold">
              <image href="/kit/crest-mono-light.svg" x="-24.2" y="-17.8" width="50" height="34" opacity="0.55" />
              <image href="/kit/crest-mono-dark.svg" x="-25.8" y="-19.4" width="50" height="34" opacity="0.6" />
              <image href="/kit/crest-mono-wax.svg" x="-25" y="-18.6" width="50" height="34" />
            </g>
          </g>
        )}

        <ellipse cx="-22" cy="-30" rx="17" ry="8" fill={`url(#spec-${id})`} transform="rotate(-32 -22 -30)" />
        <ellipse cx="-9" cy="-17" rx="5" ry="2.4" fill="#fffaf0" opacity="0.28" transform="rotate(-32 -9 -17)" />
      </svg>

      {custom && <span className="pe-wax-text khmer-wrap">{custom}</span>}
      {/* a generated kit's own mark, pressed into the wax (lib/designKit) */}
      {!custom && <span className="pe-wax-mark kit-generated" aria-hidden="true" />}
    </div>
  );
}
