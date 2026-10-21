# Design kits, and the frame fix

## 1. "Invalid data" when choosing ក្បាច់វល្លិបុរាណ

**Cause.** The dashboard offered the two flourish frames, but the server's
validation (`api/admin/wedding/route.ts`) still had its own hard-coded list of
frames, and the new ones were not on it. Saving sent `frameMotif: "flourish"`,
the server rejected it, and the whole save failed.

**Fix, at the root.** `FRAME_MOTIFS` in `lib/frame.ts` is now the one list of
frames. The dashboard's frame menu and the server's validation both read it,
so they can no longer disagree.

**Verified** through the API and by driving the dashboard in a browser:

- `flourish`, `flourish-loop` and `kbach` all save;
- `royal` and unknown kits are refused.

## 2. Frames removed

These frames were removed everywhere, not just hidden:

- ក្បាច់ផ្កាមាស
- ក្បាច់ផ្កាមាស (ស្រាល)
- ផ្កាឈូក
- ក្បាច់អណ្ដាតភ្លើង
- ប្រាសាទអង្គរវត្ត
- ធម្មចក្រ

What was taken out:

- the two royal corner PNGs and their frame entries;
- the generated-band component (`OrnamentBand`), with its card and preview
  branches;
- the side-rule setting that only those bands used.

The frame menu now offers ក្បាច់វល្លិបុរាណ, ក្បាច់វល្លិបុរាណ (រង្វង់) and
ក្បាច់ខ្មែរមាស. Migration `0027` moves any saved invitation that was on a
removed frame to ក្បាច់វល្លិបុរាណ. Any unknown frame also falls back to it,
never to nothing.

## 3. Design kits (Settings → រូបរាង → ឈុតក្បាច់តុបតែង)

A kit chooses every ornament on the invitation at once:

- the crest above the heading and on the envelope's inner card;
- the ornament under each section title;
- the dividers (date, countdown, programme, venue, gift, contact, share,
  thank-you);
- the small accents;
- the stamp pressed into the wax seal;
- what is printed on the envelope's flap.

Picking a kit also switches the frame to that kit's frame, unless the couple
uses their own uploaded frame. The frame can still be changed on its own
afterwards.

| Kit | Ornaments | Seal | Flap | Frame |
|---|---|---|---|---|
| **ក្បាច់វល្លិបុរាណ** (default) | your vintage flourish pack | cross-fleury rosette | medallion under the initials | ក្បាច់វល្លិបុរាណ |
| **ក្បាច់ខ្មែរមាស** | the original lotus crown, lotus and rule | lotus crown | initials only | ក្បាច់ខ្មែរមាស |

**How it works.**

- Components ask for an ornament by its job (`<Flourish role="title" />`),
  never by kit.
- `ThemeStyle` publishes the active kit's file, proportions and size for each
  job as CSS variables (`lib/designKit.ts`).
- The pieces only one kit has (each seal stamp, the flap medallion, the scroll
  at the start of the name mark) carry a `kit-only-*` class, and the other kit
  hides them.
- The page renders the same way for either kit, so nothing has to be passed
  down through the components.
- Adding a third kit means one entry in `DESIGN_KITS`.

**Saved data.**

- New column `design_kit` (migration `0027`), defaulting to the vintage kit.
- An invitation that had deliberately chosen the Khmer gold band starts on the
  Khmer gold kit, to match.
- The server only accepts the kits that exist.

## Tested (actually run)

Production build, Chromium.

- **API:** the save and refusal cases listed in section 1.
- **Dashboard, in a browser:**
  - the frame menu lists exactly the three frames;
  - saving ក្បាច់វល្លិបុរាណ shows "បានរក្សាទុករូបរាង";
  - switching to each kit and saving works, confirmed by reading the saved
    values back;
  - no console errors.
- **Invitation in the Khmer gold kit** at 390×844: cover, full scroll and
  envelope (`khmer-gold-kit-390.png`, `envelope-both-kits.png`). There were no
  console errors and no sideways scroll. The data was then switched back to
  the vintage kit.
- **Invitation in the vintage kit** at 320×568, 390×844, 740×360 and 1280×800:
  no console errors, no sideways scroll.
- **Opening suite:** `tests/opening.mjs` passes 18/18.

**Not tested:**

- The Khmer gold kit at the other three screen sizes.
- Safari and real phones.
