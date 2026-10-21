# Envelope realism overhaul

This round rebuilds the envelope and its opening, and nothing else. It sits on
top of Phase 2. Nothing is committed, so `git diff` shows everything since the
tree you uploaded.

## Audit: why the previous envelope looked fake

These were checked in the code, not assumed.

1. **The flap's lining was flipped the wrong way.** The lining face was turned
   with `rotateX(180deg)` about its own centre. Inside a hinge that also turns
   180°, that mirrored it top to bottom a second time. The open flap therefore
   hung point-down *above* the envelope, with a gap at the hinge. This is
   exactly your second screenshot.
2. **Depth was faked.** Each layer was flattened. A timer swapped the flap's
   `z-index` "past 90°" instead of real 3D putting it behind the card.
3. **The pocket was three flat SVG triangles.** One gradient each, outlined
   with strokes, and a stroked rectangle around the whole envelope. It looked
   drawn, not folded.
4. **The texture was a cloudy, marble-like stock image,** multiplied into
   every surface.
5. **The lighting had no single source.** Each fold had its own unrelated
   gradient.
6. **The flap's shadow was hard-edged.** It was an offset copy at flat alpha,
   with no blur or separation.
7. **The seal was an icon.** Evenly scalloped and symmetrical, with the crest
   drawn on top rather than pressed in.
8. **The seal faded and shrank on the spot,** rather than being lifted away.
9. **The card was a flat rectangle with an outline.** No paper edge, and no
   shadow that changed as it moved.

## What replaced it

- **One 3D scene** (`.pe`, `perspective: 1000px`). The rear panel is at z 0,
  the card at 1, the pocket at 3, the closed flap at 4 and the seal at 6.
- **The flap hinges on its top edge.** The rotation axis sits at z 1.5, so a
  half turn carries the flap from in front of the pocket (z 4) to behind the
  card (z −1). It crosses the card past upright because the geometry puts it
  there; there is no z-index swap. The lining is the same piece's other face,
  turned with `rotateY(180°)`. It stays joined at the hinge and opens point-up.
- **The flap is lit by its angle.** Its outside dims as it turns away from the
  key light, and the lining comes out of shade into light. Both are driven by
  transitions on the turn's own curve.
- **The pocket is real HTML folds** (`clip-path` polygons in percentages):
  left, right, and a bottom fold over both. Each casts a short, soft shadow
  down and to the right that follows its own shape. Edges facing the light
  carry a hairline highlight; nothing is outlined.
- **Paper is generated, not photographed.** Seamless relief maps are made in
  the frequency domain: fine grain, small tooth, sparse fibres, 3–7 levels out
  of 255. There are three (`paper-cotton`, `paper-card`,
  `paper-lining-fine`), and all three together are 30 KB. Each blends with
  `overlay` into whatever colour the envelope style sets, so every style keeps
  the same tooth.
- **One key light from the upper left,** laid across every full-size surface,
  plus a lit fold along the top edge and a shaded cut edge on the flap.
- **The seal is poured wax:**
  - an irregular, seeded outline;
  - rim thickness, light upper-left and shade lower-right;
  - a thicker pool of wax;
  - a recessed well;
  - the crest pressed in (shadow toward the light, lit lip away from it);
  - one restrained specular;
  - a contact shadow that tightens when pressed, then separates and softens as
    the seal is lifted and carried off the envelope.

  No SVG filters are used, for phone performance. A custom seal text is HTML,
  pressed into the wax the same way.
- **The card is ivory card stock** with a paper edge, a gold inset rule, and a
  contact shadow. It lengthens and softens as the card leaves the pocket.
- **Dusty blush.** The `blush-rose` style moved from a sugary #fbe4e9 to
  #eccdd3, #e3bdc5 and #cfa1ac. Other styles are untouched.

## The opening (6.2 s; migration 0025 moves 5.5 → 6.2 only where unchanged)

| time | beat |
|---|---|
| 0–0.43 s | anticipation: nothing moves |
| 0.43 s | the seal is pressed a fraction into the paper |
| 0.74 s | it is lifted, its shadow separating, and carried off by hand |
| 1.67 s | the flap lifts at the point and turns back on its hinge (1.4 s) |
| 3.10 s | the card is drawn up and out at 1.4°, and the envelope gives a little |
| 4.71 s | the envelope drops out of the shot; the card comes toward the lens with real depth |
| 5.58 s | full dark |
| 5.64 s | the veil lifts onto your curtains, then the cover |

These parts of the machine are unchanged:

- tap anywhere on the document, the pre-hydration tap buffer, and the `<a>`
  fallbacks;
- the guard against double taps;
- skip, reduced motion (opens in about 0.5 s), and the visit memory;
- music on open, and the film hand-over.

On short landscape screens the camera pulls back further while the card is out
(CSS variables `--pe-cam-*`).

## Removed

- The old `.fl-*` rules.
- `paper-cream.webp` and `paper-lining.webp`, the cloudy textures.
- The old drawn `WaxSeal` (replaced in the same file).

## Tested — actually run

Production build, Chromium, Playwright.

- **`tests/opening.mjs`: 18/18 pass.** This includes new physical checks:
  - the flap is hinged on the envelope's top edge;
  - the lining is a back face;
  - the open lining is joined at the hinge;
  - the open lining points up, found by hit-testing the clipped shape;
  - the seal has been carried off.

  **The point-up check was confirmed to fail when the old `rotateX` fault is
  put back.** The bounding-box check alone would not have caught it.
- **Stage captures.** Taken with the run slowed through the admin setting, so
  in-between poses are real frames: `stages-1.png` and `stages-2.png`.
- **Every viewport.** 320×568, 390×844, 740×360 and 1280×800 from closed to
  cover, with no console errors and no horizontal scroll.
- **The ivory style with a custom seal text:** `v-ivory-pair.png`.

**Not tested:** Safari/WebKit and real phones. The flap is a true 3D
`preserve-3d` turn with `backface-visibility`, which is the part most worth
checking on an iPhone. The language switch does not exist yet (it is Phase 3),
so there was nothing to regress there.
