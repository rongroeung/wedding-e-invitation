# Background designs, and monogram or name mark on the envelope

## 1. Envelope flap: monogram or name mark

**Where:** Settings → ស្រោមសំបុត្រ → **ក្បាច់លើគម្របស្រោមសំបុត្រ**.

You choose between two marks:

- **ឡូហ្គោឈ្មោះ** (the default): the couple's full name mark, as before.
- **អក្សរផ្ចិត (Monogram)**: the initials from the wedding details
  (currently «S&L»), in the monogram font.

The card shows which initials will be used. If none are entered, the flap
falls back to the name mark rather than going blank.

Whichever mark is chosen, the kit's medallion sits under it at a matching
size.

**Implementation:**

- New column `envelope_flap_mark` (migration `0029`), validated by the server
  (`namelogo` or `monogram`).
- `InvitationOpening` passes it to `Envelope`, which draws `Monogram` or
  `NameLogo` on the flap's outer face, so either turns with the flap.

## 2. Built-in background designs (Settings → រូបភាព → រូបភាពផ្ទៃខាងក្រោយ)

The three supplied designs are now ready-made options for both surfaces, the
page behind the card and the card's own paper:

| Option | Source | Prepared as |
|---|---|---|
| ក្បាច់ផ្កាបុរាណ | classic vintage floral texture | 2400 px WebP (84 KB), laid across the surface |
| ក្បាច់ដាម៉ាស | seamless damask pattern | exactly one repeat of the pattern (1360 px at source, found by autocorrelation), 640 px WebP (43 KB) repeated at 320 px. Its edges match like any two neighbouring columns inside it, so it has no seam. |
| ក្បាច់លើពណ៌ព្រលប់ | abstract background with decorative pattern | 2000 px WebP (340 KB), laid across the surface |

The original vector files are kept in `design/backgrounds/`.

**In the dashboard:**

- Each surface gets a row of swatches above its upload field: "គ្មាន" plus
  the three designs.
- Picking a design replaces an uploaded picture on that surface, and
  uploading replaces the design, so it is always clear which one shows.
- The strength slider works for designs too. The way the picture is laid is
  set by the design itself (the damask repeats; the others cover).

New columns `page_bg_preset` and `card_bg_preset` (migration `0029`), both
empty by default, so nothing changes until a design is chosen. The server only
accepts the three designs or none.

### A fix found while testing: the page picture was never visible

The page picture was drawn on a fixed sheet behind everything, but the stage
around the card painted solid colour over it: the stage, its centre runway,
the set, and the side panels. So an uploaded page picture could never be seen.

Now, when a page picture or design is chosen:

- those surfaces let it through;
- the side panels become a translucent wash of their own colour, so their
  text stays readable;
- the drawn set (arch, columns, candles, bokeh) is put away, because the
  picture is the backdrop now.

Without a page picture, nothing changes.

## Tested (actually run)

Production build, Chromium.

- **Page backgrounds:** each of the three designs at 1280×800
  (`page-backgrounds-1280.png`).
- **Card paper:** the damask at 390×844, and floral paper together with a
  damask page.
- **Layout:** no console errors and no sideways scroll in any of these.
- **Dashboard, in a browser:**
  - choosing ក្បាច់ដាម៉ាស for the page and saving stored it;
  - both swatch rows and both strength sliders show;
  - no console errors.
- **API:** an unknown design and an unknown flap mark are refused.
- **Flap:** monogram and name mark side by side at 1280
  (`flap-monogram-and-name-mark.png`). The full opening with the monogram ran
  at 390×844 with no errors.
- **Opening suite:** `tests/opening.mjs` passes 18/18.
- **Sample wedding restored afterwards:** no design on either surface, name
  mark on the flap.

**Not tested:** Safari or real phones.

**Licences:** check that each design's licence covers your use before
publishing.

## Follow-up: the designs on the card itself

The designs were meant for the **paper inside the frame**, the card's own
background. Two things changed.

**A bug, fixed at its cause.** The card paper option existed, but any picture
on the card was nearly invisible, uploads included. The seamless-paper change
had given the card's element (`.paper`) the `overlay` blend mode for its
grain. That blend carried over to the card's own picture layers and washed the
picture into the paper colour. `.card-stock` now paints its picture layers
normally (`background-blend-mode: normal`). The grain is drawn separately
(`::before`) and is unaffected.

**The dashboard.**

- The card's row comes first, labelled **ផ្ទៃខាងក្រោយសំបុត្រ (ក្រដាសលិខិត)**.
- Picking a design also sets the wash that suits it, so the writing reads at
  once: ផ្កាបុរាណ 10 %, ដាម៉ាស 55 %, ព្រលប់ 40 %. Each can then be changed
  with the slider.
- The page row is now labelled as the area around the card on large screens.

**Tested (actually run).**

- Each design on the card at two strengths, at 390×844: cover, opened, and
  scrolled (`card-paper-designs-1.png`, `-2.png`).
- ក្បាច់ផ្កាបុរាណ picked and saved through the dashboard in a browser. The
  saved values read back as preset `vintage-floral`, strength 10.
- The invitation at 320×568, 390×844, 740×360 and 1280×800 with no errors
  (`card-paper-floral.png`).
- `tests/opening.mjs` passes 18/18.

The sample wedding is left on ក្បាច់ផ្កាបុរាណ for the card paper.
