/**
 * The botanical relief pressed into the envelope's paper.
 *
 * This is a **blind emboss**: no ink and no foil, only the paper pushed up out
 * of its own plane. So there is no colour anywhere in here, and — the part that
 * is easy to get wrong — there is no *fill* either. A raised area of paper is
 * still the same paper. What you see of it is one lit edge where the surface
 * turns towards the light and one shadowed edge where it turns away, and
 * nothing at all in between.
 *
 * So every shape is struck three times, not twice:
 *
 *   1. the shade, offset down and right;
 *   2. the light, offset up and left;
 *   3. **the paper itself, at no offset** — covering the middle of both and
 *      leaving only the two crescents standing.
 *
 * Take the third pass away and the flowers fill in solid white, which is what a
 * sticker looks like rather than an emboss. The knockout is the whole effect.
 *
 * The third pass fills but does **not** stroke, and that asymmetry is doing a
 * second job. Every line in the drawing — a vein, a petal's crease, a stem, the
 * outline between one petal and the next — survives the knockout as a pair of
 * hairlines a few units apart, light above and dark below, which is precisely
 * what a scored fold in paper looks like. Knock out the strokes as well and the
 * blooms collapse into featureless lumps, because a flower's petals are only
 * told apart by the creases between them. `--emb-line` is how that is arranged:
 * the two struck passes set it to their own colour and the knockout sets it to
 * `none`.
 *
 * It is drawn, not tiled. A repeating tile announces itself the moment the
 * viewer finds the seam, and on something this size the seam is always found;
 * one arrangement composed to the face reads as a die cut for this envelope.
 * All three faces share one coordinate space — the whole envelope, 1000 across
 * and 1280 down — so a stem that runs off the flap continues on the pocket
 * beneath it, exactly as it would on a sheet embossed before it was folded.
 *
 * Everything grows from three primitives — a petal, a leaf and a bud — placed,
 * turned and scaled. One hand, many placements.
 */

/* ── the primitives, drawn at the origin, opening upward ─────────────── */

/**
 * One petal of an open bloom: broad in the shoulder, waisted at the base, and
 * very slightly notched at the tip. The notch is two units deep and it is the
 * difference between a flower and a daisy stamp.
 */
const PETAL = [
  "M0 0",
  "C-9 -7 -16 -19 -15 -30",
  "C-14 -40 -8 -45 -3.5 -42",
  "C-1.5 -40.5 -0.5 -38.5 0 -36",
  "C0.5 -38.5 1.5 -40.5 3.5 -42",
  "C8 -45 14 -40 15 -30",
  "C16 -19 9 -7 0 0",
  "Z",
].join(" ");

/** A leaf: an almond drawn out to a tip. */
const LEAF =
  "M0 0 C-14 -10 -21 -27 -18 -43 C-15 -55 -6 -62 0 -68 C6 -62 15 -55 18 -43 C21 -27 14 -10 0 0 Z";

/** A closed bud, held in two sepals. */
const BUD = "M0 0 C-8 -6 -11 -17 -8 -27 C-6 -34 -2 -37 0 -40 C2 -37 6 -34 8 -27 C11 -17 8 -6 0 0 Z";

/**
 * A raised area, and a scored line. Both are written against two custom
 * properties rather than fixed paints, which is what lets one copy of the
 * drawing be struck five different ways — see `BotanicalArt`.
 */
const raised = {
  fill: "var(--emb-fill)",
  stroke: "var(--emb-line)",
  strokeWidth: 1.1,
} as const;

const scored = (w: number) =>
  ({ fill: "none", stroke: "var(--emb-line)", strokeWidth: w }) as const;

/**
 * An open bloom. Five petals, and behind them five more turned half a step so
 * the gaps of the front row are filled — which is what stops five petals
 * reading as a star. Each front petal carries a crease down its middle: on a
 * real die that crease is a second, shallower depth, and without it a petal is
 * a flat plate.
 */
function Bloom({ transform, petals = 5 }: { transform: string; petals?: number }) {
  const step = 360 / petals;
  return (
    <g transform={transform}>
      {/* the back row, smaller and set between */}
      {Array.from({ length: petals }, (_, i) => (
        <path
          key={`b${i}`}
          d={PETAL}
          {...raised}
          transform={`rotate(${i * step + step / 2}) scale(0.78)`}
        />
      ))}
      {Array.from({ length: petals }, (_, i) => (
        <g key={`f${i}`} transform={`rotate(${i * step})`}>
          <path d={PETAL} {...raised} />
          <path d="M0 -9 C-1.5 -17 -1.5 -25 0 -33" {...scored(1.3)} />
        </g>
      ))}
      {/* the eye, and a ring of stamen heads around it */}
      <circle r={6.5} {...raised} />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={`s${i}`} r={2} cy={-11.5} fill="var(--emb-fill)" transform={`rotate(${i * 40})`} />
      ))}
    </g>
  );
}

/** A leaf with its midrib and four pairs of veins. */
function Leaflet({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path d={LEAF} {...raised} />
      <path d="M0 -3 L0 -64" {...scored(1.7)} />
      {[-15, -28, -41, -52].map((y, i) => (
        <g key={i} {...scored(1.2)}>
          <path d={`M0 ${y} C-6 ${y - 4} -10 ${y - 9} -13 ${y - 15}`} />
          <path d={`M0 ${y} C6 ${y - 4} 10 ${y - 9} 13 ${y - 15}`} />
        </g>
      ))}
    </g>
  );
}

/**
 * A sprig: a stem with leaves set alternately along it and a bud at the tip.
 * The stem is a real curve and each leaf is turned to the angle the curve has
 * where it is attached, which is why the sprig reads as one growing thing
 * rather than as leaves posted along a line.
 */
function Sprig({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M0 0 C7 -36 3 -72 -8 -106 C-17 -134 -21 -156 -19 -178"
        {...scored(2.4)}
      />
      <Leaflet transform="translate(3 -20) rotate(62) scale(0.58)" />
      <Leaflet transform="translate(2 -30) rotate(-58) scale(0.54)" />
      <Leaflet transform="translate(5 -50) rotate(66) scale(0.5)" />
      <Leaflet transform="translate(1 -62) rotate(-62) scale(0.46)" />
      <Leaflet transform="translate(-4 -82) rotate(68) scale(0.42)" />
      <Leaflet transform="translate(-10 -98) rotate(-60) scale(0.38)" />
      <Leaflet transform="translate(-15 -122) rotate(58) scale(0.34)" />
      <Leaflet transform="translate(-18 -142) rotate(-52) scale(0.3)" />
      <path d={BUD} {...raised} transform="translate(-19 -178) rotate(-6) scale(0.58)" />
    </g>
  );
}

/** A short spray of buds on fine stems. */
function BudSpray({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M0 0 C-2 -22 -4 -42 -2 -58 M0 -16 C-13 -24 -22 -35 -26 -48 M0 -28 C13 -37 21 -48 24 -60"
        {...scored(1.9)}
      />
      <path d={BUD} {...raised} transform="translate(-2 -58) scale(0.46)" />
      <path d={BUD} {...raised} transform="translate(-26 -48) rotate(-30) scale(0.4)" />
      <path d={BUD} {...raised} transform="translate(24 -60) rotate(26) scale(0.42)" />
      <Leaflet transform="translate(-4 -14) rotate(-74) scale(0.3)" />
      <Leaflet transform="translate(4 -22) rotate(78) scale(0.28)" />
    </g>
  );
}

/**
 * The two shoulders either side of the closed flap.
 *
 * These are the side flaps, folded in behind the top one. They are a small
 * sliver of paper and it would be easy to leave them bare — which is exactly
 * why they must not be: two undecorated corners on an envelope covered in
 * relief read as a fault in the die rather than as restraint.
 */
function BackArrangement() {
  return (
    <>
      <Bloom transform="translate(88 168) rotate(-20) scale(1.04)" />
      <Sprig transform="translate(206 296) rotate(-150) scale(0.74)" />
      <Leaflet transform="translate(34 288) rotate(34) scale(0.68)" />
      <BudSpray transform="translate(158 300) rotate(-18) scale(0.68)" />
      <Leaflet transform="translate(60 80) rotate(-52) scale(0.56)" />

      <Bloom transform="translate(914 182) rotate(18) scale(1)" />
      <Sprig transform="translate(796 308) rotate(150) scale(0.72)" />
      <Leaflet transform="translate(968 296) rotate(-32) scale(0.66)" />
      <BudSpray transform="translate(846 306) rotate(16) scale(0.66)" />
      <Leaflet transform="translate(942 92) rotate(50) scale(0.54)" />
    </>
  );
}

/**
 * The arrangement on the pocket — the paper below the flap.
 *
 * Dense at the sides and across the foot and thinner through the middle, where
 * the seal sits and the bottom flap's two creases cross. A die that crowds
 * either of them makes all three harder to read; a die that leaves the sides
 * bare makes the envelope look half finished.
 */
function PocketArrangement({ dense }: { dense: boolean }) {
  return (
    <>
      {/* the left side, from the mouth down */}
      <Bloom transform="translate(118 470) rotate(-14) scale(1.34)" />
      <Sprig transform="translate(84 668) rotate(-10) scale(1.24)" />
      <Leaflet transform="translate(232 560) rotate(38) scale(1)" />
      <BudSpray transform="translate(252 428) rotate(16) scale(1.14)" />
      <Bloom transform="translate(64 800) rotate(26) scale(0.94)" petals={6} />
      <Leaflet transform="translate(196 728) rotate(-58) scale(0.8)" />
      <Sprig transform="translate(228 900) rotate(18) scale(0.9)" />
      <BudSpray transform="translate(126 906) rotate(-24) scale(0.84)" />
      <Leaflet transform="translate(38 620) rotate(64) scale(0.72)" />

      {/* the right side */}
      <Bloom transform="translate(890 518) rotate(20) scale(1.22)" />
      <Sprig transform="translate(922 710) rotate(12) scale(1.26)" />
      <Leaflet transform="translate(766 600) rotate(-42) scale(0.94)" />
      <BudSpray transform="translate(748 456) rotate(-20) scale(1.06)" />
      <Bloom transform="translate(946 838) rotate(-22) scale(0.9)" petals={6} />
      <Leaflet transform="translate(812 754) rotate(56) scale(0.78)" />
      <Sprig transform="translate(778 928) rotate(-16) scale(0.88)" />
      <BudSpray transform="translate(884 934) rotate(22) scale(0.82)" />
      <Leaflet transform="translate(968 646) rotate(-62) scale(0.7)" />

      {/* across the foot */}
      <Bloom transform="translate(196 1046) rotate(10) scale(1.16)" />
      <Sprig transform="translate(378 1180) rotate(-26) scale(1.08)" />
      <Bloom transform="translate(806 1094) rotate(-16) scale(1.2)" />
      <Sprig transform="translate(628 1198) rotate(24) scale(1.02)" />
      <Leaflet transform="translate(506 1142) rotate(6) scale(0.84)" />
      <BudSpray transform="translate(302 1222) rotate(-8) scale(0.9)" />
      <BudSpray transform="translate(704 1230) rotate(10) scale(0.86)" />
      <Leaflet transform="translate(96 1156) rotate(-34) scale(0.7)" />
      <Leaflet transform="translate(910 1176) rotate(32) scale(0.68)" />
      <Bloom transform="translate(500 1256) rotate(0) scale(0.8)" />

      {dense && (
        <>
          {/* the quieter middle, filled in only for the richer styles */}
          <Leaflet transform="translate(330 660) rotate(48) scale(0.62)" />
          <Leaflet transform="translate(672 690) rotate(-46) scale(0.6)" />
          <BudSpray transform="translate(446 540) rotate(-6) scale(0.8)" />
          <BudSpray transform="translate(566 508) rotate(10) scale(0.74)" />
          <Leaflet transform="translate(292 1020) rotate(-24) scale(0.56)" />
          <Leaflet transform="translate(712 1042) rotate(22) scale(0.54)" />
          <Bloom transform="translate(390 812) rotate(16) scale(0.62)" petals={6} />
          <Bloom transform="translate(614 842) rotate(-14) scale(0.6)" petals={6} />
          <Leaflet transform="translate(500 940) rotate(4) scale(0.5)" />
        </>
      )}
    </>
  );
}

/**
 * The arrangement on the flap.
 *
 * The flap narrows to a point, so the die has to narrow with it: weight in the
 * two shoulders and nothing in the last third. Anything placed down there is
 * cut in half by the fold and left looking unfinished.
 */
function FlapArrangement({ dense }: { dense: boolean }) {
  return (
    <>
      <Bloom transform="translate(188 132) rotate(-18) scale(1.26)" />
      <Sprig transform="translate(322 248) rotate(-124) scale(1.04)" />
      <Leaflet transform="translate(288 58) rotate(30) scale(0.86)" />
      <BudSpray transform="translate(108 254) rotate(-44) scale(0.96)" />
      <Bloom transform="translate(46 116) rotate(24) scale(0.78)" petals={6} />
      <Leaflet transform="translate(158 232) rotate(-70) scale(0.64)" />
      <BudSpray transform="translate(324 96) rotate(28) scale(0.66)" />

      <Bloom transform="translate(818 146) rotate(16) scale(1.22)" />
      <Sprig transform="translate(686 260) rotate(124) scale(1)" />
      <Leaflet transform="translate(718 70) rotate(-28) scale(0.84)" />
      <BudSpray transform="translate(898 262) rotate(42) scale(0.92)" />
      <Bloom transform="translate(958 126) rotate(-22) scale(0.76)" petals={6} />
      <Leaflet transform="translate(848 240) rotate(68) scale(0.62)" />
      <BudSpray transform="translate(676 104) rotate(-26) scale(0.64)" />

      {dense && (
        <>
          <Leaflet transform="translate(446 124) rotate(-58) scale(0.68)" />
          <Leaflet transform="translate(562 130) rotate(58) scale(0.66)" />
          <BudSpray transform="translate(504 54) rotate(0) scale(0.66)" />
          <Bloom transform="translate(418 266) rotate(22) scale(0.7)" petals={6} />
          <Bloom transform="translate(588 274) rotate(-20) scale(0.68)" petals={6} />
          <Leaflet transform="translate(504 196) rotate(2) scale(0.54)" />
        </>
      )}
    </>
  );
}

const ARRANGEMENT = {
  pocket: PocketArrangement,
  flap: FlapArrangement,
  back: BackArrangement,
};

export type BotanicalFace = keyof typeof ARRANGEMENT;

/**
 * The relief as bare geometry, for a caller that already has an SVG of its own.
 *
 * The offset between the three passes is in viewBox units rather than pixels,
 * so the depth scales with the envelope — shallower on a phone, deeper on a
 * desktop, which is what happens when you bring a real card closer to your eye.
 */
export function BotanicalArt({
  face,
  dense = false,
  /**
   * What the paper is, for the knockout. It has to be an actual colour and not
   * `transparent`: the pass exists to cover the middle of the two struck copies
   * back up again.
   */
  paper = "var(--env-paper)",
  /**
   * Distinguishes two copies of the same die on one page.
   *
   * The gatefold draws the *same* arrangement into two separate SVGs, one per
   * panel, so both would otherwise define `emb-pocket` and both `<use>` would
   * resolve to whichever came first in the document — and a `<use>` pointing
   * into a different `<svg>` renders nothing at all. Ids are global; the copies
   * have to say which one they are.
   */
  copy = "",
}: {
  face: BotanicalFace;
  dense?: boolean;
  paper?: string;
  copy?: string;
}) {
  const Art = ARRANGEMENT[face];
  /*
   * Defined once and instanced five times.
   *
   * Five passes over an arrangement this dense is a few thousand nodes if the
   * geometry is repeated, which is a real cost on the mid-range phones these
   * are opened on. `<use>` is exactly the tool for it: one copy of the drawing
   * in `defs`, five references to it. `currentColor` and custom properties both
   * inherit from the referencing element into the instance, which is what makes
   * the five strikes differ at all.
   *
   * The id is derived from the face rather than from `useId` so this can stay a
   * server component. One envelope per page, and the three faces never collide.
   */
  const id = `emb-${face}${dense ? "-d" : ""}${copy ? `-${copy}` : ""}`;
  const d = 3.4;
  /* The creases are shallower than the areas they are scored into. */
  const c = d * 0.6;

  const DARK = "rgb(58 40 26)";

  /*
   * The order is the whole trick, and it is not the obvious one.
   *
   * Areas first — shade, light, then the paper knocking both of them back out
   * through the middle so only their two rims survive. Then the creases, *over*
   * the knockout, struck as their own light-and-dark pair. Score them before
   * the knockout instead and every line inside a shape is painted out by the
   * paper: petals lose the boundaries between them, leaves lose their veins,
   * and each bloom sets into one smooth lump. The creases have to come last.
   */
  const pass = (fill: string, line: string, dx: number, opacity: number) => (
    <use
      href={`#${id}`}
      style={{ ["--emb-fill" as string]: fill, ["--emb-line" as string]: line }}
      opacity={opacity}
      transform={`translate(${dx} ${dx})`}
    />
  );

  return (
    <>
      <defs>
        <g id={id}>
          <Art dense={dense} />
        </g>
      </defs>

      {/* the raised areas: shade, light, and the paper between them */}
      {pass(DARK, "none", d, 0.2)}
      {pass("#fff", "none", -d, 0.82)}
      {pass(paper, "none", 0, 0.92)}

      {/* the creases scored into them */}
      {pass("none", DARK, c, 0.22)}
      {pass("none", "#fff", -c, 0.8)}
    </>
  );
}

/** The same relief as a standalone sheet, for a face that is a plain box. */
export function EnvelopeBotanical({
  face,
  dense = false,
  paper,
}: {
  face: BotanicalFace;
  dense?: boolean;
  paper?: string;
}) {
  /*
   * Each face shows its own window onto the shared envelope space: the flap the
   * top 520 units, the pocket everything from 358 down. A face drawn in its own
   * private box cannot line up with its neighbours however carefully it is
   * placed.
   */
  const box = face === "pocket" ? "0 358 1000 922" : "0 0 1000 1280";

  return (
    <svg
      className="env-botanical"
      viewBox={box}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <BotanicalArt face={face} dense={dense} paper={paper} />
    </svg>
  );
}
