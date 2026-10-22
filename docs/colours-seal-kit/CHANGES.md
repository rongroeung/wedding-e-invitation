# Paper colours, the seal, and the vintage ornament set

## 1. ក្បាច់វល្លិបុរាណ (vintage-flourish kit) shows again
- **The zip.** The archive sent this time is byte-identical (md5) to the earlier one: `76795.eps` + `76795.jpg`. Its 22 ornaments were already extracted with the EPS's exact outlines (`scripts/flourish-assets.py`).
- **Why the kit wasn't showing.** Since the stationery rounds, every paper replaced the kit's crest and dividers with its own (camellia crest, branch divider and so on). So ក្បាច់វល្លិបុរាណ was never visible.
- **The fix.** That override is removed (`paperThemes.ts`, and `designKit.ts` back to a plain `:root`). The chosen kit alone decides the crest, the title scrolls, the rules and the marks, on every paper. The default kit therefore shows the pack's heart-scroll crest and its scroll dividers again. Papers keep their own frame corners.

## 2. Paper colours (new)
- **What changed and why.** The 30 designs replaced the old 30 coloured papers, so each design had only its own paper colour. The colour is now a separate choice, printed under any design.
- **The colours.** `lib/paperTones.ts`, with the option "តាមក្បាច់ · Design's own" first:
  - **Light (10):** ivory, cream, champagne, sandstone, blush, dusty rose, sage, mint, dusty blue, lavender.
  - **Dark (4):** burgundy, midnight navy, emerald, charcoal.
- **What a colour changes.** The paper tone and shading, the matched envelope and the room behind it.
- **On a dark colour, also:**
  - writing turns light and the gold brightens;
  - ink engravings print in light ink;
  - carved relief and blind pressing are relit for a dark surface;
  - the motion uses its dark palette.

  Relief lighting and stone tone are now live CSS variables for this reason.
- **Where to choose it.**
  - **Guest panel:** "ពណ៌ក្រដាស · Paper colour", with persistence and reset.
  - **Dashboard:** a row of colour chips saved as the couple's default (`appearance_tone`, migration `drizzle/0032_appearance_tone.sql`, applied automatically on first use).
- **How it's applied.** The boot script sets `data-paper-tone` before first paint.

## 3. The wax seal no longer flies away
- **Before.** The seal was a separate layer, and on opening it was carried up and off to the right.
- **Now.**
  - The seal is a child of the flap, on its point (`Envelope.tsx`; CSS: top 51/58 = 87.93% of the flap).
  - When the wax lets go it settles on the flap. The flap lifts and turns it back with it, and it leaves view as the flap passes upright, like a real sealed letter.
  - The fly-away keyframes are removed.

## Tests actually run
- **Paper colours:**
  - designs rendered on phone with navy, burgundy, sage, emerald and their own paper;
  - guest panel: 15 options; choose (navy turns dark on, sage turns it off), reload keeps the choice, reset returns to the design's own colour, no errors;
  - dashboard: save Emerald (200), kept after reload, guest receives emerald + dark, restored.
- **Seal:** frame-by-frame opening at 1280×800 shows it riding the flap and never leaving. The opening test's old assertion ("seal carried off") was replaced with "seal stayed on the flap's point". Opening: 18/18.
- **Kit:** `--orn-crest` is the pack's crest on the papers; kits test 17 kits, 0 issues.
- **Size checks (`rwbt`):** 30 designs × 6 sizes, 180 runs. The only 6 flags are A06 (corners-only by design), as before.
- **Other scripts:** full-site check (7 sizes clean), curtains, guest panel, papers, dashboard, envelope match and fonts all pass.
- **Not tested:** Safari, real devices.
