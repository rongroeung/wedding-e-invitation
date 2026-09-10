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
/**
 * How far every mask region is bled past the viewBox, as a fraction of it.
 *
 * A mask clips. The mark is measured at render time and is occasionally a
 * little larger than the box computed for it — which `overflow: visible` is
 * there to forgive — so every mask has to cover more ground than the drawing
 * can possibly reach. Half a box in each direction is far past any script's
 * longest swash and costs nothing: the masks are filled with a flat rect and a
 * single glyph either way.
 */
const BLEED = 0.5;

const NOMINAL = 100;
/** Air around the drawing, so a swash never touches the edge. */
/**
 * Headroom between the drawing and the edge of the viewBox.
 *
 * It was raised to 12 while the monogram was being cut on iPhones and nobody
 * could see why — margin is the right instinct when the cause is unknown. The
 * cause is known now (see `Bounds`: a filter and a mask were being clipped to
 * WebKit's bounding box for the text, which leaves out a script's swashes), so
 * the mark gets its designed size back.
 */
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
function layout(font: MonogramFont, inks: Ink[], frame: Ink[], hasAmp: boolean) {
  const span = (list: Ink[]) => {
    const asc = Math.max(...list.map((i) => i.asc)) / 10;
    const desc = Math.max(...list.map((i) => i.desc)) / 10;
    const widths = list.map((i) => (i.left + i.right) / 10);
    const starts: number[] = [];
    let cursor = 0;
    for (const [i, w] of widths.entries()) {
      starts.push(cursor);
      const next = widths[i + 1];
      cursor += next === undefined ? w : w - Math.min(font.lap, 0.5) * Math.min(w, next);
    }
    return {
      asc,
      desc,
      starts,
      w: starts[starts.length - 1] + widths[widths.length - 1],
      h: asc + desc,
    };
  };

  /*
   * Two spans, and they are not the same thing.
   *
   * `box` is built from the catalogue's figures — the widest and tallest
   * capitals of this face — so it is a size no pair of initials in this font
   * can exceed. `art` is the letters actually being set, measured. The viewBox
   * is cut to the **box**; the drawing is laid out from **art** and centred
   * inside it.
   *
   * Splitting them is what makes a wrong measurement harmless. Cut the viewBox
   * to the measurement and a measurement that comes back short — a canvas still
   * reporting the fallback face, which is a thing Safari does — takes the tops
   * off the letters, and no amount of `overflow` on an SVG is reliable enough
   * to lean on across browsers. Cut it to the worst case instead and the same
   * bad measurement can only make the mark a little small inside a box that is
   * still the right shape. It also means the element's intrinsic aspect ratio
   * is fixed from the server's first render, so the card never reflows when the
   * font finally lands.
   */
  const box = span(frame);
  const art = span(inks);

  const ampSize = NOMINAL * AMP_SHARE;
  const ampH = hasAmp ? AMP_GAP + ((AMP_INK.asc + AMP_INK.desc) * ampSize) / 1000 : 0;
  /* A few per cent of slack, because the catalogue's figures come from a spread
     of capitals and not from all of them. */
  const room = { w: box.w * 1.04, h: box.h * 1.04 };
  const vb = { w: room.w + PAD * 2, h: room.h + ampH + PAD * 2 };

  /*
   * If the letters actually measured are larger than the worst case the
   * catalogue promised, the mark is set a little smaller so that it still fits.
   *
   * The box is deliberately not grown to meet it, and that is the point of
   * doing it this way round. The viewBox is what gives the element its
   * intrinsic aspect ratio, and it is fixed at the server's first render;
   * growing it when the measurement lands would reflow the card under the
   * guest a second after they arrived. Scaling the drawing changes nothing but
   * the drawing.
   *
   * And the alternative to both is what was shipped: let the mark overflow and
   * rely on `overflow: visible` to show it. That is not a promise a page can
   * keep. Anything above it with `overflow: hidden` — a card, a scroll region,
   * a rounded panel — cuts it, and whether it does depends on how much room the
   * mark has, which is why this only ever showed on a phone, where the cover is
   * tight, and never on a desktop, where it is not. **A drawing that stays
   * inside its own box cannot be clipped by anything.**
   *
   * A measurement that comes back *short* is still harmless, because `fit` is
   * capped at 1: it can shrink the mark to fit, never inflate it to fill.
   */
  const fit = Math.min(1, room.w / art.w, room.h / art.h);
  const aw = art.w * fit;
  const ah = art.h * fit;

  const left = vb.w / 2 - aw / 2;
  const top = PAD + (room.h - ah) / 2;

  return {
    size: NOMINAL * fit,
    vb,
    base: top + art.asc * fit,
    /* `textAnchor` is "start", so each letter's origin is its ink start pushed
       back by however far its ink reaches to the *left* of that origin. */
    xs: art.starts.map((st, i) => left + (st + inks[i].left / 10) * fit),
    amp: {
      size: ampSize,
      x: vb.w / 2,
      y: PAD + room.h + AMP_GAP + (AMP_INK.asc * ampSize) / 1000,
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

  const ink = (font: string) => {
    c.font = font;
    return chars.map((ch) => {
      const m = c.measureText(ch);
      return {
        asc: m.actualBoundingBoxAscent,
        desc: m.actualBoundingBoxDescent,
        left: m.actualBoundingBoxLeft,
        right: m.actualBoundingBoxRight,
      };
    });
  };

  const inks = ink(spec);
  /* A measurement of nothing is worse than an estimate: a box cut to zero has
     no drawing in it. */
  if (!inks.every((i) => i.asc + i.desc > 0 && i.left + i.right > 0)) return null;

  /*
   * Is it actually *this* face we just measured?
   *
   * `document.fonts.load()` resolving is not the same as the face being the one
   * a canvas will use, and Safari in particular will hand back a resolved
   * promise while `measureText` is still reporting the fallback. Measuring the
   * fallback and cutting the box to *it* is the worst of both worlds: the text
   * then draws in a face that is taller and wider than the box it was given,
   * and the top of every letter is sliced off — which is exactly what a
   * reported monogram looked like on a phone and never once on a desktop,
   * because the desktop had the font in cache before the component mounted.
   *
   * The same string measured in a bare `serif` is the tell. Identical numbers
   * to the last pixel across every letter mean nothing has loaded yet.
   */
  const plain = ink(spec.replace(/px .*/, "px serif"));
  const same = inks.every(
    (a, i) =>
      a.asc === plain[i].asc &&
      a.desc === plain[i].desc &&
      a.left === plain[i].left &&
      a.right === plain[i].right,
  );
  return same ? null : inks;
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
  const frame = estimate(face, chars.length);
  const box = layout(face, useInk(face, chars) ?? frame, frame, set.kind === "pair" && set.amp);
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
          y={-box.vb.h * BLEED}
          width={box.vb.w * 3.6}
          height={box.vb.h * (1 + BLEED * 2)}
        >
          <rect
            className="mg-sweep"
            x={-box.vb.w * 1.3}
            y={-box.vb.h * BLEED}
            width={box.vb.w * 1.2}
            height={box.vb.h * (1 + BLEED * 2)}
            fill={`url(#sheen-${uid})`}
          />
        </mask>

        {/*
          * The shadow that lifts the foil off the paper.
          *
          * `userSpaceOnUse`, with the region bled half a box past the viewBox
          * in every direction, and both of those are the fix rather than
          * decoration. A filter region **clips** — everything outside it is
          * simply not drawn — and the default region is a percentage of the
          * object bounding box, which WebKit computes tighter than Blink. As a
          * CSS `drop-shadow()` on this same group it took the last swash off
          * the mark on every iPhone while looking perfect on every desktop.
          * Pinned to the user space and bled, there is no bounding box left to
          * disagree about.
          */}
        <filter
          id={`lift-${uid}`}
          filterUnits="userSpaceOnUse"
          x={-box.vb.w * BLEED}
          y={-box.vb.h * BLEED}
          width={box.vb.w * (1 + BLEED * 2)}
          height={box.vb.h * (1 + BLEED * 2)}
        >
          <feDropShadow className="mg-lift" dx="0" dy="0.9" stdDeviation="0.55" />
        </filter>

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
            /*
             * The region is bled well past the viewBox, and that is the whole
             * point of these four numbers.
             *
             * **A mask region is a clip.** Anything outside it is not merely
             * unmasked, it is erased — and this mask is worn by the second
             * initial alone. So a mark whose drawing runs past the viewBox came
             * out with its first letter whole and its second letter sliced off
             * at the box edge: one hard straight cut through a script capital,
             * on a pair that looked perfectly centred. Reported as "the
             * monogram renders incomplete", and the giveaway is that it is
             * always the *second* letter, because the first one wears no mask.
             *
             * `.monogram` carries `overflow: visible` precisely so that a mark
             * a shade larger than its computed box is drawn slightly proud
             * rather than clipped — and that promise was quietly cancelled
             * here, one element deep, by a mask region nobody thought of as
             * geometry. The viewBox is a *view*; a mask is a *scissors*. They
             * must never be given the same numbers.
             */
            x={-box.vb.w * BLEED}
            y={-box.vb.h * BLEED}
            width={box.vb.w * (1 + BLEED * 2)}
            height={box.vb.h * (1 + BLEED * 2)}
          >
            <rect
              x={-box.vb.w * BLEED}
              y={-box.vb.h * BLEED}
              width={box.vb.w * (1 + BLEED * 2)}
              height={box.vb.h * (1 + BLEED * 2)}
              fill="#fff"
            />
            <Letter ch={set.first} face={face} box={box} x={box.xs[0]} fill="#000" bump={2.2} />
          </mask>
        )}
      </defs>

      {/* the mark, in foil, pressed into the paper */}
      <g className="mg-foil" fill={`url(#mg-${uid})`} filter={`url(#lift-${uid})`}>
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

/**
 * Invisible geometry that tells the browser how big this group really is.
 *
 * This is the fix for the bug that survived six rounds, and it is worth setting
 * out in full because nothing about it is guessable from the symptom.
 *
 * A `<filter>` and a `<mask>` both clip: whatever falls outside their region is
 * not drawn. Their region is a percentage of the **object bounding box** of the
 * element wearing them — and WebKit's bounding box for `<text>` is the *advance*
 * of the glyphs, which for a formal script excludes the swashes that run past
 * it. Blink includes them. So the same mark, from the same geometry, keeps its
 * last flourish in Chrome and has it sliced off at a hard vertical edge in
 * Safari.
 *
 * That is why every earlier fix missed. The drawing was never too large for its
 * viewBox; making it smaller, padding the box, bleeding the mask regions and
 * measuring the layout box all left the *bounding box of the text* exactly as
 * wrong as it was, and the clip with it.
 *
 * A rectangle with no paint still counts as geometry, so one spanning the whole
 * viewBox — and a little past it, for the shadow — makes the group's bounding
 * box the box we intended all along, in every engine. It draws nothing and
 * takes no events. It is here purely so that the browser stops asking the font
 * how wide the mark is.
 */
function Bounds({ box }: { box: Box }) {
  return (
    <rect
      x={-box.vb.w * BLEED}
      y={-box.vb.h * BLEED}
      width={box.vb.w * (1 + BLEED * 2)}
      height={box.vb.h * (1 + BLEED * 2)}
      fill="none"
      stroke="none"
      pointerEvents="none"
    />
  );
}

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
      <>
        <Bounds box={box} />
        <g className="mg-first">
          <Letter ch={set.text} face={face} box={box} x={box.xs[0]} />
        </g>
      </>
    );
  }

  return (
    <>
      {/* See `Bounds`: without it a filter or mask on any of this is cut to
          WebKit's idea of how wide the text is, which leaves out the swashes. */}
      <Bounds box={box} />
      {/*
        * The second initial goes down first and the first crosses over it —
        * reading order for the eye, painting order for the overlap.
        */}
      <g className="mg-second" mask={`url(#cut-${uid})`}>
        {/* This group wears the knockout, so it needs its own honest bounds. */}
        <Bounds box={box} />
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
    /*
     * Try, then keep trying for as long as it is worth trying.
     *
     * `fonts.load` resolving is the first chance to measure, `fonts.ready` the
     * second, and a few animation frames after that the third — because a face
     * can become active between any two of them and a single attempt that lands
     * a frame early cuts the box to the wrong font. Each attempt is cheap (one
     * canvas, a handful of `measureText` calls) and they stop the moment one
     * succeeds. If none does — a network that never answers — the baked
     * estimate is what the guest keeps, and the mark is approximate rather than
     * clipped.
     */
    let tries = 0;
    const attempt = () => {
      if (!alive || tries++ > 12) return;
      const m = measure(spec, chars);
      if (m) {
        setInk(m);
        return;
      }
      requestAnimationFrame(attempt);
    };
    document.fonts?.load(spec, text).then(attempt, attempt) ?? attempt();
    document.fonts?.ready.then(attempt, () => undefined);
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
