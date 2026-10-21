# Stationery redesign — no lotus

## Request
Premium Khmer wedding stationery with vintage scrollwork and drawn non-lotus flowers. **No lotus anywhere.** Five background options replace the old ones, with preview, persistence and reset kept.

## Audit
- **The supplied archive.** `vintage-flourish-ornament-frame-vector.zip` holds `76795.eps` and `76795.jpg`. It was already extracted to `public/kit/flourish/` as 22 SVGs: corners, crest, rules, rule ends, scrolls, rosettes, fleuron, medallion, wing and sprigs. These are hand-drawn and are the primary ornament source.
- **Weak / generic elements found:**
  - the 30 tiled papers (dense repeats behind the text);
  - the lotus-based suites from the previous round;
  - lotus in several places: the section pattern, the frame's centre mark (lotus on band frames), `GoldDivider`'s default icon, the `khmer-gold` and `kbach-lotus` kits, and the unused `PetalFall` ("lotus petals");
  - blurred bokeh circles over the card (a cloudy haze).

## Art direction
**One language.** The pack's scrollwork is used for every ornament. New drawn flowers come from one small family:

| Element | How it is drawn |
|---|---|
| Camellia | Semi-double: three rings of broad rounded petals, fine veins, engraved base shading, a ring of stamens in foil |
| Small blossom | Five-petalled |
| Camellia bud | Round, held in sepals |
| Camellia leaves | Toothed margin, midrib and paired veins |
| Flowering branch | Fine and woody |
| Climbing vine | Leaves, buds and tendrils |

**What is traditional and what isn't.** The ornament is the couple's European vintage pack. The flowers are original contemporary drawings. Nothing here is labelled as traditional Khmer art.

## Artwork (`scripts/stationery-art.py` → `public/art/stationery/`)
**Compositions.** Placed in corners, never tiled:
- `camellia-spray`: rises just inside a lower corner, with a vine climbing the side and one along the foot;
- `branch-hang`: a flowering branch below an upper corner;
- `camellia-single`: an accent, or a blind impression.

**Plates.** Each composition is written as separate plates (petal, leaf, heart washes, line engraving, foil accents). Each plate is a single-colour SVG used as a CSS mask.

**Pack pieces.** These are read as shapes (svgpathtools → shapely) and reused, never redrawn.

**Corners.** Drawn once, mirrored inside the SVG (`-tl/-tr/-bl/-br`):
- `corner-acanthus`: the pack's acanthus corner (its long swash arms left out) on a fine double rule with a quarter-round notch, and a flowering sprig along each rule;
- `corner-floral`: a small foil camellia with sprigs.

**Crest.** A foil camellia over the pack's `scroll-bow`, with flowering sprigs sweeping out to both sides.

**Dividers.**
1. `divider-double`: a fine double line with the pack's rule ends and a blossom at the centre.
2. `divider-branch`: a flowering branch.
3. The pack's `scroll-diamond` (symmetrical vintage scroll), used as drawn.
4. `divider-grand`: the pack's long rule with flowering sprigs, for major sections.

**Marks.** `mark-camellia` and `mark-blossom`. The vintage option uses `mid-top` / `mid-bottom` (the pack's medallion, mirrored for the foot).

## The five options (`paper-themes.json`, group "ក្រដាសលិខិតមង្គល · Wedding stationery")

| key | Khmer | English | Corners | Art |
|---|---|---|---|---|
| classic-ivory (default) | ភ្លុកបុរាណ ក្បាច់វល្លិ | Ivory Ornamental Elegance | acanthus | camellia spray BL, flowering branch TR, ink + light wash |
| vintage-gold | ក្បាច់វល្លិមាសបុរាណ | Vintage Gold Flourish | larger acanthus + pack medallion mid head/foot | single camellias BL/BR in gold line |
| floral-branches | មែកផ្កា | Floral Branches | floral (camellia + sprigs) | spray BL, branch TR, camellia BR, fuller wash (muted teal leaves) |
| champagne-botanical | រុក្ខជាតិពណ៌សំប៉ាញ | Champagne Botanical | acanthus | spray + branch in antique-gold line, blind-debossed camellia BR |
| burgundy-gold | ក្រហមទំពាំងបាយជូរ និងមាស | Burgundy & Gold (dark) | acanthus | spray + branch in gold line |

**Keys and fallbacks.** The default key stays `classic-ivory`, so the DB default, the boot-script fallback and reset all land on Option 1. A guest or wedding saved with a retired paper key falls back to it.

## Other changes
- **Lotus removed everywhere it was drawn.**
  - The frame's centre mark is always the pack fleuron.
  - `GoldDivider` defaults to a diamond.
  - The "lotus" section pattern is no longer drawn or offered; the "floral" pattern is now a small blossom.
  - The `khmer-gold` and `kbach-lotus` kits are no longer offered (weddings set to them get the default kit).
  - Deleted: `PetalFall.tsx`, the lotus suites' art, and the `kbach-lotus` kit files.
- **Retired paper assets deleted.** The 30 old papers' tiles and swatches, and `scripts/paper-swatches.py`. `scripts/kbach-paper.py` stays because `design-kits.py` imports its drawing library.
- **Haze removed on the suites.** The candle glow and the blurred stage bokeh over the card are hidden on these papers, and section glows are softened.
- **Ornaments.** While a stationery paper is chosen, its crest and dividers replace the kit's by role.

## Also changed during review
- **Previews.** Three static directions were rendered before applying: Ivory Ornamental, Vintage Gold Flourish and Floral Branches (`three-direction-previews.png`). Ivory Ornamental was the strongest overall and is the default.
- **Spray placement.** The camellia spray was moved to sit beside the lower corner ornament instead of over it.
- **Vintage Gold corners.** Its single camellias sit beside its larger corners. Its corners shrink on short screens: at 320×568 the corner had touched the open button.
- **Motion thinned for every paper.** Dust 80→44 specks; soft motes 9→3.
- **Kits.** A design kit the couple picks themselves still wins over the paper's crest and dividers. The paper's ornaments replace only the default vintage kit.

## Tests actually run
- **New size checks (`rwbt`).** 5 options × the 6 sizes asked for (320×568, 390×844, 740×360, 1024×768, 1280×800, 1440×900), with fx `none`, `dust` and `petals`.
  - **Checks:** no errors or 404s; 4 corners present; art masks loaded; border on; no sideways scroll; cover content stays inside the card; no corner overlapping the title, logo, date, guest name, button or crest.
  - **First run:** the 90-run pass flagged 3 problems — the Vintage corner overlapped the button at 320×568, in each fx mode.
  - **After the fix:** that size re-checked clean, and a final 60-run pass (fx `none` and `dust`) showed 0 problems.
- **Existing regression scripts.** All passing, run after the main changes:
  - full-site check (7 sizes: 0 overlap, no sideways scroll, no errors);
  - opening 18/18;
  - curtains (3 sizes);
  - guest panel (switching, reload persistence, reset, keyboard, blocked storage, reduced motion);
  - papers list (0 problems);
  - dashboard save of a paper (guest receives it; restored afterwards);
  - envelope colour match;
  - kits (17, 0 issues, after the kit-wins fix);
  - fonts (38 loaded).
- **Visual review.** Screenshots checked at phone, small phone, landscape phone, tablet and desktop, with motion off and on, and at four scroll positions on a phone.
- Not tested: Safari and real devices.
