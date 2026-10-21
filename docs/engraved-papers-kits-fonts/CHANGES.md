# Papers printed as real stationery, 18 more design kits, 30 more Khmer fonts

## 1. Papers rebuilt as printed stationery
The papers looked generated: every shape had flat colour fills and the same
plastic bevel. The drawing (kbach, flowers, layouts) is kept. The way it is
printed is new (`scripts/kbach-paper.py`, `Tile.engraving`):

- **Gold line work for the kbach** (`*-kline.webp`). Every kbach shape is
  outlined, with its carved lines, the way a Khmer draughtsman draws it, and
  printed in a gold gradient. The foil fill behind it is now only a faint
  wash.
- **Botanical engraving for the flowers** (`*-line.webp`). Each petal and leaf
  has three parts:
  - an outline;
  - hatching that runs along its length, thickens toward the throat and thins
    to nothing at the lip;
  - veins.

  The lines wander and the inking is slightly uneven, so they read as cut by
  hand and printed.
- **A hand-tinted watercolour wash.** The flower colour is a thin, uneven wash
  that pools at its edges. It does not quite fill every shape and sits 1–2 px
  off the printed line, as a colourist's wash does.
- **A real impression.** The hard bevel is replaced by a soft press:
  - printed lines bitten in slightly;
  - blind ornament pressed in along its outline only;
  - a gentle swell that catches the light at its shoulders.
- **Foil grain.** The gold has a fine grain and slightly imperfect edges.

The page has two new layers, `.ps-kline` (gold) and `.ps-line` (ink). Each
paper's ink colour and line strength are in `paper-themes.json` (`line`,
`lineAlpha`, `kline`). The shimmer now runs along the gold lines. The swatches
are regenerated.

## 2. Eighteen more design kits (ឈុតក្បាច់តុបតែង)
`scripts/design-kits.py` writes `public/kit/sets/<kit>/<role>.svg` and
`src/lib/design-kits.json`, so there are 20 kits in all.

Each kit draws all 13 ornament roles from its own motifs: crest, four title
scrolls, rule, star rule, medallion, fleuron, wing, share, rosette and seal
mark. The files are vector art; carved lines are real holes, made with an SVG
mask. Paths are simplified, at about 8 KB per file. Each kit also moves the
card frame to a matching one.

**Khmer:**
- ក្បាច់ភ្ញី (flame scrolls)
- ឈូក និងក្បាច់ (lotus)
- ផ្តែរអង្គរ (temple lintel)
- រលកនាគ (naga wave)
- ផ្កាចន្ទក្បាច់ (phka chan)

**Flowers:**
- ផ្ការំដួល (rumduol)
- ផ្កាចំប៉ា (frangipani)
- ផ្កាម្លិះ (jasmine)
- ផ្កាកុលាប (rose)
- ផ្កាប៉េអូនី (peony)
- ផ្កាសាគូរ៉ា (cherry blossom)
- ផ្កាដេស៊ី (daisy)

**Classical:**
- កម្រងស្លឹកឡូរ៉ែល (laurel)
- ក្បាច់បារ៉ូក (acanthus)
- អាត ដេកូ (art deco)
- ខ្សែស្ដើងទំនើប (fine line)
- ផ្កាយ និងព្រះចន្ទ (celestial)
- ស្លឹកអ៊ឺកាលីប (eucalyptus)

**Seal and flap.** With one of the new kits, the wax seal is pressed with the
kit's own mark (`.pe-wax-mark`), and the envelope flap carries its medallion in
foil (`.pe-flap-kitmark`). Both use the kit's art as a mask. The two original
kits keep their own seal stamps and flap medallion.

## 3. Thirty more Khmer fonts (ពុម្ពអក្សរ)
`scripts/khmer-fonts.py` writes `public/fonts/khmer/`,
`public/fonts/khmer/khmer-fonts.css` and `src/lib/khmer-fonts.json`. There are
now 38 typefaces, all self-hosted.

**New Google Fonts Khmer families:**
- **For headings:** Angkor, Bayon, Chenla, Dangrek, Freehand, Metal, Kdam
  Thmor Pro.
- **For text:** Battambang, Content, Khmer, Koh Santepheap, Nokora,
  Siemreap.
- **Already bundled for the monogram, now offered here too:** Moulpali,
  Koulen, Bokor, Taprom, Fasthand, Odor Mean Chey, Preahvihear, Suwannaphum,
  Hanuman.

**The Khmer OS family**, the faces most Cambodian documents are set in: Khmer
OS, Khmer OS System, Khmer OS Content, Khmer OS Bokor, Khmer OS Fasthand, Khmer
OS Freehand, Khmer OS Metal Chrieng and Khmer OS Muol Pali. Khmer OS Muol,
Siemreap and Battambang were listed before but not bundled; they now are too.

**Licences:**
- Google Fonts families: SIL OFL 1.1.
- Khmer OS: LGPL-2.1+, converted from Ubuntu's `fonts-khmeros` packages with no
  change to glyphs or metrics.

**Font picker.** In the dashboard, the plain font lists are replaced by
pickers (`admin/FontPicker.tsx`). Each picker shows every typeface setting a
line of Khmer, grouped into display faces and text faces, with the group that
suits the slot first.

## Tests run
All tests used Playwright with Chromium on a production build.
- **All 30 papers:** each loads with its new layers and no errors; contact
  sheets checked by eye.
- **All 18 new kits**, each saved through the dashboard API:
  - the invitation uses the kit's art;
  - the seal mark and the flap medallion appear;
  - no failed requests.

  The original kit was restored afterwards, and its generated seal and flap
  elements are hidden.
- **Fonts:** all 38 families load in the picker, with no failed font
  requests.
- **Seven screen sizes, full test:** envelope opening, cover, and all 12
  sections — no clipping, no overflow, no errors.
- **Opening suite:** 18/18 passed.
- **Curtain:** 390 and 1440.
- **Guest panel:** all checks passed.
- **Dashboard:** saving a paper and an animation, and the envelope match
  setting.

**Not tested:** Safari and real phones.
