# Wider layout, printed paper, live layer and appearance settings

## Why the invitation felt narrow

**Card width.** On desktop the card was capped at 560 px, and the side rails
took at least 280 px each (21 %).

**Cover proportions.** The cover was proportioned for a phone, with fixed
small maximum sizes and fixed gaps, so on a desktop card it sat small in the
middle.

**Changes:**

- **Card width:** up to 760 px, and up to 960 px on very large screens
  (`CardShell`). The side rails are now 240 px or 18 %.
- **Cover:** a container query (`@container (min-height: 380px) and
  (min-width: 520px)`) grows the cover on large cards. The title, names,
  date, venue and button are larger and the gaps between them open up. Phones
  never match it and keep their tested layout, which still fits at 320×568.
- **Frame corners:** capped by the screen's height (`min(25 %, 17dvh)`) as
  well as the card's width, so a wider card does not give half its height to
  the frame. The joining hairline follows the same cap, so it still meets the
  corner's tail.

## The paper (five themes, plus the couple's own)

Each sheet is built from four layers, with no image stretched:

1. **Tone and light:** a soft key from the upper left, and the sheet falling
   off a little towards its edges.
2. **Printed ornament:** an original lattice built from the couple's own
   ornaments (`scripts/paper-patterns.py` writes `public/paper/*.svg`):
   - *flourish*: the vintage pack's cross-fleury rosettes and winged fleurons
     on a hairline diamond lattice;
   - *heritage*: a double-line lattice with the invitation's lotus bud and
     small rosettes.

   Both tiles wrap every element across their edges, so they have no seam.
   The ornament is masked to be quiet in the reading area and fuller towards
   the edges.
3. **Pressed relief:** the ornament is drawn three times — a shadow, a lit lip
   and the ink, each offset by less than a pixel — so it reads as pressed into
   the paper. No blur is used, so it costs nothing on a phone.
4. **Fibre and grain:** the existing seamless paper tile at two scales and
   offsets, so no repeat lines up.

| Theme | Paper | Ornament |
|---|---|---|
| ភ្លុកបុរាណ · Classic Ivory (default) | warm ivory | flourish, champagne gold |
| បេតិកភណ្ឌខ្មែរ · Khmer Heritage | warm cream | heritage (lotus), muted gold |
| មាសស្រាំប៉ាញ · Champagne Gold | champagne cream | flourish, stronger gold |
| ផ្កាឈូកស្រាល · Romantic Blush | pale blush | flourish, rose gold |
| ក្រហមទំពាំងបាយជូរ · Deep Burgundy | burgundy | flourish, champagne gold. The card's text, gold and buttons switch to light-on-dark so everything stays readable. |
| ក្រដាសរបស់គូស្វាមីភរិយា · The couple's paper | the picture or design chosen under រូបភាពផ្ទៃខាងក្រោយ | — |

## The live layer (`CardFx`)

The layer sits above the paper and below every word and control. It uses
`pointer-events: none`, and only transform and opacity are animated.

| Mode | What runs |
|---|---|
| គ្មាន · None | nothing; the layer is not rendered |
| ធូលីមាស · Elegant Gold Dust | sparse motes rising at different depths and speeds; about a quarter catch a brief glint |
| ផ្កាអណ្ដែត · Floating Petals | a few soft petals drifting down, turning and fading |
| ពន្លឺស្និទ្ធស្នាល · Romantic Glow | a slow ambient light moving across the paper, plus an occasional shimmer on two frame corners and the crest, never all at once |
| ពេញលេញ · Full Experience | fewer motes, one or two petals, and the glow |

**Intensity** changes the real numbers: the count of motes and petals, and
the strength of the glow (low ×0.55, medium ×1, high ×1.5). Counts are halved
on a device the page already treats as low-power. The old floating motes are
replaced by this layer.

## Appearance settings

### For guests

A small round button sits bottom-left, opposite the music button. It appears
only after the envelope, and only if the couple allow it. It opens a compact
panel: a bottom sheet on a phone, a card on a larger screen. The panel has:

- **paper swatches**, each a small piece of the real paper;
- **animation modes** and **intensity**;
- **reset to default**.

**Live preview.** Every choice applies at once by restyling only. Nothing
reloads or re-mounts, the music keeps playing, the envelope is not replayed,
and there is no layout shift (measured at 0 px).

**Remembered.** The choice is saved in this browser only (`localStorage`):
the three values plus whether the guest chose them, nothing else. A script
applies it before the first paint, so there is no flash of the default.

**If storage is blocked**, the defaults still apply, and choices still work
for the visit.

**Accessibility:**

- native radio inputs, so arrow keys and screen readers work;
- clear focus rings;
- touch targets of at least 44 px;
- Escape closes the panel and returns focus to the button;
- Khmer labels with English underneath.

**Reduced motion.** If the device asks for reduced motion, animation starts
off and the panel says why. A guest's explicit choice in the panel is
honoured.

### For the couple (Settings → រូបរាង → ក្រដាស និងចលនា)

The couple choose the default paper, animation and intensity, and a switch
**អនុញ្ញាតឱ្យភ្ញៀវប្តូររូបរាង** shows or hides the guest button. These are
saved in four new columns (migration `0030`), and the server validates every
value.

## Files

- **New:**
  - `lib/appearance.ts`
  - `components/invitation/appearance/` (`store.ts`, `PaperSurface.tsx`,
    `CardFx.tsx`, `AppearancePanel.tsx`)
  - `scripts/paper-patterns.py`
  - `public/paper/pattern-{flourish,heritage}.svg`
  - `drizzle/0030_appearance.sql`
- **Changed:**
  - `CardShell.tsx`: width, rails, paper and live layer.
  - `ui/CardFrame.tsx`: height-capped corners and the shimmer hooks.
  - `ThemeStyle.tsx`: the pre-paint script.
  - `InvitationPage.tsx`: wiring.
  - `admin/ThemeForm.tsx`: the defaults card.
  - `api/admin/wedding`: validation.
  - `db/schema.ts`
  - `globals.css`: paper, live layer, panel, and the larger cover.

## Tested (actually run)

Production build, Chromium (Playwright).

- **Every paper theme** at 390×844 and 1280×800 (`paper-themes-*.png`), and
  the scrolled content on ivory and burgundy (`content-ivory-burgundy.png`).
- **Layout:** covers at 320×568, 390×844, 740×360, 1280×800 and 1920×1080
  (`wider-layout-desktop.png`). No horizontal scroll at any size, and the
  320×568 cover still fits with its button visible.
- **Every animation mode:** the number of motes, petals and lights matches the
  mode and intensity:

  | Mode | Low | Medium | High |
  |---|---|---|---|
  | Gold dust (motes) | 4 | 8 | 12 |
  | Petals | — | 3 | — |
  | Glow (lights) | — | 1 | — |
  | Full (motes / petals / lights) | — | 5 / 1 / 1 | — |

  None renders nothing. Pixels change between frames 1.5 s apart, so the
  layer really moves (`animation-modes-390.png`).
- **Guest panel on a phone (touch):**
  - it opens and fits the viewport;
  - choosing Deep Burgundy, Floating Petals and High applies at once, with
    0 px layout shift, and is saved;
  - eleven switches in a row without reloading all worked;
  - the choice survives a reload;
  - reset returns to the defaults and clears the saved choice;
  - no console errors.
- **Guest panel on desktop, keyboard only:** Enter opens it with focus on the
  close button; Tab and arrow keys change the paper; Escape closes it and
  returns focus to the button.
- **Storage throwing on every access:** the defaults apply, and a choice
  still applies, with no errors.
- **Reduced motion:** animation starts off with no animated pieces and the
  note is shown; an explicit choice of gold dust is honoured.
- **Dashboard defaults:**
  - an invalid value is refused;
  - Champagne Gold, Full and Low saved, and a new guest received exactly
    those;
  - the sample was then restored to Classic Ivory, Gold Dust and Medium.
- **Existing behaviour:**
  - the settings button is not shown over the envelope and appears after the
    opening;
  - the curtain still opens;
  - the full scroll at four sizes runs with no errors and no horizontal
    scroll;
  - `tests/opening.mjs` passes 18/18.

**Not tested:**

- Safari/WebKit and real phones. CSS mask compositing on the printed
  ornament and on the shimmer is the part most worth checking on an iPhone.
- Frame rate on a real mid-range phone. Counts are deliberately low, but
  nothing was profiled on a device.

## Note on the sample wedding

The sample wedding now opens on Classic Ivory. The dusk design it had on the
card is still there: choose **ក្រដាសរបស់គូស្វាមីភរិយា** to use it.
