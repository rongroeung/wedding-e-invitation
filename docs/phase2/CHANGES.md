# Phase 2 — envelope, opening, cover

Built on the tree you uploaded (`e9db445` plus your uncommitted changes, all of
them kept). Nothing is committed: every change is in the working tree, so
`git status` and `git diff` show exactly what moved. `phase2.patch` is the same
change as a single file, against the tree as you sent it.

## What changed

**Envelope.** The gatefold (two panels sliding apart onto an empty lining) is
now a flap envelope: back panel with a lined inside, a card, side and bottom
folds, and a scalloped flap with a cream lining and a gold rule. The couple's
short names (`វិសាល` · `ស្រីពៅ`) are on the flap. The seal is the starter kit's
crest seal, recoloured to champagne. Every envelope style, the couple's own
artwork upload (fit, scrim and the ornament toggle), and a custom seal text
(which still uses the drawn `WaxSeal`) all carry over.

**Opening, about 5.5 s.** The seal is pressed, then lifts with its shadow
growing and leaves; the flap folds back and re-stacks behind the card once past
upright; the card slides out at a slight angle; the envelope lowers away while
the card comes toward the camera; a brief dark beat; then your velvet curtains
part onto the cover. The state machine is the existing one. Tap-on-document
handling, the pre-hydration tap buffer, the `<a href>` fallbacks for the open
target and skip, reduced motion, "seen this visit", music on open, and the
pre-wedding film hand-over are all untouched. Only the beats and what is drawn
changed.

**Set.** A dusk room, or the couple's cover photo blurred and darkened if they
have one. Above it, the heading សិរីសួស្តីអាពាហ៍ពិពាហ៍ with *The Wedding
Invitation* beneath. Both are editable in **Admin → ស្រោមសំបុត្រ**, and
clearing a field hides that line.

**Cover.** Kit crest, title, the animated name mark (names write left to right,
the flourish draws, the heart appears, the butterfly settles), សូមគោរពអញ្ជើញ
and the guest, the date as ថ្ងៃ | ទី | ខែ | ឆ្នាំ, the time with the Buddhist
era, the venue, and your existing open button. If a cover photo is set, it
fills the cover under a dark overlay with light type.

**Name mark** (`NameLogo`). The names are HTML, not SVG `<text>`, with no
letter-spacing, and the reveal mask is bled past the line box and removed when
it finishes. It uses your monogram face when that face is Khmer, and Moulpali
otherwise. Your initials monogram (S&L, in the face you picked) is on the card
inside the envelope.

## Fixed along the way

- **740×360 landscape.** The frame bands are sized from the card's width, and
  on a phone held sideways they took most of the height. In your original, the
  cover's open button was off-screen at that size. The bands are now capped on
  short landscape screens, and a very short cover lays out in two columns.
- **Fonts.** The body fonts (Noto Sans/Serif Khmer, Kantumruy Pro, Cormorant)
  are now self-hosted in `public/fonts/body` with `fonts.css`, which your
  layout already prefers. Guests no longer depend on Google Fonts. Kantumruy
  Pro is added to the theme editor's body-font list.
- **An SWC minifier bug.** It folded `` `${W - 40} 22` `` into `960` and
  silently dropped the `22`. That path is now built with `join`, with a
  comment explaining why.

## Database

`drizzle/0024_flap_envelope.sql` is additive. It adds `envelope_title` and
`envelope_subtitle`, and moves `envelope_duration` from 2800 to 5500 only
where it is still 2800. It applies itself on first use, the same as your
other migrations.

## Removed

`SlidingCover`, `EnvelopeBack`, `EnvelopeInnerLiner`, `GiltFrame` and
`EnvelopeBotanical`. Nothing imports them any more; they are in git history.
Their CSS is still in `globals.css`. It is harmless, and can go in a later
tidy.

## Tested — what was actually run

Production build (`npm run build && npm start`), Chromium 141 via Playwright:

- `tests/opening.mjs`: 13/13 pass. Finger tap opens; beats run once and in
  order despite a double tap; the cover button is hit-testable afterwards; the
  name mark's mask is gone; no horizontal scroll; the cover button still opens
  the invitation; no console errors; skip doesn't navigate and lands on a
  usable cover; with no JavaScript the envelope has size and its link lands on
  the invitation; reduced motion opens in about 0.5 s; a tab backgrounded
  mid-opening has finished on return.
- Screenshots at 320×568, 390×844, 740×360 and 1280×800, plus opening frames
  (`opening-390.png`, `viewports.png`, `with-cover-photo.png`, and
  `before-390.png` for comparison).
- `tsc --noEmit` is clean. The admin pages return 200, the new fields save,
  and an over-long title is refused with 422.

**Not tested:** Safari/WebKit (your notes describe a WebKitGTK setup; it wasn't
installed this round), real phones, and Telegram/Messenger in-app browsers.
The flap is the only 3D transform, and it uses `backface-visibility`, which is
the thing most worth a look on an iPhone.

## Not done yet (Phase 3, awaiting your approval)

The Khmer/English switch (and with it English names on the cover), section
enhancements, the venue `.ics`, gift Save-QR, thank-you sharing, the nav
monogram, and full regression across every section.
