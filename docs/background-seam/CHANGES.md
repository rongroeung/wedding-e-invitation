# Seamless paper background

This is a targeted fix to the invitation card's background. The ornaments,
text, layout, typography and behaviour are unchanged. It sits on top of the
envelope-realism round. `changes.patch` holds this round's diff only, 3 files.

## Cause (traced in the DOM, measured in screenshots)

The card looked like three panels stacked: the head strip, a darker middle and
the foot strip. Three separate things caused it:

1. **The card's own texture was silently dropped.** `.card-stock` and `.paper`
   sit on the same element, and `.card-stock` sets `background-image` for an
   uploaded paper (`--card-bg`). That overrides `.paper`'s texture, so the
   frame's head and foot strips showed flat colour: tone 243, no grain at all.
2. **The cover painted a second sheet of paper between them.** `.cover-shell`
   carried its own `.paper` class, a grey `feTurbulence` noise blended with
   `multiply`. Multiply can only darken, so the cover box was a greyer
   rectangle, tone 234–236, with hard top and bottom edges exactly where the
   strips begin. It measured as a step of 5–8 levels out of 255 at every
   viewport.
3. **Two smaller edges.**
   - The cover's moving `paper-sheen` was clipped to the cover box, so each
     pass lit a band with hard ends.
   - The candle glow behind the names was a circle sized to its box's far
     corner. On a short, wide screen (740×360) it ran past the cover box and
     was cut off in a straight line under the head strip.

The decorative PNGs were not the cause. `kbach-top.png` and
`kbach-bottom.png` are 0% semi-transparent: every pixel around the ornament is
fully transparent, and `.frame-art` paints them through `mask-image`. They
already showed whatever was beneath them.

## Strategy

There is now one sheet, painted once.

- `.card-stock::before` lays the seamless tile `/kit/paper-card.webp` (512 px)
  over the whole card from top edge to bottom edge, with `overlay`. The head
  strip, the cover, the scrolling invitation and the foot strip all sit on it.
  It is a pseudo-element, so it composes with an uploaded `--card-bg` instead
  of replacing it, and it does not scroll.
- `.paper` (used by `<body>` and the 404 page) uses the same tile with
  `overlay` instead of multiply noise. The tile's mean is exactly mid-grey,
  and overlay of mid-grey is the identity, so grain never shifts the tone.
- The cover box is transparent: its `.paper` class and its sheen are removed.
  The floating motes and the candle glow stay.
- The candle glow uses `radial-gradient(closest-side, …)`, so it fades to
  nothing inside its own box. On portrait screens it is within a few pixels of
  the old size.
- The Blessing section's beige wash fades out at both ends instead of ending on
  an edge (`from-transparent via-beige/35 to-transparent`).

Intentional surfaces are kept:

- the translucent white content panels (RSVP, countdown, schedule, venue,
  gift);
- the photo areas;
- the dark controls panel on desktop;
- the soft gold glow behind the names.

## New texture asset?

No. `/kit/paper-card.webp` already existed. It is the generated, seamless,
low-contrast tile made for the envelope card in the previous round (fine
grain, sparse faint fibres, no blotches), and it is reused here.

## Files modified

- `src/app/globals.css`: `.paper`, the new `.card-stock::before`, and
  `.candle-glow`'s gradient.
- `src/components/invitation/Cover.tsx`: the cover box no longer has `paper`,
  and `LiveBackdrop` has `sheen={false}`.
- `src/components/invitation/Blessing.tsx`: the wash fades at both ends.

## Tested — actually run

I compared a production build of your previous tree ("before", on its own
port) with this tree ("after") in Chromium via Playwright, at the same four
viewports.

Paper tone was measured as the most common grey level in the strip above, the
body, and the strip below, and the step at the top and bottom boundaries as a
per-row median:

| viewport | before: head / body / foot | before: steps | after: head / body / foot | after: steps |
|---|---|---|---|---|
| 320×568 | 243 / 236 / 243 | −5.0 / +6.0 | 243 / 243 / 243 | +0.1 / 0.0 |
| 390×844 | 243 / 236 / 243 | −4.9 / +6.0 | 243 / 243 / 243 | 0.0 / 0.0 |
| 740×360 | 243 / 234 / 243 | −8.0 / +6.6 | 243 / 243 / 243 | −1.0 / 0.0 |
| 1280×800 | 243 / 236 / 243 | −6.0 / +7.0 | 243 / 243 / 243 | 0.0 / 0.0 |

The 740×360 residual is the glow, now a smooth ramp over about 30 px. At a
contrast stretch far past normal viewing there is no visible line.

**Full scroll height.** After opening, the invitation scroller was stepped
through end to end at every viewport:

| viewport | content height | frames |
|---|---|---|
| 320×568 | 9,781 px | 22 |
| 390×844 | 9,314 px | 14 |
| 740×360 | 9,565 px | 36 |
| 1280×800 | 9,592 px | 18 |

The paper in both strips reads 243 in every frame. Remaining differences at
the boundaries come only from content scrolling past (panels, text, photos),
the same as before.

**Also checked:**

- no horizontal scroll and no console errors at any viewport;
- `tests/opening.mjs`: 18/18 pass;
- the painter audit (every element and pseudo-element with a background) lists
  one textured layer on the card, plus the panels named above.

**Screenshots** (in this folder):

- `cover-before-after-*.png`: before on the left, after on the right, at each
  viewport.
- `fullheight-before-after-390.jpg`: the whole scrolled invitation, before and
  after.
- `fullheight-after-*.jpg`: the whole scrolled invitation at the other three
  viewports.

The full-height images are stitched from viewport frames. Because the sheet
and its lighting stay fixed while the writing scrolls, the vignette repeats
once per frame in the stitch. That repeat is a stitching artefact, not
something a guest sees.

## Remaining limitations

- **Not tested:** Safari/WebKit and real phones. `mix-blend-mode: overlay` on
  a pseudo-element is well supported, but it is worth a look on an iPhone.
- **The grain is deliberately quiet:** about ±1 level at this tone. It shows
  on close inspection, not at arm's length, as the brief asked. If you want
  more tooth, it is the tile's strength, one asset.
- **Gentle glows remain:** the soft radial vignette on the stage and the gold
  glow behind the names. They have no edges, but at an extreme contrast
  stretch the 8-bit gradients show faint banding rings.
- **An uploaded paper image (`--card-bg`)** gets the same grain on top. If
  that image is itself not seamless, its own tiling is outside this fix.
