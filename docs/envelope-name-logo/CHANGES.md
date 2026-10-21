# Envelope: the full name mark, and a richer burgundy room

## 1. The couple's name mark replaces the "S&L" initials on the flap

**What it was.** The flap stamped a separate `Monogram`: initials built from
the dashboard's monogram text.

**What it is now.** The flap draws `NameLogo`, the same component already used
on the card inside the envelope and on the cover:

- the given names, in HTML text;
- the drawn line with the pack's scroll at its start;
- the heart;
- the butterfly.

There is one component, so the mark cannot drift between places. It is passed
the couple's names and monogram font exactly as the card is; nothing is
retyped.

**Placement.** The mark sits in the flap's upper triangle at 30 % of the
envelope's width, starting 12 % down the flap so the groom's vowel signs stay
clear of the gold border. The kit's medallion moved down to sit between the
names and the seal.

**Foil.** On the flap only, the names are filled with a champagne-gold ramp
through the letters (`background-clip: text`): darker gold at the ends and a
soft catchlight across the middle. They also get a hair of relief, a lit lip
below and a faint shadow above, as a die leaves in paper. There is no outline,
no glow and no bevel. The line box keeps the component's own padding and its
1.9 line height, so no vowel sign or subscript is cut. This was checked in a
3× close-up (`foil-name-mark-closeup.png`).

**Animation.** The mark is a child of the flap's outer face. It turns with the
flap, foreshortens with it, and goes with the flap's back face past 90°. This
was checked in captured frames. The timeline, flap, lining, seal and card are
unchanged.

The `monogramText` prop is still accepted, so no caller had to change, but the
initials are no longer drawn on the envelope.

## 2. The burgundy room

All changes are in `globals.css` and `CinemaRoom.tsx`; colours are unchanged
apart from the room itself.

- **Layered colour (`.room-dusk`).** It replaces the single radial gradient
  with three wide, long-falloff layers:
  - a warm, muted wine field;
  - a faint dusty-mauve lift behind the envelope;
  - the floor falling into brown-burgundy;
  - deep wine at the edges.
- **Key light (`.room-key`).** It was a bright white halo; it is now a low,
  warm light whose falloff runs to the very edge, so it shows no ring.
- **Vignette.** A deeper lens falloff at the corners only.
- **Texture (`.room-grain`, new).** The card's own seamless mid-grey paper
  grain is laid in `overlay` at 55 %. It is quiet, has no visible tile, and is
  fixed to the room rather than the envelope.
- **Particles.** Dust went from 26 to 8 and is half as bright. Sparkles went
  from 7 to 2, and bokeh from 11 to 7, so the room reads as air rather than an
  effect.

The couple's-photo variant of the room is unchanged.

## Files

- `src/components/invitation/envelope/Envelope.tsx`
- `src/components/invitation/envelope/CinemaRoom.tsx`
- `src/app/globals.css`

## Tested (actually run)

Production build, Chromium.

- **Closed envelope** at 320×568, 390×844, 740×360 and 1280×800
  (`closed-four-sizes.png`), plus before/after at 1280
  (`closed-before-after-1280.png`).
- **Foil close-up** at 3×: every name's top and bottom lie inside the flap.
- **Opening frames** at all four sizes: seal pressed, flap turning, flap past
  90°, card out, and the cover (`opening-1280.png`, `opening-390.png`). In
  every frame:
  - the mark stays on the flap;
  - the card and the cover show the same mark;
  - no console errors and no horizontal scroll.
- **Ivory envelope style** (`ivory-style-1280.png`), after which the sample
  wedding's own style (blush) was put back.
- **Opening suite:** `tests/opening.mjs` passes 18/18.

**Not tested:**

- Safari and real phones. `background-clip: text` inside a 3D-turning flap is
  the part most worth checking on an iPhone.
- The Khmer/English switch, which does not exist yet.
