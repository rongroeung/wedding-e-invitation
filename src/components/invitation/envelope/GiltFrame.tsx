/**
 * The champagne-foil frame stamped across the front of the envelope.
 *
 * It is drawn in the *envelope's* coordinate space — the full 1000 × 1280 sheet
 * — by both panels, and each panel's `viewBox` windows it down to its own half.
 * That is the whole trick, and it is what an earlier version got wrong by
 * composing two open C-shaped paths that met at the join: the halves have to
 * agree to a fraction of a unit or the top and bottom rules step where they
 * cross the middle, and they cannot be made to agree once anything but a
 * straight line is involved. Draw one frame twice and let the window do the
 * cutting, and there is nothing left to line up.
 *
 * Four things make foil read as foil rather than as a yellow line:
 *
 * **It is a ramp, never a flat colour.** Gold is a mirror; a flat fill is the
 * one thing it cannot be. Every stroke here takes the same diagonal gradient,
 * so the rules brighten and darken together as if one light were crossing them.
 *
 * **It is pressed into the paper.** A dark copy of each rule sits a unit down
 * and to the right, under the foil itself — the shadow in the channel the die
 * left. Without it the frame sits *on* the paper like ink; with it the paper
 * has a groove and the foil is lying in it.
 *
 * **The corners are not corners.** A plain rounded rectangle is a box, and a
 * box around a wedding invitation is a certificate. Real stationery breaks the
 * corner with something — a bracket, a leaf, a bud — and that one ornament is
 * most of the difference between "bordered" and "engraved".
 *
 * **The weights are uneven.** A heavy outer rule, a hairline inside it, and a
 * row of dots between the two. Three rules of the same weight read as a grid;
 * three of different weights read as a frame with a hierarchy.
 */

/** The outer rule: the heavy one, and the one the eye measures the piece by. */
const OUTER = { x: 62, y: 62, w: 876, h: 1156, r: 26 };
/** The hairline inside it. */
const INNER = { x: 104, y: 104, w: 792, h: 1072, r: 16 };
/** The dotted rule that runs between them. */
const BEADS = { x: 83, y: 83, w: 834, h: 1114, r: 21 };

function rect({ x, y, w, h, r }: { x: number; y: number; w: number; h: number; r: number }) {
  return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/**
 * The corner ornament, drawn once in a local box with its origin at the corner
 * of the inner rule and its arms running along the two rules that meet there.
 *
 * A bracket sweeping between the rules, three leaves riding on it, and a bud at
 * the tip of each arm. It is placed at the four corners by reflection, so the
 * same drawing serves all four and every one of them turns the right way.
 */
const CORNER_ARC = "M2 92 C2 42 42 2 92 2";
const CORNER_ARC_2 = "M20 92 C20 52 52 20 92 20";

/** The teardrop finishing each arm of the bracket. */
const CORNER_TIP = "M2 92 C10 96 14 104 12 112 C4 110 0 102 2 92 Z";

/*
 * A reflection across the line y = x — the diagonal this corner is symmetrical
 * about. Everything drawn on one arm of the bracket is drawn again through it,
 * so the ornament reads as one piece of engraving rather than as a branch that
 * happens to have been laid in a corner. A rotation cannot do this: turning an
 * arm through 90 degrees puts its ornament on the outside of the curve.
 */
const FLIP = "matrix(0 1 1 0 0 0)";

/**
 * Beads riding on the bracket, graduating from the arms into the middle.
 *
 * These replaced a spray of leaves, and the reason is worth keeping. The leaves
 * were drawn along one arm and mirrored onto the other, which is correct for
 * everything else here — but a leaf has length, and two mirrored sprays met on
 * the diagonal and overlapped into a blot. Beads have no length. They sit on
 * the curve, graduate cleanly into the middle, and survive being looked at on a
 * phone, where a leaf at this scale is three pixels of nothing.
 *
 * The positions are points on the bracket's own cubic at t = 0.09, 0.28 and
 * 0.5, so they sit *on* the line rather than near it — the eye is unforgiving
 * about a bead that has come off its string.
 */
const BEAD_SPRAY: [number, number, number][] = [
  [2.9, 78.7, 2.4],
  [10.8, 53.0, 3.5],
  [28.2, 28.2, 5.0],
];

function Corner({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <>
      <path d={CORNER_ARC} stroke={stroke} strokeWidth={2.6} fill="none" />
      <path d={CORNER_ARC_2} stroke={stroke} strokeWidth={1.2} fill="none" opacity={0.8} />
      <path d={CORNER_TIP} fill={fill} opacity={0.85} />
      <path d={CORNER_TIP} fill={fill} opacity={0.85} transform={FLIP} />
      {BEAD_SPRAY.map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={fill} />
          {/*
            * The middle bead is its own reflection; drawing it a second time
            * would only double its opacity against everything else.
            */}
          {cx !== cy && <circle cx={cy} cy={cx} r={r} fill={fill} />}
        </g>
      ))}
    </>
  );
}

/**
 * Where each corner ornament sits and which way it faces.
 *
 * The origin is the inner rule's corner; the arms run outward along it. Mirror
 * rather than rotate: a rotated ornament puts its leaves on the wrong side of
 * the arc on two of the four corners, which is the kind of mistake that is
 * invisible until it is pointed out and then impossible to stop seeing.
 */
const CORNERS = [
  `translate(${INNER.x} ${INNER.y})`,
  `translate(${INNER.x + INNER.w} ${INNER.y}) scale(-1 1)`,
  `translate(${INNER.x} ${INNER.y + INNER.h}) scale(1 -1)`,
  `translate(${INNER.x + INNER.w} ${INNER.y + INNER.h}) scale(-1 -1)`,
];

export function GiltFrame({ foil }: { /** The id of the champagne gradient in this panel's own defs. */ foil: string }) {
  const gold = `url(#${foil})`;

  return (
    <>
      {/*
        * The channel the die pressed, struck first and offset down-right so the
        * foil laid over it leaves a dark edge on the side away from the light.
        * One group at low opacity rather than a shadow per rule: they are all
        * in the same groove.
        */}
      <g
        transform="translate(1.6 1.9)"
        stroke="rgb(90 58 66 / 0.3)"
        fill="rgb(90 58 66 / 0.26)"
        opacity={0.8}
      >
        <path d={rect(OUTER)} strokeWidth={3.6} fill="none" />
        <path d={rect(INNER)} strokeWidth={1.4} fill="none" />
        {CORNERS.map((t, i) => (
          <g key={i} transform={t}>
            <Corner stroke="rgb(90 58 66 / 0.3)" fill="rgb(90 58 66 / 0.26)" />
          </g>
        ))}
      </g>

      {/* the foil itself */}
      <path d={rect(OUTER)} stroke={gold} strokeWidth={3.4} fill="none" />
      <path d={rect(INNER)} stroke={gold} strokeWidth={1.6} fill="none" opacity={0.88} />

      {/*
        * The dotted rule between the two. `1.6 11` rather than a solid line:
        * a third continuous rule at this spacing reads as a printing error,
        * where a row of dots reads as an engraved bead — and it is the detail
        * that survives being seen at phone size, because dots stay dots.
        */}
      <path
        d={rect(BEADS)}
        stroke={gold}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1.6 11"
        fill="none"
        opacity={0.62}
      />

      {CORNERS.map((t, i) => (
        <g key={i} transform={t}>
          <Corner stroke={gold} fill={gold} />
        </g>
      ))}

      {/*
        * A highlight following the top and left of the outer rule only.
        *
        * Foil pressed into paper catches the light on the two edges that face
        * it and goes dark on the other two. Ringing the whole frame with the
        * same highlight is what makes gilding look like a yellow outline; the
        * asymmetry is the entire effect, and it is why this is drawn as an open
        * path rather than as another rectangle.
        */}
      <path
        d={`M${OUTER.x} ${OUTER.y + OUTER.h - OUTER.r} V${OUTER.y + OUTER.r} A${OUTER.r} ${OUTER.r} 0 0 1 ${OUTER.x + OUTER.r} ${OUTER.y} H${OUTER.x + OUTER.w - OUTER.r}`}
        stroke="rgb(255 253 246 / 0.5)"
        strokeWidth={0.9}
        fill="none"
        transform="translate(-1 -1.1)"
      />
    </>
  );
}
