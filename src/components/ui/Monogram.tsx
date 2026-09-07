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
 * The box the initials are fitted into, and the row the ampersand stands on.
 *
 * Nothing here is a font size, and that is the point. Twenty faces are on offer
 * and no two measure alike — Great Vibes puts 83% of the em above the baseline
 * and a tail 39% below; Playfair 73% and almost nothing; Moul's ស is a third
 * wider than its ក. Set at one size they would range from running off the card
 * to sitting in the middle of it like a postage stamp. So the *box* is fixed
 * and the size is solved for.
 */
const BOX = {
  w: 178,
  cx: 100,
  /* With an ampersand the letters give up the bottom of the box to it; without
     one they have the whole square. Reserving the row either way leaves a Khmer
     pair — which has no ampersand and few descenders — sitting in the top half
     of the card with an empty strip under it. */
  amp: { h: 136, cy: 76 },
  plain: { h: 168, cy: 100 },
};
/** Where the ampersand's own baseline sits, and its share of the letter size. */
const AMP_BASE = 183;
const AMP_SHARE = 0.36;

/** A glyph's ink, per 1000 units of font size. */
type Ink = { asc: number; desc: number; left: number; right: number };

/**
 * How much room to leave under a face that claims not to need any.
 *
 * A capital's measured descent is the descent of *that capital*. Several faces
 * report none, which is true of the letter probed and not of the alphabet — a
 * Khmer subscript hangs well below the line, a script's J and G carry tails —
 * and an initial that happens to have one would print through the floor.
 */
const FLOOR = { latin: 120, khmer: 170 };

/**
 * The layout, solved for a face and the ink of the letters actually being set.
 *
 * `lap` is what makes this a monogram rather than two letters: a formal script's
 * capitals carry swashes off both sides and are drawn to run into each other,
 * so overlapping them interleaves the pair. A serif's are not, and the same
 * overlap collides two solid letterforms into a blot; Khmer's are wide, upright
 * and stand clear. Each face carries its own figure.
 *
 * Everything is measured and placed on **ink**, never on advance widths. A
 * script capital's advance has little to do with where its swashes actually
 * reach — Great Vibes' S carries ink a long way left of its own origin — so a
 * pair centred on advances sits visibly off-centre, and a pair *sized* on them
 * either overflows the card or floats in the middle of it.
 */
function layout(font: MonogramFont, inks: Ink[], hasAmp: boolean) {
  const room = hasAmp ? BOX.amp : BOX.plain;
  const asc = Math.max(...inks.map((i) => i.asc));
  const desc = Math.max(...inks.map((i) => i.desc));
  const widths = inks.map((i) => (i.left + i.right) / 1000);

  /* Where each letter's ink starts, in em, running left to right. */
  const starts: number[] = [];
  let cursor = 0;
  for (const [i, w] of widths.entries()) {
    starts.push(cursor);
    const next = widths[i + 1];
    cursor += next === undefined ? w : w - font.lap * Math.min(w, next);
  }
  const wide = starts[starts.length - 1] + widths[widths.length - 1];

  /*
   * Two heights, and they do different jobs.
   *
   * `safe` includes the floor, and it is what the *size* is solved against, so
   * a face whose next initial has a tail cannot print through the bottom of the
   * card. `real` is what the letters actually occupy, and it is what the mark is
   * *centred* on — centre it on the safe height instead and a Khmer pair, which
   * has almost no descent, floats above the middle of the box with a strip of
   * reserved paper under it that nothing ever uses.
   */
  const real = (asc + desc) / 1000;
  const safe = (asc + Math.max(desc, FLOOR[font.script])) / 1000;
  const size = Math.min(BOX.w / wide, room.h / safe);
  const top = room.cy - (size * real) / 2;

  return {
    size,
    base: top + (size * asc) / 1000,
    /* `textAnchor` is "start", so each letter's origin is its ink start pushed
       back by however far its ink reaches to the *left* of that origin. */
    xs: starts.map((st, i) => BOX.cx - (size * wide) / 2 + size * st + (size * inks[i].left) / 1000),
    amp: size * AMP_SHARE,
  };
}

/**
 * The ink of one glyph, in a given face — measured, not estimated.
 *
 * A canvas is the only thing in a browser that will report where a glyph's ink
 * actually is: `getBBox()` on an SVG `<text>` gives the font's *layout* box, so
 * a script whose em is mostly empty space measures as overflowing a box it sits
 * comfortably inside. This is the same measurement the catalogue's baked
 * figures came from, run again on the letters the couple actually chose.
 */
function measure(spec: string, chars: string[]): Ink[] | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return null;
  c.font = spec;
  return chars.map((ch) => {
    const m = c.measureText(ch);
    return {
      asc: m.actualBoundingBoxAscent,
      desc: m.actualBoundingBoxDescent,
      left: m.actualBoundingBoxLeft,
      right: m.actualBoundingBoxRight,
    };
  });
}

/** The catalogue's figures, standing in until the real ones can be measured. */
function estimate(font: MonogramFont, n: number): Ink[] {
  return Array.from({ length: n }, () => ({
    asc: font.m.asc,
    desc: font.m.desc,
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
      viewBox="0 0 200 200"
      className={`monogram ${play ? "monogram-draw" : ""} ${className}`}
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
          x1="14"
          y1="8"
          x2="186"
          y2="192"
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
        <mask id={`sweep-${uid}`} maskUnits="userSpaceOnUse" x="-260" y="-20" width="720" height="240">
          <rect className="mg-sweep" x="-260" y="-20" width="240" height="240" fill={`url(#sheen-${uid})`} />
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
          <mask id={`cut-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
            <rect x="0" y="0" width="200" height="200" fill="#fff" />
            <Letter ch={set.first} face={face} box={box} x={box.xs[0]} fill="#000" bump={2.4} />
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
            x={BOX.cx}
            y={AMP_BASE}
            size={box.amp}
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
