# Botanical stationery suites

## What changed
The brief asked for drawn, art-directed paper rather than patterns. This round adds five complete suites. Each suite has its own paper, printed artwork, frame corners, double-rule border, crest and dividers. The suites are new options in **ក្រដាស និងចលនា** (guest panel) and in the dashboard. The default paper (classic-ivory) is unchanged.

| Key | Khmer | English | Corners | Engraving |
|---|---|---|---|---|
| botanical-ivory | រុក្ខជាតិបុរាណ ពណ៌ភ្លុក | Classic Ivory Botanical | lotus foil corner | sepia ink + wash |
| khmer-elegance | ក្បាច់ខ្មែរឧត្តម | Khmer Ornamental Elegance | carved Khmer gold (existing kbach artwork) | gold |
| lotus-floral | ផ្កាឈូក និងផ្កាផ្សេងៗ | Lotus & Floral | lotus foil corner | ink + blush/teal wash |
| champagne-heritage | បេតិកភណ្ឌពណ៌សំប៉ាញ | Champagne Heritage | lotus foil corner | gold, plus a blind-debossed lotus |
| burgundy-gold | ក្រហមទំពាំងបាយជូរ និងមាស | Burgundy & Gold (dark) | lotus foil corner | gold |

## Audit findings (before)
- The old papers were dense repeating tiles that ran behind the text. The centre was never quiet, and the repetition read as generated.
- The vintage flourish pack (`vintage-flourish-ornament-frame-vector.zip`: one EPS plus a preview, already extracted to `public/kit/flourish/`) is genuine hand-drawn work. It is kept as it is for the existing kits and frames.

## Artwork (`scripts/botanical-art.py` → `public/art/botanical/`)
- **The pieces.** Constructed vector drawings, each made from its botanical structure:
  - lotus bloom: two-sided petals with a point, veins running base to tip, and engraved shading on the turned side;
  - lotus bud, lotus pad (radial veins, lifted rim), seed head;
  - frangipani: pinwheel petals and buds;
  - leaves with paired veins, and water grass.
- **Hidden lines.** Outlines behind a nearer shape are removed (shapely), so nothing draws through anything else.
- **Compositions.** Instead of a tile, each suite places a few drawings in chosen corners:
  - `lotus-rise`: a lotus group rising from a lower corner;
  - `champa-hang`: a frangipani branch hanging from an upper corner;
  - `lotus-small`: a bud and pad answering the main group.
- **Plates.** Every composition is written as separate printing plates: petal, leaf and heart (washes), line (engraving) and foil (accents). Each plate is a single-colour SVG used as a CSS mask, so a theme only supplies colours.
- **Mirroring.** Mirrored corners are mirrored inside the SVG (a group transform). There is no CSS transform on the element.
- **Foil ornaments.** Solid shapes with fine knock-out lines, the way foil is stamped:
  - the crest (front lotus on leafy sweeps);
  - four dividers: `divider-minimal`, `divider-floral`, `divider-double` and `divider-grand`;
  - `mark-lotus` and `mark-bud`;
  - the double-rule lotus corner (`corner-tl/tr/bl/br.svg`).
- **Khmer corners.** These are cut from the existing Khmer gold band (`public/frames/kbach-*.png`) into four pieces (`public/art/kbach/`). They are the artist's own left and right pieces, not flipped. A procedural kbach flame was tried and dropped because it did not reach the quality bar.

## Integration
- **CSS generation.** `paper-themes.json` gives each new paper a `compose` record. `paperThemes.ts` (`composeCss`, `COMPOSED_CSS`) generates, from that record:
  - mask placements, drawn inside the double rule so the rule reads as the ground line;
  - sizes capped by width, screen height and a ceiling;
  - engraving paint (ink or metal);
  - the blind deboss (a drop-shadow pair);
  - the frame variables;
  - the suite's crest and divider ornaments, which override the kit's `--orn-*` while the suite is chosen.
- **Layers stay separate.** Paper (`PaperSurface`), printed art (same spans, new masks), border and corners (`.bt-border`, `.bt-corner` in `FrameEdge`), motion (`CardFx` / `.ps-sheen`), then text.
- **Frame corners.** `FrameEdge` always renders the suite corners. CSS shows them only while a suite paper is active. A couple's uploaded custom frame is never covered (`FrameConfig.custom`).
- **Measuring.** `CardShell` measures whichever corner is visible, and the double rule and art are positioned from that measurement.
- **Restraint.** The cover's candle glow is hidden on the suites and section glows are reduced, so there is no haze.
- **Motion.** The foil sheen crosses only the foil and gold lines. Reduced motion turns it off (existing rule).
- **Swatches.** `public/paper/swatch/<key>.webp` was rendered from the real page.

## Tests actually run
- **Size checks (`rwbt.mjs`).** 5 suites × 6 sizes (320×568, 390×844, 740×360, 1024×768, 1280×800, 1440×900), all passing. Checks:
  - no console, page or request errors;
  - 4 corners visible and measured;
  - art masks applied and double rule on;
  - no horizontal scroll;
  - no cover content outside the sheet;
  - no corner overlapping the title, name logo, date, guest name, button or crest.
- **Motion.** The same matrix with fx `dust` and `glow`: 60 runs, all passing.
- **Visual review.** Screenshots inspected with animation off and on, at phone, landscape phone and desktop sizes.
- Not tested: Safari and real devices.
