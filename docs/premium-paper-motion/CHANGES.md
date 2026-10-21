# Full-screen card, burgundy date section, new paper, new motion

## 1. The card fills the screen
`.card-sheet` has no width cap, and `.zone-centre` has no margins or rounded
mount any more (`globals.css`, "The card fills the screen").
- **Below 1280px:** the card is the whole window.
- **From 1280px:** the details and controls rails stay, because they carry the
  guest QR code and RSVP status. The card fills everything between them, edge
  to edge and top to bottom.

On a large sheet the cover still rises into the corner bands. Its column stays
clear of the corners.

## 2. Deep burgundy: the "ថ្ងៃដ៏សិរីមង្គល" section
**Cause:** `bg-cream` and `bg-beige` were fixed light hex colours in
`tailwind.config.ts`. The date section's `via-beige/35` wash, and the
blessing's, printed a pale band across the dark paper.

**Fix:** both are now theme tokens (`--c-cream-rgb`, `--c-beige-rgb`), and
burgundy redefines them as a lifted wine. This also corrects the placeholders
in the couple, venue and gallery sections.

**Enhancements:**
- a pool of warm light behind the date (`.section-glow`);
- the date and the countdown numbers struck in gold foil (`.foil-text`);
- the countdown cells as glazed tablets with a gold hairline and a lit top
  edge (`.cd-cell`). These have a dark-glass variant on burgundy.

## 3. Paper rebuilt (`scripts/kbach-paper.py` → `public/paper/`)
The old paper was a flat SVG lattice of clip-art rosettes, removed together
with `scripts/paper-patterns.py`. The new paper is a cotton sheet with Khmer
kbach ornament pressed into it.

**The ornament is drawn from geometry.** It is not traced from anyone's
artwork:
- **Scroll leaves:** kbach phni-style leaves that curve in an S and roll into a
  spiral, with flame hooks along the outer edge and a carved centre line.
- **Flame crowns.**
- **Lotus rosettes and lotus buds.**

**Damask** (Classic Ivory, Champagne Gold, Romantic Blush, Deep Burgundy):
- kbach-spray medallions in a half-drop repeat;
- diagonal vines;
- four-petal phka chan.

**Silk lattice** (Khmer Heritage): a hol-style double diamond of lotus buds,
scroll leaves and rosettes.

**Neutral tiles.** Every tile is neutral and seamless, so CSS supplies the
colour:
- a relief map (light and shade around grey, blended with `overlay`) that
  presses into any paper colour and shades the foil like metal;
- a foil mask, filled with a polished gold, rose-gold or champagne gradient;
- a cotton texture (mottle, fibres, grain);
- with motion on, a highlight slowly crosses the foil every 11 seconds.

**Quieter behind the words.** The ornament is fainter in the centre of the card
and fuller towards its edges. Burgundy is tone-on-tone: blind emboss with only a
trace of gold, so the gold lettering stays the brightest thing on the card.

## 4. Motion rebuilt (`appearance/fxEngine.ts`, a canvas)
It replaces the DOM dots and SVG petals, and draws these layers:
- **Gold dust at many depths:** metal flakes with their own halo that twinkle
  as they turn.
- **Bokeh:** soft, out-of-focus motes with a bright rim, like a real lens.
- **Glints:** a speck catches the light and flares into a four-pointed star.
- **Rose petals:** shaded, cupped and veined, with a translucent rim. They fall,
  sway and tumble in three dimensions: the width follows the turn, the back is
  a shade deeper, and each one casts a soft shadow on the paper.
- **Light:** pools of warm light drift across the card, and now and then a soft
  band of light passes over it, as if through a window.

**Colours follow the paper.** On light paper the gold reads as metal; on
burgundy it reads as light.

**Intensity** (Low, Medium, High) changes the counts, how often glints appear,
and the light. Less powerful devices get about half as much.

**Performance.** Everything is drawn from pre-rendered sprites. The light is
painted at one-eighth resolution and scaled up. The loop sleeps when the tab
is hidden, and device pixel ratio is capped. Reduced motion still turns it off
unless the guest turns it on.

## Tests run
All tests used Playwright with Chromium on a production build.
- **Card size:** fills the viewport at 320×568, 390×844, 740×360, 896×940,
  1024×768 and 1440×900. At 1280×800 and 1920×1080 it fills everything between
  the rails.
- **Full test at all eight sizes:**
  - real envelope opening through to the cover;
  - no clipped cover items, Khmer clipping or corner collisions;
  - button visible;
  - all 12 sections scrolled with no overflow and no errors.
- **Opening suite:** 18/18 passed.
- **Appearance panel:** all checks passed. The test was updated to read the
  canvas instead of the old DOM pieces.
- **Curtain:** 390, 1024 and 1440. The test's fake-clock pause was given a
  250 ms margin, because it raced the new animation loop.
- **Every motion mode and level** on a phone at 2× (all pieces animate):

  | Mode | Specks | Petals | Light |
  |---|---|---|---|
  | Dust, low / medium / high | 24 / 44 / 70 | – | – |
  | Petals | – | 5 | – |
  | Glow | – | – | on |
  | Full | 29 | 3 | on |

  These counts are on a device that gets the lighter version. The headless
  browser ran at about 57–61 animation frames per second.
- **Deep burgundy:** every section scrolled on a phone, with no light band
  left.

**Not tested:**
- Safari and real devices, including frame rate on a mid-range phone;
- how `overlay` blending of the relief looks on iOS.
