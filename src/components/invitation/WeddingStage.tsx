"use client";

import { useMemo } from "react";

/**
 * The wedding stage the curtains open onto.
 *
 * Built in planes at three distances, and that is the only reason it reads as a
 * depth of field rather than as a busy wallpaper:
 *
 *   • **far** — the architecture. Heavily blurred, low contrast, cool. It is
 *     out of focus because it is behind the subject, and the blur is what tells
 *     the eye how far behind.
 *   • **mid** — the floral arch and the candles. Softly blurred, warm, and
 *     carrying almost all the light in the scene.
 *   • **near** — the bokeh and the falling gold. Badly out of focus and *large*,
 *     because things very close to a wide-open lens go enormous and soft.
 *
 * The invitation card itself sits between mid and near, and is the only thing
 * on the whole page in sharp focus. Everything here exists to make that true.
 *
 * Every blur is static and set once per element; only `transform` and `opacity`
 * ever animate. A blur that animates is a full-frame filter recomputed every
 * frame, which is exactly the thing a phone cannot do.
 */

/** Deterministic placement — the same stage on the server and the client. */
function scatter(count: number, seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: next(),
    y: next(),
    scale: next(),
    delay: next(),
    span: next(),
  }));
}

/**
 * One flower head, drawn as a rose seen from the side: an outer cup of three
 * petals with a tighter whorl inside it. Softness comes from the parent plane's
 * blur, so the drawing itself stays simple — detail that is about to be blurred
 * away is detail nobody sees.
 */
function Rose({ transform, tone }: { transform: string; tone: string }) {
  return (
    <g transform={transform} fill={tone}>
      <path d="M0 0 C-17 -3 -26 -16 -22 -29 C-18 -41 -6 -46 4 -42 C15 -38 22 -27 20 -15 C18 -5 9 1 0 0 Z" />
      <path
        d="M-9 -14 C-13 -22 -9 -31 0 -33 C9 -35 16 -28 15 -19 C14 -11 6 -6 -1 -8 Z"
        opacity={0.55}
      />
      <path d="M-3 -18 C-5 -23 -1 -27 4 -26 C8 -25 10 -21 8 -17 C6 -14 1 -14 -3 -18 Z" opacity={0.4} />
    </g>
  );
}

/** A spray of foliage — three blades from one point. */
function Frond({ transform, tone }: { transform: string; tone: string }) {
  return (
    <g transform={transform} fill={tone}>
      <path d="M0 0 C-6 -18 -4 -38 4 -54 C10 -38 10 -18 2 0 Z" />
      <path d="M0 0 C-19 -11 -30 -26 -34 -44 C-19 -35 -6 -20 0 -4 Z" opacity={0.8} />
      <path d="M0 0 C19 -12 31 -27 35 -45 C20 -35 6 -20 0 -4 Z" opacity={0.8} />
    </g>
  );
}

/**
 * The floral arch over the stage, in one plane so one blur covers all of it.
 *
 * Weighted to the two shoulders and thinning across the crown: that is how
 * these are actually built, because the flowers are wired to the frame from the
 * ground up and there is only so much that will hang overhead.
 */
function Arch() {
  return (
    <svg
      className="stage-arch"
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      focusable="false"
    >
      {/* the frame the flowers are wired to */}
      <path
        d="M96 620 C96 300 260 120 500 120 C740 120 904 300 904 620"
        fill="none"
        stroke="rgb(var(--gold-1-rgb) / 0.5)"
        strokeWidth={9}
      />

      {/* foliage first, so the blooms sit into it */}
      <g>
        {[
          [104, 560, 1.5, 8], [118, 452, 1.35, -14], [150, 352, 1.25, -28],
          [206, 260, 1.15, -44], [286, 192, 1.05, -58], [386, 152, 0.95, -70],
          [500, 140, 0.9, -90], [614, 152, 0.95, -110], [714, 192, 1.05, -122],
          [794, 260, 1.15, -136], [850, 352, 1.25, -152], [882, 452, 1.35, -166],
          [896, 560, 1.5, -172],
        ].map(([x, y, s, r], i) => (
          <Frond
            key={i}
            transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
            tone="rgb(58 74 58 / 0.5)"
          />
        ))}
      </g>

      <g>
        {[
          [110, 596, 1.5], [126, 496, 1.3], [166, 396, 1.2], [226, 304, 1.05],
          [312, 232, 0.95], [418, 180, 0.85], [538, 168, 0.8], [648, 190, 0.85],
          [746, 240, 0.95], [822, 314, 1.05], [868, 410, 1.2], [890, 512, 1.35],
          [902, 604, 1.5],
        ].map(([x, y, s], i) => (
          <Rose
            key={i}
            transform={`translate(${x} ${y}) rotate(${(i * 47) % 60 - 30}) scale(${s})`}
            /* Alternating between the theme's accent and a paler bloom keeps a
               dozen roses from reading as one repeated stamp. */
            tone={i % 3 === 0 ? "rgb(var(--c-accent-rgb) / 0.9)" : "rgb(255 246 244 / 0.72)"}
          />
        ))}
      </g>
    </svg>
  );
}

export function WeddingStage({
  lit,
  rich,
  children,
}: {
  /** The curtains are opening; bring the stage lights up with them. */
  lit: boolean;
  rich: boolean;
  children: React.ReactNode;
}) {
  const bokeh = useMemo(() => scatter(rich ? 13 : 5, 3313), [rich]);
  const motes = useMemo(() => scatter(rich ? 18 : 7, 8123), [rich]);
  const candles = useMemo(() => scatter(rich ? 9 : 4, 5519), [rich]);

  return (
    <div className={`stage-set ${lit ? "stage-lit" : ""}`}>
      {/* ── far: the room, and the architecture in it ─────────────────── */}
      <div className="stage-plane stage-far" aria-hidden="true">
        <span className="stage-air" />
        {/* three bays of a colonnade, only ever seen as soft verticals */}
        {[14, 30, 70, 86].map((x) => (
          <span key={x} className="stage-column" style={{ left: `${x}%` }} />
        ))}
        <span className="stage-halo" />
      </div>

      {/* ── mid: the arch, and the candlelight ───────────────────────── */}
      <div className="stage-plane stage-mid" aria-hidden="true">
        <Arch />
        {candles.map((p, i) => (
          <span
            key={i}
            className="stage-candle"
            style={{
              left: `${(6 + p.x * 88).toFixed(2)}%`,
              bottom: `${(4 + p.y * 34).toFixed(2)}%`,
              width: `${(2.6 + p.scale * 3.4).toFixed(2)}rem`,
              animationDuration: `${(3.4 + p.delay * 3).toFixed(1)}s`,
              animationDelay: `${(-p.span * 5).toFixed(1)}s`,
            }}
          />
        ))}
      </div>

      {/* ── the invitation, the one thing in focus ───────────────────── */}
      <div className="stage-subject">{children}</div>

      {/* ── near: what is too close to the lens to be sharp ──────────── */}
      <div className="stage-plane stage-near" aria-hidden="true">
        {bokeh.map((p, i) => (
          <span
            key={`b${i}`}
            className="stage-bokeh"
            style={{
              left: `${(p.x * 118 - 9).toFixed(2)}%`,
              top: `${(p.y * 118 - 9).toFixed(2)}%`,
              width: `${(2.6 + p.scale * 8).toFixed(2)}rem`,
              filter: `blur(${(8 + p.scale * 18).toFixed(1)}px)`,
              opacity: 0.05 + p.span * 0.12,
              animationDuration: `${(19 + p.delay * 16).toFixed(1)}s`,
              animationDelay: `${(-p.span * 24).toFixed(1)}s`,
            }}
          />
        ))}
        {motes.map((p, i) => (
          <span
            key={`m${i}`}
            className="stage-mote"
            style={{
              left: `${(p.x * 100).toFixed(2)}%`,
              top: `${(p.y * 100).toFixed(2)}%`,
              width: `${(1.6 + p.scale * 2.4).toFixed(2)}px`,
              opacity: 0.2 + p.span * 0.45,
              animationDuration: `${(15 + p.delay * 14).toFixed(1)}s`,
              animationDelay: `${(-p.span * 22).toFixed(1)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
