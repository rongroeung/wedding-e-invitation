# Thirty paper designs — three collections

## Request
Thirty distinct, art-directed paper designs in three collections of ten:
- **ក្បាច់រចនាបុរាណខ្មែរ** — traditional Khmer ornament
- **ក្បាច់ចម្លាក់បុរាណខ្មែរ** — ancient Khmer sculpture & relief
- **ក្បាច់ផ្កា និងរុក្ខជាតិ** — floral & botanical

The settings must offer them as three categories with thumbnails, a selected state, live preview, persistence and reset. **No lotus in any design.**

## Audit
- **The supplied archive.** `vintage-flourish-ornament-frame-vector.zip` contains only `76795.eps` + `76795.jpg`, already extracted to `public/kit/flourish/` as 22 hand-drawn SVGs. They are reused as shapes, not redrawn.
- **Khmer flame kit.** The kit SVGs from `scripts/design-kits.py` are reused: the kbach-phni crest and medallion, and the naga crest. A new loader reads their fills, strokes and knock-out masks.
- **Previous papers.** The 5 suites from the last round become designs within the new set (see below). The old tiled papers were already removed.

## Cultural note (please read)
- **What the Khmer designs are.** All Khmer-inspired pieces are contemporary interpretations drawn for this project. They are not traced from monuments, and no piece is claimed to be a specific historical motif.
- **Motifs drawn after Angkor-period structures:**
  - the four-petalled flower in a square (ផ្កាចន្ទ, as in Angkor-period wall rosettes);
  - a diamond-lattice diaper;
  - a lintel-like garland band with drops;
  - turned balusters (temple windows);
  - ringed colonnettes (temple doorways);
  - a lozenge frieze;
  - a lobed arch with curled ends.
- **The flame-leaf crests** come from the earlier kit, which was itself a contemporary drawing.
- **No research done.** Web research for references was not carried out in this round.

## New artwork — `scripts/collection-art.py` → `public/art/collection/` (manifest `src/lib/collection-art.json`)
- **Khmer and sculpture pieces:**
  - phka chan rosette; `tile-diaper` (seamless);
  - `band-garland`, `band-balusters`, `band-colonnette-v`, `band-lozenge`, `band-scroll`(+`-v`) — the pack's twin scroll as a running border;
  - `arch`; `kbach-crest`, `naga-crest`, `kbach-medallion` (from the kit);
  - corners: `corner-phka`, `corner-single-phka`, `corner-single-sprig`, `corner-plain-double`, `corner-plain-single`;
  - pack solids for relief: `pack-acanthus`, `pack-scroll-bow`, `pack-scroll-knot`, `pack-medallion`, `pack-rosette-c`, `pack-corner-loop`;
  - `engraved-corner` / `engraved-crest`: the pack's acanthus corner and crest redrawn as engravings (outline plus hatching on the shaded side).
- **Flowers:**
  - a vintage rose: outer ring of petals with rolled lips, and a cupped heart drawn as wrapping petal edges; rose bud; rose leaf (five toothed leaflets); thorned stem;
  - `rose-spray`, `rose-single`, `garden-corner` (rose + camellia + blossoms), `garden-head` (head arrangement);
  - `band-vine`(+`-v`): an engraved running vine;
  - camellia spray, flowering branch and single camellia, re-exported with all the corner mirrors they need.
- **Mirroring.** Every mirrored or turned piece is mirrored inside its SVG.
- **Band tiles.** All repeat seamlessly, fitted with `round` so a band never ends on half an ornament.

## The paper engine (`src/lib/paperThemes.ts`, `PaperSurface`, `globals.css`)
- **New layers.** A design turns on only what it uses:
  - `.ps-recess`: a recessed channel;
  - `.ps-pattern`: a seamless pattern that steps back from the middle;
  - `.ps-emboss`: relief — a stone-tone shape lit by drop-shadows on the parent, so the light follows the shape;
  - `.pb-t/-b/-l/-r`: bands between the corners.
- **Placements.** Placements can now be centre-top/centre-bottom.
- **Printing a piece.** A single-shape piece prints on foil, line, relief or blind. A drawn scene can also be carved: its washes become relief and its engraving still prints.
- **Rules.** Double, single or none.
- **Empty plates.** An empty plate gets an empty mask. A `none` mask would paint the whole sheet; this was caught on the first concept render.
- **Text kept clear of bands.**
  - The cover's `--band-keep` grows to clear head and foot bands.
  - Content gets side padding where a design has side bands.
  - This was found by the overlap test: 33 overlaps, then 0.
- **The 30 designs** are written by `scripts/paper-designs.py` to `src/lib/paper-themes.json`. Keys kept from before:
  - `classic-ivory` → A04 Flowing Botanical Ornament (still the default);
  - `vintage-gold` → A06;
  - `floral-branches` → C03;
  - `champagne-botanical` → C09.

  Burgundy & Gold is retired, and anyone who had it falls back to the default.
- **Settings.**
  - **Guest panel:** three collection tabs, ten portrait thumbnails each. It opens on the collection of the paper in use. Choosing applies immediately, without a reload, and is saved; reset works as before.
  - **Dashboard:** lists the three collections with portrait thumbnails.
- **Thumbnails.** `public/paper/swatch/<key>.webp`, 240×320, ~3 KB each (93 KB for all 30), rendered from the real page.

## The designs

**A — Traditional Khmer ornament**

| # | key | design |
|---|---|---|
| A01 | khmer-classical-flourish | naga crest head, kbach medallion foot, acanthus corners, double rule |
| A02 | intricate-scrollwork | looped corners, running pack scroll along head and foot |
| A03 | royal-ornament | kbach flame crest + medallion, rosette corners, double rule |
| A04 | classic-ivory | acanthus corners, camellia spray, flowering branch |
| A05 | fine-line-heritage | phka chan diaper pattern stepping back from the centre, single rule |
| A06 | vintage-gold | large acanthus corners, pack medallion mid head/foot |
| A07 | continuous-border | running scroll on all four sides, rosette corners |
| A08 | engraved-antique | engraved (hatched) acanthus corners and crest in bronze ink |
| A09 | contemporary-khmer | spacious: small naga crest, rosette mark, single rule |
| A10 | grand-ceremonial | flame crest, garland foot, large acanthus corners |

**B — Khmer sculpture & relief**

| # | key | design |
|---|---|---|
| B01 | sandstone-relief | embossed diaper, sandstone paper |
| B02 | architectural-border | baluster head/foot, colonnette sides, deep relief |
| B03 | layered-stone | relief crest + medallion over blind side scrolls |
| B04 | floral-stone | camellia spray and branch carved |
| B05 | architectural-panels | lozenge-panel friezes head/foot |
| B06 | sculpted-scrollwork | carved pack scrolls and acanthus |
| B07 | recessed-frame | recessed channel, relief rosettes |
| B08 | heritage-engraving | garlands engraved in taupe, rosette corners |
| B09 | stone-and-gold | relief diaper + gold acanthus corners, garland, medallion |
| B10 | grand-relief | carved lobed arch, colonnettes, balusters |

**C — Floral & botanical**

| # | key | design |
|---|---|---|
| C01 | vintage-rose | rose spray along the foot, rose |
| C02 | camellia-elegance | camellia spray, camellia, floral corners |
| C03 | floral-branches | two flowering branches |
| C04 | ornamental-garden | mixed garden corner, rose |
| C05 | botanical-engraving | line-only specimens: rose, camellia, branch |
| C06 | floral-corners | flowers in all four corners |
| C07 | flowering-vine | engraved vines up both sides |
| C08 | antique-floral-frame | looped corners, gold vine head and foot |
| C09 | champagne-botanical | antique-gold engraving, blind camellia |
| C10 | grand-floral | head arrangement of rose, camellias and blossoms, vine foot |

## Review and fixes made before delivery
- **Concept sheet.** All 30 were rendered at 390×844 with the text hidden (`thirty-designs-concept-sheet.png`) and reviewed.
- **Fixed after that review:**
  - **Whole sheet gold.** An empty plate painted the entire sheet gold; it now gets an empty mask.
  - **Bands too short.** Bands stopped short on rules-only corners; they now run nearly to the corner.
  - **B03, B06 and B07 too alike.** B03 Layered Stone, B06 Sculpted Scrollwork and B07 Recessed Frame were made distinct.
  - **B08 too heavy.** Its dark colonnettes became garlands.
  - **Vine bands like chains.** They read as chains and were redrawn as a light engraving.
  - **C03 too small.** Its branches were enlarged.
  - **B10 arch too small.** The arch was enlarged.
- **Overlaps with text.** The band check found 33 overlaps with text:
  - foot bands touching the open button on desktop;
  - side bands touching body text on phones.

  Both are fixed at the root (cover keep-clear and content inset): 0 overlaps after.
- **Tabs.** The collection tabs got arrow-key navigation, as tabs should have.

## Tests actually run (final build)
- **Size checks (`rwbt`).** 30 designs × 6 sizes (320×568, 390×844, 740×360, 1024×768, 1280×800, 1440×900), with fx `none` and again with `dust`: 180 runs each.
  - **Checks:** no errors or 404s, 4 corners shown, rule on, no sideways scroll, cover content inside the card, no corner over the cover text.
  - **Flagged:** 6 runs in each pass, all for A06 at every size. That check expects printed art, and A06 has none by design (corners only); nothing else was flagged.
- **Band overlap check (`rwband`).** Every design with bands or head/foot pieces (17 designs × 6 sizes = 102 runs): bands against the cover text, and side bands against the opened invitation's text at two scroll positions. Result: 0 overlaps.
- **Full-site check:** 7 sizes, no overlap, no sideways scroll, no errors.
- **Opening:** 18/18.
- **Curtains:** 3 sizes.
- **Guest panel:**
  - switching across collections;
  - persistence after reload;
  - reset to the default;
  - keyboard (tabs and papers);
  - blocked storage;
  - reduced motion.
- **Papers list:** 0 problems.
- **Dashboard:** saving a paper from it (the guest receives it; restored afterwards).
- **Other existing scripts:** envelope match, 17 kits (0 issues), 38 fonts.
- **Visual review:** the 30-design sheet at phone size, six designs at desktop size, and the panel on phone.
- **Not tested:** Safari, real devices.
