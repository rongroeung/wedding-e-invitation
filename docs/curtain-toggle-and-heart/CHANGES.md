# Curtain on/off, and the heart between the couple

## Curtain switch (Settings → ស្រោមសំបុត្រ → វាំងនន)

The curtain card has a new switch at the top, **បង្ហាញវាំងនន**, which is on
by default.

- **Off:** the curtains are not drawn at all. After the envelope, the
  invitation is simply there; the cover's name mark still draws itself in on
  the same cue.
- **On:** the curtains part exactly as before.

The settings for the couple's own curtain picture or video show only while
the switch is on.

Implementation:

- New column `curtain_enabled`, default `true`, added by migration `0028`
  (`schema.ts`).
- The server validation accepts it (`api/admin/wedding`).
- `InvitationPage` renders no curtains when it is off.
- The switch is in `EnvelopeForm`.

## The heart between bride and groom

In the couple section, the two rings and the italic "និង" are replaced by one
heart. It has the shape of the heart in the couple's name mark, but is struck
in the **same gold foil as every other ornament on the card**: the theme's
`--gold-1` … `--gold-3` ramp, on the same diagonal as the `Flourish`
ornaments, so it follows the theme like they do.

- It keeps the label "និង" for screen readers.
- It beats once as the section comes into view (static under reduced motion).
- The unused `WeddingRings` component was removed.

The "និង" between each person's father and mother is a separate word and is
unchanged.

## Tested (actually run)

**Dashboard, in a browser.**

1. Switched the curtain off and saved, then opened the invitation as a guest
   at 390×844. No curtain appeared at any point, and the cover's button could
   be tapped.
2. Switched it back on and saved. The curtain appeared and parted, and the
   cover's button could be tapped.
3. The saved value was read back as on.
4. There were no console errors.

**Heart.** Captured at 320×568, 390×844 and 1280×800 (2×). There are no rings
and no italic "និង", and no errors.

**Opening suite.** `tests/opening.mjs` passes 18/18.
