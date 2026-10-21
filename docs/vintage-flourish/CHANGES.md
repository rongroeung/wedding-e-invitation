# Vintage flourish ornaments

This round makes the couple's flourish pack the invitation's decorative
system. Only ornaments changed: the layout, text, animations and features are
as they were.

## The pack (inspected, not assumed)

`vintage-flourish-ornament-frame-vector.zip` holds two files:

- `76795.eps`, a vector file (3.3 MB);
- `76795.jpg`, a 4675 × 4676 preview.

Both show **one sheet of 17 gold ornaments** on a navy ground. The EPS paints
each ornament as a gradient rectangle clipped to the ornament's outline.

**How the shapes were extracted.** The EPS was converted with Ghostscript
(EPS → PDF) and Inkscape (PDF → SVG). `scripts/flourish-assets.py` then:

- keeps each outline exactly as drawn;
- discards the clipping rectangles, the navy background and the baked-in
  gradient;
- groups touching outlines into ornaments (it asserts that it finds 17);
- writes each ornament as its own SVG with the invitation's antique-gold foil.

Nothing was redrawn; every path comes from the EPS. The source EPS and a
preview are kept in `design/vintage-flourish/`, and your original archive was
not modified.

## Mapping: sheet → invitation

All files are in `public/kit/flourish/`.

| Sheet ornament | File | Used for |
|---|---|---|
| Acanthus corner (bottom-right on the sheet) | `corner.svg`, turned to face top-left | **Card frame**, mirrored into all four corners. New built-in frame `flourish`, now the default. |
| Looped corner (bottom-left) | `corner-loop.svg`, turned to face top-left | Second frame option, `flourish-loop` |
| Heart-loop crest (top centre) | `crest.svg` | Crest above the cover heading; crest on the envelope's inner card; thank-you section; 404 page |
| Long rule with heart medallion | `rule.svg` | Formal invitation (date) divider; thank-you divider |
| Centre of that rule | `medallion.svg` | Envelope flap, under the initials; programme and gift dividers |
| Scrolled end of that rule | `rule-end.svg` | Start of the name mark's flourish line |
| Snowflake rule | `star-rule.svg` | Countdown divider |
| Scroll with diamond | `scroll-diamond.svg` | Default section-title divider (gallery, RSVP, love story, gift, contact) |
| Scroll with bow | `scroll-bow.svg` | Programme title |
| Twin scrolls | `scroll-twin.svg` | Couple title; share bar |
| Knotted scroll | `scroll-knot.svg` | Venue title |
| Winged fleuron (diamond) | `fleuron.svg` | Centre of the frame's joining hairline; date-section accent; venue and contact dividers |
| Wing | `wing.svg` | Between each partner's name and parents |
| Cross-fleury rosettes ×4 | `rosette-a…d.svg` | Venue accent, photo placeholders, love-story timeline marks |
| Same rosette (C), flat inks | `seal-{light,dark,wax}.svg` | **Wax seal** stamp, debossed (lit lip, shadow, wax) |
| Tulip and lily sprigs | `sprig-*.svg` | Exported for later use; not placed |

## How it is built

- **`Flourish` and `FlourishDivider`** (`ui/Ornaments.tsx`) draw an ornament
  through a CSS mask filled with the theme's own gold ramp:
  - every ornament shares one foil, and a theme change recolours them all;
  - there is no box or rectangle around an ornament;
  - proportions come from each ornament's own viewBox, so nothing is
    stretched.
- **Dividers open outward from the centre** when their section is revealed,
  using the page's existing reveal. They are simply printed under reduced
  motion or with no JavaScript.
- **The frame** uses the existing corner layout (`FrameArt`: relief, optional
  tint), so the existing `frameScale`, emboss and tint settings still apply.
  Two new per-art settings:
  - the flourish corners are drawn wider (42 % of the card at full scale),
    because they are open linework;
  - the hairline joining the corners runs at the height of the corner's own
    tail, with the pack's fleuron at its centre, so it continues the ornament
    instead of crossing it.
- **Migration `0026`** moves a wedding from the gold kbach band to `flourish`
  only if it is still on that former default. Any other chosen frame or an
  uploaded frame is kept. The kbach and royal frames stay in the dashboard
  under "ក្បាច់វល្លិបុរាណ".
- **The envelope** keeps its paper, folds, lining, shadows and timing.
  - The medallion is printed on the flap. It is a child of the flap's outer
    face, so it turns with the flap and hides with its back face (checked in
    a mid-turn frame).
  - The seal keeps its poured wax and release; only the pressed motif changed.
- **The name mark** keeps the couple's names (HTML, never SVG text), the drawn
  line, the heart and the butterfly. The pack's scrolled rule-end is added only
  where the line begins: at the far end the line runs into the bride's name,
  and a scroll there sat on her vowel signs, so it was left out on purpose.

## Files

- **New:**
  - `scripts/flourish-assets.py`
  - `public/kit/flourish/*.svg` (22 files)
  - `design/vintage-flourish/` (source EPS and preview)
  - `drizzle/0026_vintage_flourish.sql`
- **Changed:**
  - `ui/Ornaments.tsx`, `ui/SectionTitle.tsx`, `ui/CardFrame.tsx`,
    `ui/NameLogo.tsx`
  - `lib/frame.ts`, `lib/db/schema.ts` (frame default)
  - `admin/ThemeForm.tsx` (two new frame options)
  - `envelope/Envelope.tsx`, `envelope/WaxSeal.tsx`
  - `CoverContent.tsx`
  - the sections `DateSection`, `Couple`, `Countdown`, `Program`, `Venue`,
    `Gift`, `Contact`, `ShareBar`, `Blessing`, `LoveStory`
  - `app/not-found.tsx`
  - `globals.css`
- **Kept, unused on the invitation:** `/kit/crest.svg`, the `crest-mono-*`
  files, `GoldDivider`, `Lotus` and the kbach/royal PNGs. They remain available
  to the other frame options and the admin preview.

## Tested (actually run)

Production build, Chromium (Playwright).

- **Cover:** before/after at 320×568, 390×844, 740×360 and 1280×800
  (`cover-before-after-*.png`).
- **Whole scrolled invitation** at all four sizes, with no console errors and
  no horizontal scroll at any of them (`fullheight-*.jpg` for 390 and 1280).
- **Envelope:**
  - closed, a mid-flap frame and the card out, at 390 (2×) and 1280;
  - a close-up of the seal (`envelope-closed-and-flap.png`,
    `wax-seal-390@2x.png`);
  - no console errors.
- **Opening suite:** `tests/opening.mjs` passes 18/18.
- **Curtain:** still opens and unmounts, with no errors.

**Not tested:**

- Safari/WebKit and real phones.
- The dashboard's frame preview, which was only built, not opened.
- The thank-you (Blessing) section: it did not appear on the seeded wedding,
  so its crest and rule were never seen on screen.
- The Khmer/English switch: it does not exist yet (Phase 3), so there was
  nothing to check.

## Limitations

- **Licence.** The pack carries a rawpixel ltd. mark. Check that its licence
  covers your use before publishing.
- **The pack's own gradient was not kept.** Its built-in yellow-gold sheen was
  replaced by the invitation's antique-gold ramp, so the ornaments match the
  rest of the card. The shapes are unchanged.
- **The seal motif is small.** It is about 44 % of the seal's width; at phone
  size it reads as a pressed rosette rather than in fine detail.
- **On short landscape screens (740×360)** the frame corners are capped small,
  as before, so the cover still fits.
