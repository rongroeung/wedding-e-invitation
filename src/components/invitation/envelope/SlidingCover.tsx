"use client";

import { useId } from "react";
import { BotanicalArt } from "./EnvelopeBotanical";
import { GiltFrame } from "./GiltFrame";
import { WaxSeal } from "./WaxSeal";

/**
 * The front of the envelope, in two panels that **slide** apart.
 *
 * This replaces a gatefold whose panels swung outward on hinges at their outer
 * edges. The two mechanisms look similar in a still frame and are nothing alike
 * in motion, and the difference is worth writing down because it decides most
 * of what is in this file.
 *
 * A hinge is a rotation, so it needs a third dimension: each panel turns about
 * a vertical axis, presents its edge to the camera on the way round, and ends
 * up showing its *back*. That meant two faces per panel sorted by
 * `backface-visibility`, a lining drawn for a surface only visible for the last
 * third of the movement, and a careful depth order to keep the turning paper
 * from cutting through everything near it.
 *
 * A slide is a translation. The panels stay square to the camera for the whole
 * movement and never show anything but their printed front, so the second face,
 * the lining behind it, the backface sorting and the whole reason for the
 * rotation's depth budget are simply not needed. What is left is two pieces of
 * paper drawn aside — which is also the plainer, quieter gesture, and reads at
 * a glance on a phone in a way a rotation at this size never quite does.
 *
 * Each panel travels 88% of its own width. Not 100%: a sliver of each staying
 * within the envelope's own footprint keeps them reading as *this* envelope's
 * front rather than as two rectangles that have left. And the arithmetic has to
 * hold at the narrowest viewport — the pair spans 1.88 × the envelope's width
 * at full travel, which at the camera's 0.8 is 1.5 × the envelope, and the
 * envelope is 62vw. That is the number that keeps them on a 360px phone.
 *
 * They also lift a little as they go, from 32px of depth to 44, with the shadow
 * under them growing to match. Paper drawn aside is picked up slightly before
 * it moves; panels that slide at a fixed depth read as two flat shapes on one
 * plane sliding past each other, which is a UI transition rather than an object.
 */

/*
 * The side classes are written out in full, deliberately.
 *
 * Tailwind scans the source as *text* for class names and drops anything in
 * `@layer components` it cannot find, so a class assembled at runtime —
 * `slide-${side}` — never appears in any file and its rule is purged from the
 * stylesheet. Nothing errors; the panels simply lose their position, both stack
 * up on the left, and the envelope renders as a flat rectangle.
 */
const PANEL_SIDE = { left: "slide-left", right: "slide-right" } as const;

export function SlidingCover({
  unsealed,
  open,
  seal,
  gold,
  dense,
}: {
  /** The seal has released. */
  unsealed: boolean;
  /** The two panels are drawing apart. */
  open: boolean;
  /** The seal's inscription — the couple's initials, from the record. */
  seal: string | null;
  /** True while the foil and the wax should catch the light. */
  gold: boolean;
  /** The richer styles press a fuller die into the paper. */
  dense: boolean;
}) {
  const uid = useId().replace(/:/g, "");

  return (
    <>
      <Panel side="left" uid={uid} open={open} dense={dense} />
      <Panel side="right" uid={uid} open={open} dense={dense} />

      {/*
        * The seal sits over the join, which means it belongs to neither panel —
        * it is the thing holding the two of them shut. So it lives out here and
        * releases on its own: it lifts, turns a little and goes, and only then
        * do the panels start to move. A seal that opens *with* the cover was
        * never holding it closed.
        */}
      {seal && (
        <div className={`slide-seal ${open ? "slide-seal-gone" : ""}`}>
          <WaxSeal text={seal} released={unsealed} gold={gold} />
        </div>
      )}
    </>
  );
}

function Panel({
  side,
  uid,
  open,
  dense,
}: {
  side: "left" | "right";
  uid: string;
  open: boolean;
  dense: boolean;
}) {
  const left = side === "left";
  const id = `${side}-${uid}`;

  /*
   * Each panel is a window onto the envelope's own coordinate space rather than
   * a drawing of its own — the left half of it, or the right half. That is what
   * lets one embossed die run across both panels and meet exactly at the join
   * while they are closed, the way a real sheet embossed before it was folded
   * would. Two separately composed halves cannot be made to meet.
   */
  const box = left ? "0 0 500 1280" : "500 0 500 1280";

  return (
    <div
      /*
       * No `env-fade` here, deliberately. It carries `transition: opacity …`,
       * and `transition` is a shorthand: sharing a specificity with
       * `.slide-panel` and losing the cascade by position, it replaced the
       * panel's whole transition list rather than adding to it. The panels
       * kept their final transform and lost the 1.68s that gets them there —
       * they simply teleported apart, in one frame, with nothing reporting a
       * problem. Nothing dims the cover any more in any case; the class was a
       * leftover from when the panels faded behind the card.
       */
      className={`slide-panel ${PANEL_SIDE[side]} ${open ? "slide-open" : ""}`}
      aria-hidden="true"
    >
      <svg className="slide-face" viewBox={box} preserveAspectRatio="none" fill="none">
        <defs>
          {/*
            * The sheet. Lit from the upper left, so the two panels are *not*
            * mirror images of one another: the left one catches the light on
            * its inner edge and the right one on its outer. Mirroring the
            * gradient is the fastest way to make a symmetrical object look
            * like a symmetrical drawing.
            */}
          <linearGradient id={`p-${id}`} x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="var(--env-paper)" />
            <stop offset="0.55" stopColor="var(--env-paper)" />
            <stop offset="1" stopColor="var(--env-paper-shade)" />
          </linearGradient>

          {/*
            * Champagne foil: a ramp, never a flat line. Gold is a mirror, and
            * what it reflects is a room — so it needs more than one bright
            * band across a sheet this tall. Two highlights and three darks,
            * with the darks kept narrow: a wide dark stop turns the top-left
            * of the frame the colour of weak tea, which is what a single
            * five-stop ramp did here at the old, smaller size and could not
            * get away with once the envelope grew.
            */}
          <linearGradient id={`f-${id}`} x1="0" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="var(--env-gold-deep)" />
            <stop offset="0.14" stopColor="var(--env-gold)" />
            <stop offset="0.3" stopColor="var(--env-gold-light)" />
            <stop offset="0.42" stopColor="var(--env-gold)" />
            <stop offset="0.54" stopColor="var(--env-gold-deep)" />
            <stop offset="0.68" stopColor="var(--env-gold)" />
            <stop offset="0.8" stopColor="var(--env-gold-light)" />
            <stop offset="0.9" stopColor="var(--env-gold)" />
            <stop offset="1" stopColor="var(--env-gold-deep)" />
          </linearGradient>
        </defs>

        <rect x={left ? 0 : 500} y="0" width="500" height="1280" fill={`url(#p-${id})`} />

        {/* the embossed florals, cut off by this panel's own edges */}
        <BotanicalArt face="pocket" dense={dense} copy={side} />

        {/*
          * The gilt frame, drawn whole in the envelope's own coordinates and
          * cut to this panel by the `viewBox` above. See `GiltFrame`: composing
          * it as two halves that meet at the join is what it replaces.
          */}
        <GiltFrame foil={`f-${id}`} />

        {/*
          * The gilded cut edge along the join. On a sliding cover this is the
          * edge that actually travels, so it is the one the eye follows the
          * whole way — and it is why the join is gilded at all.
          */}
        <path
          d="M500 0 V1280"
          stroke={`url(#f-${id})`}
          strokeWidth={2.6}
          transform={`translate(${left ? -1.3 : 1.3} 0)`}
        />
      </svg>
    </div>
  );
}
