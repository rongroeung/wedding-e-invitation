# Adaptive wide-screen layout

## Why the invitation stayed narrow

1. **The card's column was capped.** `CardShell` capped the card's column at
   `max-w-[560px]` at every width below 1280px. A 1024 laptop, a tablet, or a
   phone held sideways therefore got a phone-sized strip.
2. **The card was capped again from 1280px.** It was held to 760px there, between
   two rails of `minmax(240px, 18%)`.
3. **The cover had little height.** Even on a wide sheet, the frame's head and
   foot bands reserved about a third of the card's height. Those bands hold the
   corner ornaments, whose height follows the card's width. The closed cover
   was confined to the middle band, so its composition stayed small.

## What changed

| Viewport | Card |
|---|---|
| < 600 | Whole screen, unchanged (screenshots before and after match; the only differing pixels are the moving gold dust). |
| 600–899 | Nearly the whole width (up to 880px), with a narrow margin of stage. |
| ≥ 900 | A wide sheet, `min(100%, 1000px, 132dvh)`. It floats on the stage with margins above and below when the screen is at least 700px tall. |
| ≥ 1280 | The details and controls rails return at `minmax(212px, 15%)`. The card is `min(100%, 1120px, 128dvh)`. |

The `dvh` caps tie the width to the screen's height, so a short wide window
gets a proportionate card, not a banner.

### Measured card widths

| Viewport | Before | After |
|---|---|---|
| 740×360 | 560 | 696 |
| 1024×768 | 560 | 968 |
| 1280×800 | 760 | 805 |
| 1440×900 | 760 | 950 |
| 1920×1080 | 960 | 1120 |

### The cover on a wide sheet

- **It rises into the frame bands.** From 900px wide and 560px tall, the
  closed cover extends into the head and foot bands, but only between the
  corners.
  - Its column is held narrower than the gap between the corners.
  - It stops short of the hairline and fleuron that join them.
  - `CardShell` measures the bands and the corner width with a
    `ResizeObserver`.
  - With a cover photograph, the photograph stays in its original panel, so it
    never paints over the gold.
- **The opened invitation keeps the structural frame**, so scrolling content
  still never passes under the ornament.
- **Each part has its own size rule:**
  - names: up to 640px wide, the largest step;
  - heading: up to 2.45rem;
  - guest name, date cells, time and venue: smaller steps;
  - button: min-width 240px;
  - gaps between groups: wider.

  At 1440×900 the names grew from 240px to 396px wide, and the heading from
  22px to 31px.
- **The two-column cover on a phone held sideways** now keeps the time and
  venue, which it used to drop.

### Unchanged by design

- **Background:** the paper pattern is a fixed-size tile (`--pp-size`), so a
  wider sheet shows more of it, never a stretched one.
- **Corners:** they stay `min(%, 17dvh)`, in proportion to the card and the
  screen.
- **Sections:** they keep their own reading widths (`max-w-2xl`/`3xl`) and
  centre in the wider sheet.
- **Envelope:** it may now grow to 720px when the screen is at least
  1200×860; before, it was capped at 600px everywhere.

## Files

- `src/components/invitation/CardShell.tsx`:
  - width classes moved to CSS (`stage-grid`, `zone-centre`, `card-sheet`);
  - slimmer rails;
  - band measurement.
- `src/components/invitation/Cover.tsx`: adds the `cover-root` class.
- `src/app/globals.css`, three new blocks:
  - "Adaptive card width";
  - "The cover on a large sheet";
  - "The cover on a wide sheet".

  Also new: the sideways-phone time and venue rule, and the larger desktop
  envelope.

## Tests run

All tests used Playwright with Chromium on a production build.

- **Seven viewports** (320×568, 390×844, 740×360, 1024×768, 1280×800,
  1440×900, 1920×1080). At each one, the test played the real envelope opening
  to the cover. It then checked:
  - no cover item clipped;
  - no cover item overlapping a corner ornament;
  - no clipped Khmer;
  - the button visible and at least 40px tall.

  It then opened the invitation, scrolled through all 12 sections, and found
  no element wider than the card, no horizontal scroll and no console errors.
- **Envelope-opening suite:** 18/18 passed.
- **Appearance panel:** all checks passed — phone and desktop, persistence,
  reset, keyboard, Escape, blocked storage and reduced motion.
- **Animation modes and intensities:** counts were as before, and movement
  was confirmed.
- **Curtain opening at 1024, 1440 and 1920:** no errors and no horizontal
  scroll.
- **Paper themes at 1440:** all six rendered without errors.
- **Phones at 320 and 390:** before and after compared pixel by pixel; they
  are unchanged.

**Not tested:**
- Safari and real devices;
- a cover photograph on a wide sheet (the sample wedding has none);
- the Khmer/English switch, which this app does not have.
