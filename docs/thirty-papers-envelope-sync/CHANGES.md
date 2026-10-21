# 30 papers, envelope matches paper, smaller gallery, seamless date section

## 1. Envelope and invitation share their colours
A new setting, "ពណ៌ស្រោមសំបុត្រតាមក្រដាសលិខិត", is on by default (Envelope →
រូបរាងសំបុត្រ). It is stored in a new column, `envelope_match_paper`, added by
migration `0031`.

When it is on:
- **Envelope colours.** The envelope's paper, foil, wax seal and ink come from
  the chosen paper: `--sync-env-*`, generated in `lib/paperThemes.ts`.
- **Room colour.** The room behind the envelope becomes a deep, dim shade of
  the paper's own hue (`--room-0…3`, `.room-synced`):
  - an ivory card opens from a warm cocoa room;
  - a blush card from deep rose;
  - a sage card from forest green;
  - a night card from the night.
- **Fallbacks.** Dark papers lift their envelope a little so it stands off the
  room. With the couple's own picture as paper, the envelope falls back to its
  chosen style.

When it is off, the envelope uses its own style and the burgundy room, as
before.

## 2. Thirty papers in three families
The papers are now data: `src/lib/paper-themes.json`, turned into CSS by
`lib/paperThemes.ts` and injected by ThemeStyle. Each paper has its own
pattern, from `scripts/kbach-paper.py`.

| Khmer artwork | Flowers | Khmer artwork & flowers |
|---|---|---|
| ក្រហមទំពាំងបាយជូរ · Deep Burgundy (kbach damask) | ភួងផ្កាកុលាប · Rose Bouquet | ភ្លុកបុរាណ · Classic Ivory |
| មាសស្រាំប៉ាញ · Champagne Gold (kbach medallions) | វាលផ្កាដេស៊ី · Daisy Meadow | បេតិកភណ្ឌខ្មែរ · Khmer Heritage |
| ផ្កាឈូកស្រាល · Romantic Blush (phka chan) | មែកផ្ការំដួល · Rumduol Branch | សួនផ្ការំដួល · Rumduol Garden |
| ក្បាច់ភ្ញី · Kbach Phni (waves) | ផ្កាចំប៉ា · Frangipani | ផ្កាចំប៉ាពណ៌គុជ · Champa Pearl |
| ក្បាច់កនក · Kanok Scroll | ផ្កាម្លិះ · Jasmine | សួនផ្កាកុលាប · Rose Garden |
| ផ្តែរអង្គរ · Angkor Lintel | ផ្កាសាគូរ៉ា · Cherry Blossom | រាត្រីអង្គរ · Midnight Angkor |
| ផ្កាយក្បាច់ · Kbach Star (dark teal) | ផ្កាអ័រគីដេ · Orchid | ដេស៊ី និងក្បាច់ · Daisy & Kbach |
| ក្បាច់ទ្រនាប់ · Ogee Kbach | ផ្កាប៉េអូនី · Peony | សាគូរ៉ា និងក្បាច់ · Sakura & Kbach |
| ហូលខ្មែរ · Hol Ikat | ផ្កាកាមេលៀ · Camellia | អ័រគីដេ និងក្បាច់ · Orchid & Kbach (dark plum) |
| សំពត់សូត្រ · Silk Lattice | ផ្កាព្រៃ · Wildflowers | ប៉េអូនី និងក្បាច់ · Peony & Kbach |

**New flower drawings** (alongside the earlier ones): daisy, cherry blossom,
moth orchid, peony, camellia, forget-me-not, and woody branches. They are
drawn the same way: petals shaded from base to tip, domed, veined and
overlapping, in watercolour colour, with the emboss.

**What replaced what:**
- **Royal Lotus** (ឈូករាជ) is gone, replaced by **Daisy Meadow**. A guest or
  default that still points to it falls back safely to the couple's default.
- **Champagne Gold, Romantic Blush and Deep Burgundy** were colours of the
  floral damask. They are now three distinct Khmer artwork designs.

**Dark papers.** Dark papers turn the writing light through a
`data-paper-dark` attribute, which the boot script and the settings panel
set. There are four dark papers: Deep Burgundy, Kbach Star, Midnight Angkor
and Orchid & Kbach.

**Swatch pictures.** The pickers show swatch pictures
(`public/paper/swatch/*.webp`, from `scripts/paper-swatches.py`), grouped by
family. Opening the picker no longer downloads every pattern. All 30 patterns
plus the swatches come to 2.0 MB on disk, but a guest only ever loads the one
paper in use.

## 3. Gallery (អនុស្សាវរីយ៍របស់យើង)
The gallery is now a reading width (`max-w-3xl`) with three columns from 640px
wide. At 1440 and 1920 wide, photos are 242px wide instead of about 500px.

## 4. The date section (ថ្ងៃដ៏សិរីមង្គល) runs seamlessly with the paper
There were two causes:
- **A second pattern.** The section drew its own small SVG pattern
  (`PatternBackground`), which stopped at the section's box.
- **A flat wash.** A flat band of colour stopped at the same edges.

The fix:
- With a paper theme, the section's own pattern is hidden, because the paper
  is the pattern. With the couple's own picture it stays, faded out at the top
  and bottom.
- The wash is now one soft pool of light that fades to nothing well inside the
  section (`radial-gradient(closest-side …)`).
- The blessing section got the same fix.

## Tests run
All tests used Playwright with Chromium on a production build.
- **All 30 papers** on a phone: the right theme, colours and pattern applied;
  no failed requests; no errors; writing light on the four dark papers and
  dark on the rest.
- **Envelope sync** on 8 papers: envelope colours and room follow the paper.
- **The setting:** turned off in the dashboard, the envelope went back to its
  style and the burgundy room; turned on again, it matched again.
- **Gallery:** photo widths measured at 1920, 1440 and 390.
- **Date section:** the section pattern is hidden and the glow uses
  closest-side, checked at 1920, 1440 and 390.
- **Seven sizes, full test:** the envelope opening, the cover, and all 12
  sections — no clipping, no overflow, no errors.
- **Opening suite:** 18/18 passed.
- **Curtain:** 390 and 1440, clean.
- **Settings panel:** all checks passed.
- **Dashboard:** saving a paper and an animation round-trip; defaults
  restored afterwards.
- **The six newer animations:** all render and move.

**Not tested:** Safari and real phones.
