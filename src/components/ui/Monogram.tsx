"use client";

import { useEffect, useId, useState } from "react";
import {
  monogramFont,
  monogramStack,
  type MonogramFont,
} from "@/lib/monogram-fonts";

/**
 * The couple's monogram: their initials, set in Great Vibes and struck in foil.
 *
 * It was drawn before — an alphabet of centrelines, a pen that offset them into
 * ribbons, and an engraver's ruling cut into the broad strokes. That is in the
 * history if it is ever wanted again (`monogram-letters.ts`, up to `c51175d`).
 * A typeface is the better answer here and it is worth being clear why, because
 * "just use a font" is usually the wrong instinct for a mark like this:
 *
 * **Two letters is not enough surface to hide a drawing's faults.** A monogram
 * is one glyph pair at 236px on an otherwise empty card. Every join, every
 * width transition and every terminal is looked at directly, and a hand-built
 * alphabet has to be right at all of them. Great Vibes has had that work done
 * to it by a punchcutter, in every letter, and it holds up at the sizes this
 * mark is actually seen at.
 *
 * **The initials are data.** A couple can set them to anything from the
 * dashboard, in Latin or Khmer, and a drawn alphabet answers for exactly the
 * twenty-six letters somebody drew. Set in a face, `M`, `A & B` and a Khmer
 * pair are all the same code path.
 *
 * What the mark keeps from the drawn version is everything that was not the
 * letterforms: the foil is a real ramp with catchlights rather than a flat gold
 * fill; the light crosses it once when a guest first sees it; and the whole
 * thing is pressed into the paper rather than laid on top of it.
 */

/* ── Where things sit, in the 200-unit box the mark is drawn in ─────────── */

/**
 * The mark is drawn at a nominal size and the **viewBox is cut to fit it**.
 *
 * It used to be laid out inside a fixed 200×200 square, and that square was the
 * problem. Two initials are almost always wider than they are tall — a pair of
 * script capitals runs about two ems across and one down — so fitting them into
 * a square meant fitting them to the *width* and leaving half the height empty.
 * On a phone, where the mark is 172px wide, that put about 80px of actual ink
 * on the card with a band of nothing above and below it, and the monogram
 * looked small and lost on its own cover.
 *
 * Cut to the drawing, the box has no empty band to give away: the mark fills
 * whatever width it is given, and its height simply follows. Everything else in
 * here is expressed against that box rather than against 200, which is why the
 * gradients and the sweep take their coordinates from the layout.
 */
const NOMINAL = 100;
/** Air around the drawing, so a swash never touches the edge. */
const PAD = 8;
/** The ampersand: its share of the letter size, and the gap above it. */
const AMP_SHARE = 0.36;
const AMP_GAP = 10;
/** Great Vibes' `&`, measured — it is the only character always set in it. */
const AMP_INK = { asc: 719, desc: 47 };

/** A glyph's ink, per 1000 units of font size. */
type Ink = { asc: number; desc: number; left: number; right: number };

/**
 * How much room to leave under a face that claims not to need any.
 *
 * A capital's measured descent is the descent of *that capital*. Several faces
 * report none, which is true of the letter probed and not of the alphabet — a
 * Khmer subscript hangs well below the line, a script's J and G carry tails —
 * and an initial that happens to have one would print through the floor. Only
 * the SSR estimate leans on this; once the real letters are measured their own
 * descent is what the box is cut to.
 */
const FLOOR = { latin: 90, khmer: 140 };

/**
 * The layout, solved for a face and the ink of the letters actually being set.
 *
 * `lap` is what makes this a monogram rather than two letters: a formal script's
 * capitals carry swashes off both sides and are drawn to run into each other,
 * so overlapping them interleaves the pair. A serif's are not, and the same
 * overlap collides two solid letterforms into a blot; Khmer's are wide, upright
 * and stand clear. Each face carries its own figure.
 *
 * The overlap is taken against the **narrower** of the two letters and then
 * capped, because ink width is a poor proxy for where a letter's body ends. A
 * Great Vibes K is two thirds wider than its D — almost all of it exit swash —
 * so a generous fraction of the narrower letter still buries the wider one's
 * body under the other's. Half of the smaller letter is as far as this can go
 * before the pair stops reading as two letters.
 *
 * Everything is measured and placed on **ink**, never advance widths. A script
 * capital's advance has little to do with where its swashes actually reach, so
 * a pair centred on advances sits visibly off-centre and a pair *sized* on them
 * either overflows the card or floats in the middle of it.
 */
function layout(font: MonogramFont, inks: Ink[], hasAmp: boolean) {
  const asc = Math.max(...inks.map((i) => i.asc)) / 10;
  const desc = Math.max(...inks.map((i) => i.desc)) / 10;
  const widths = inks.map((i) => (i.left + i.right) / 10);

  /* Where each letter's ink starts, running left to right. */
  const starts: number[] = [];
  let cursor = 0;
  for (const [i, w] of widths.entries()) {
    starts.push(cursor);
    const next = widths[i + 1];
    cursor += next === undefined ? w : w - Math.min(font.lap, 0.5) * Math.min(w, next);
  }
  const ink = { w: starts[starts.length - 1] + widths[widths.length - 1], h: asc + desc };

  const ampSize = NOMINAL * AMP_SHARE;
  const ampH = hasAmp ? AMP_GAP + ((AMP_INK.asc + AMP_INK.desc) * ampSize) / 1000 : 0;

  return {
    size: NOMINAL,
    /** The viewBox, cut to the drawing. */
    vb: { w: ink.w + PAD * 2, h: ink.h + ampH + PAD * 2 },
    base: PAD + asc,
    /* `textAnchor` is "start", so each letter's origin is its ink start pushed
       back by however far its ink reaches to the *left* of that origin. */
    xs: starts.map((st, i) => PAD + st + inks[i].left / 10),
    amp: {
      size: ampSize,
      x: (ink.w + PAD * 2) / 2,
      y: PAD + ink.h + AMP_GAP + (AMP_INK.asc * ampSize) / 1000,
    },
  };
}

/**
 * The ink of one glyph, in a given face — measured, not estimated.
 *
 * A canvas is the only thing in a browser that will report where a glyph's ink
 * actually is: `getBBox()` on an SVG `<text>` gives the font's *layout* box, so
 * a script whose em is mostly empty space measures as overflowing a box it sits
 * comfortably inside.
 */
function measure(spec: string, chars: string[]): Ink[] | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return null;
  c.font = spec;
  const inks = chars.map((ch) => {
    const m = c.measureText(ch);
    return {
      asc: m.actualBoundingBoxAscent,
      desc: m.actualBoundingBoxDescent,
      left: m.actualBoundingBoxLeft,
      right: m.actualBoundingBoxRight,
    };
  });
  /* A measurement of nothing is worse than an estimate: a face that has not
     arrived yet reports zeroes, and a box cut to zero has no drawing in it. */
  return inks.every((i) => i.asc + i.desc > 0 && i.left + i.right > 0) ? inks : null;
}

/** The catalogue's figures, standing in until the real ones can be measured. */
function estimate(font: MonogramFont, n: number): Ink[] {
  return Array.from({ length: n }, () => ({
    asc: font.m.asc,
    desc: Math.max(font.m.desc, FLOOR[font.script]),
    left: 0,
    right: font.m.adv,
  }));
}

/* ── Composition ───────────────────────────────────────────────────────── */

type Composed =
  | { kind: "pair"; first: string; second: string; amp: boolean }
  | { kind: "run"; text: string };

/**
 * How the mark is laid out for whatever it has been given.
 *
 * Two initials interlock, which is the form this is built for. One initial
 * stands alone. Anything longer — a Khmer pair set as three or four characters,
 * a couple who typed their names — is set as one centred line, because a pair
 * needs exactly two things to interleave and inventing a third would change the
 * couple's initials.
 */
function compose(raw: string): Composed {
  const text = raw.trim();
  const amp = /^(.{1,2}?)\s*[&+·]\s*(.{1,2})$/u.exec(text);
  if (amp) return { kind: "pair", first: amp[1], second: amp[2], amp: true };

  const spaced = /^(\S{1,2})\s+(\S{1,2})$/u.exec(text);
  if (spaced) return { kind: "pair", first: spaced[1], second: spaced[2], amp: false };

  const glyphs = [...text];
  if (glyphs.length === 2) return { kind: "pair", first: glyphs[0], second: glyphs[1], amp: false };
  return { kind: "run", text: glyphs.slice(0, 5).join("") };
}

export function Monogram({
  text,
  groom,
  bride,
  font,
  className = "h-40 w-40",
  play = false,
}: {
  text?: string;
  groom?: string;
  bride?: string;
  /** The face's id from the catalogue; anything unknown falls back to default. */
  font?: string | null;
  className?: string;
  /**
   * Draw the mark in, once.
   *
   * Off by default, so the monogram is simply *there* wherever it is used as a
   * static ornament. The cover turns it on when the curtains start to part,
   * which is the moment a guest first sees it; started on mount it would play
   * out behind closed velvet and be over before anyone could watch it.
   */
  play?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const set = compose(text?.trim() || initials(groom, bride));
  const face = monogramFont(font);
  const chars = set.kind === "pair" ? [set.first, set.second] : [set.text];
  const box = layout(face, useInk(face, chars) ?? estimate(face, chars.length), set.kind === "pair" && set.amp);

  return (
    <svg
      viewBox={`0 0 ${box.vb.w.toFixed(1)} ${box.vb.h.toFixed(1)}`}
      className={`monogram ${play ? "monogram-draw" : ""} ${className}`}
      /* How far the sheen has to travel to cross a mark of this width. A fixed
         distance in the keyframe would under-run a wide mark and over-run a
         narrow one, and the sweep is meant to cross the drawing exactly once. */
      style={{ ["--mg-travel" as string]: `${(box.vb.w * 2.4).toFixed(1)}px` }}
      aria-hidden="true"
    >
      <defs>
        {/*
          * The foil: a diagonal ramp with two catchlights, so the light appears
          * to cross the mark rather than sit on it.
          *
          * `userSpaceOnUse`, and it matters. A gradient defaults to
          * `objectBoundingBox`, which measures it against *each element it
          * fills* — so two initials set side by side would each show the whole
          * ramp across their own few units, dark to bright to dark, and the
          * pair would come out as two separate pieces of metal rather than one.
          * Everything here is positioned with `x`/`y` rather than a transform
          * for the same reason: user space is the viewBox, so one sheet of foil
          * lies across the whole mark.
          *
          * Every stop falls back to `currentColor`, so the mark draws as a flat
          * silhouette wherever the theme's gold ramp is not defined rather than
          * disappearing into an unresolved `var()`.
          */}
        <linearGradient
          id={`mg-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={box.vb.w}
          y2={box.vb.h}
        >
          <stop offset="0" stopColor="var(--gold-deep, currentColor)" />
          <stop offset="0.12" stopColor="var(--gold-1, currentColor)" />
          <stop offset="0.26" stopColor="var(--gold-3, currentColor)" />
          <stop offset="0.33" stopColor="var(--gold-frame, currentColor)" />
          <stop offset="0.48" stopColor="var(--gold-1, currentColor)" />
          <stop offset="0.58" stopColor="var(--gold-lite, currentColor)" />
          <stop offset="0.68" stopColor="var(--gold-frame, currentColor)" />
          <stop offset="0.82" stopColor="var(--gold-3, currentColor)" />
          <stop offset="0.92" stopColor="var(--gold-1, currentColor)" />
          <stop offset="1" stopColor="var(--gold-deep, currentColor)" />
        </linearGradient>

        {/*
          * The band the sheen travels in.
          *
          * A mask rather than a blend mode: `screen` is inert on a light ground
          * (white is its identity) and `overlay` would lift the paper as much
          * as the foil. Masking a bright copy of the mark means only the gold
          * brightens, and only where the band is passing. Parked off the left
          * edge, so with the animation off nothing shows at all.
          */}
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.34" stopColor="#000" />
          <stop offset="0.44" stopColor="#888" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="0.56" stopColor="#888" />
          <stop offset="0.66" stopColor="#000" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask
          id={`sweep-${uid}`}
          maskUnits="userSpaceOnUse"
          x={-box.vb.w * 1.3}
          y={0}
          width={box.vb.w * 3.6}
          height={box.vb.h}
        >
          <rect
            className="mg-sweep"
            x={-box.vb.w * 1.3}
            y={0}
            width={box.vb.w * 1.2}
            height={box.vb.h}
            fill={`url(#sheen-${uid})`}
          />
        </mask>

        {set.kind === "pair" && (
          /*
           * What the first initial takes out of the second: a dilated copy of
           * it, so where the two overlap the paper shows through and the pair
           * reads as one crossing over the other. A halo painted round the
           * front letter would do the same job at the crossing and ring the
           * whole letter everywhere else.
           *
           * Under two units. A script's letters are *meant* to touch, and their
           * swashes run alongside each other for some distance wherever they
           * meet; cleared wide, the gap stops reading as an overlap and starts
           * reading as a piece missing out of the letter behind.
           */
          <mask
            id={`cut-${uid}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={box.vb.w}
            height={box.vb.h}
          >
            <rect x={0} y={0} width={box.vb.w} height={box.vb.h} fill="#fff" />
            <Letter ch={set.first} face={face} box={box} x={box.xs[0]} fill="#000" bump={2.2} />
          </mask>
        )}
      </defs>

      {/* the mark, in foil, pressed into the paper */}
      <g className="mg-foil" fill={`url(#mg-${uid})`}>
        <Mark set={set} uid={uid} face={face} box={box} />
      </g>

      {/*
        * The sheen: the same setting again in near-white, behind a band that
        * crosses it once.
        */}
      <g className="mg-sheen" mask={`url(#sweep-${uid})`} fill="rgb(255 251 240 / 0.85)">
        <Mark set={set} uid={uid} face={face} box={box} />
      </g>
    </svg>
  );
}

/** Everything the mark is made of. */
type Box = ReturnType<typeof layout>;

function Mark({
  set,
  uid,
  face,
  box,
}: {
  set: Composed;
  uid: string;
  face: MonogramFont;
  box: Box;
}) {
  if (set.kind === "run") {
    return (
      <g className="mg-first">
        <Letter ch={set.text} face={face} box={box} x={box.xs[0]} />
      </g>
    );
  }

  return (
    <>
      {/*
        * The second initial goes down first and the first crosses over it —
        * reading order for the eye, painting order for the overlap.
        */}
      <g className="mg-second" mask={`url(#cut-${uid})`}>
        <Letter ch={set.second} face={face} box={box} x={box.xs[1] ?? box.xs[0]} />
      </g>

      <g className="mg-first">
        <Letter ch={set.first} face={face} box={box} x={box.xs[0]} />
      </g>

      {set.amp && (
        <g className="mg-amp">
          {/*
            * The ampersand is always Great Vibes, whatever the initials are set
            * in. A Khmer face has no ampersand worth the name — several of
            * these print a box — and even among the Latin faces it is the one
            * character where the difference between a beautiful drawing and a
            * shrug is total. It is the only mark on the card that is not the
            * couple's own letters, so it can be the same in every setting.
            */}
          <Letter
            ch="&"
            face={AMPERSAND}
            box={box}
            x={box.amp.x}
            y={box.amp.y}
            size={box.amp.size}
            centred
          />
        </g>
      )}
    </>
  );
}

/**
 * One initial, centred on `x` and standing on the baseline.
 *
 * `textAnchor="middle"` centres it on its *advance width*, which is the only
 * thing available without measuring, and for a script that is close enough:
 * the swashes hang off both sides in roughly equal measure. The two initials
 * are then placed against each other by eye rather than by arithmetic, which
 * is what a compositor would do.
 */
function Letter({
  ch,
  face,
  box,
  x,
  y,
  size,
  fill,
  bump = 0,
  centred = false,
}: {
  ch: string;
  face: MonogramFont;
  box: Box;
  x: number;
  y?: number;
  size?: number;
  /** The ampersand is placed on the mark's axis; the letters are placed on ink. */
  centred?: boolean;
  /** Overridden only when this is being drawn into a knockout mask. */
  fill?: string;
  /** Extra weight, for that same knockout. */
  bump?: number;
}) {
  return (
    <text
      x={x}
      y={y ?? box.base}
      textAnchor={centred ? "middle" : "start"}
      fill={fill}
      stroke={bump ? fill : undefined}
      strokeWidth={bump || undefined}
      strokeLinejoin="round"
      style={{
        fontFamily: monogramStack(face),
        fontStyle: face.italic ? "italic" : "normal",
        fontWeight: 400,
        fontSize: `${size ?? box.size}px`,
      }}
    >
      {ch}
    </text>
  );
}

/**
 * The letters' real ink, once the face has arrived.
 *
 * The first render uses the catalogue's baked figures, because the server has
 * no canvas and the markup has to match what hydrates. Then this measures the
 * letters the couple actually set, in the face they actually chose, and the
 * mark re-fits — which is the only way to be exact, since the initials are data
 * and every face measures its own letters differently.
 *
 * There is no flash. Every one of these faces is declared `font-display:
 * block`, so the mark is invisible until its file has arrived, and this waits
 * on the same event; on the cover the monogram is not even revealed until the
 * curtains part, seconds later. Measuring before the font loads would measure
 * the fallback serif, which is why it waits rather than running on mount.
 */
function useInk(face: MonogramFont, chars: string[]): Ink[] | null {
  const [ink, setInk] = useState<Ink[] | null>(null);
  const key = `${face.id}:${chars.join("")}`;

  useEffect(() => {
    let alive = true;
    setInk(null);
    const spec = `${face.italic ? "italic " : ""}400 1000px ${monogramStack(face)}`;
    const text = chars.join("");
    const done = () => {
      if (!alive) return;
      const m = measure(spec, chars);
      if (m) setInk(m);
    };
    /* `fonts.load` resolves when the faces this text needs are usable — or
       rejects, on a network that never answers, in which case the baked
       estimate is what the guest keeps and the mark is merely approximate
       rather than absent. */
    document.fonts?.load(spec, text).then(done, done) ?? done();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ink;
}

/** The face the ampersand is always set in. */
const AMPERSAND = monogramFont("great-vibes");

function initials(groom?: string, bride?: string) {
  const first = (value?: string) => (value?.trim()?.split(/\s+/).pop() ?? "").charAt(0);
  const pair = `${first(groom)}${first(bride)}`;
  return pair.trim() ? pair : "♥";
}
