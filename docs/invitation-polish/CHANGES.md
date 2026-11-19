# RSVP colours, couple row, venue map picture, larger type on big screens

## 1 · RSVP section readable on every paper
- **Root cause.** The form labels used a fixed dark brown (`.label`), and the two answer buttons used a fixed white background (`bg-white/60`). Neither followed the paper, so on the dark papers (Burgundy, Navy, Emerald, Charcoal) the labels disappeared and the answers sat as light text on a pale box.
- **Labels and placeholders.** These now use the paper's own ink token (`--c-text-rgb`): dark on light papers, light on dark ones.
- **The answer buttons** are a new `.choice` style built from the same tokens:
  - **Chosen answer:** filled with the theme colour on light papers, or the same gold as the main button (with dark text) on dark papers.
  - **Other answer:** a clear outline.

  The fields, the −/+ buttons and the summary after replying get matching dark-paper colours.

## 2 · Couple section: groom and bride side by side, equal
- **Parents.** Their lines are no longer repeated here; they still appear in the formal invitation wording.
- **One row at every size.** Groom | heart | bride sit in two equal columns, on phones too. The photo size is the same for both and scales with the screen (6.5–14 rem). The heart sits level with the middle of the photos, and both names are set in the same size.

## 3 · Venue: the couple's own map picture
- **Dashboard.** Admin → ព័ត៌មានអាពាហ៍ពិពាហ៍ → រូបភាពផែនទី (optional): upload, replace or remove.
- **Invitation.** The picture is shown whole inside the venue card, between the address and the embedded Google Map. Tapping it opens it full size.
- **Database.** `wedding.venue_map_media_id`, added by `drizzle/0035_venue_map_picture.sql` (a column with no default; the picture is optional). Like every upload, it must belong to the same workspace.

## 4 · Type size on large screens
- **Root cause.** The invitation's base size was a fixed 16 px at every width, so on a full-screen desktop the type stayed phone-sized while the card spanned the monitor.
- **The fix.** The base size now grows with the window: 16 px up to about 1100 px wide, rising to 20 px on a full-HD screen. It also follows the window's height, so a wide but short laptop screen doesn't push the cover off the card. Phones and tablets are unchanged, and the couple's own type-size setting still applies on top.
- **Measured sizes:**

  | Window | Base size |
  |---|---|
  | 390×844 | 16 px |
  | 768×1024 | 16 px |
  | 1280×800 | 16.5 px |
  | 1440×900 | 17.7 px |
  | 1919×943 | 18.3 px |
  | 1920×1080 | 20 px |
  | 2560×1440 | 20 px |

## Tests actually run
- **Browser checks on the four changes:**
  - RSVP label and answer colours on navy (1919×943), burgundy (390×844) and ivory (390×844), with screenshots reviewed;
  - the couple on one row, with equal widths and no parents' lines, at 390 and 1919 wide;
  - the map picture: uploaded, shown in the venue card and removed again; the dashboard field is present;
  - no sideways scroll and no page errors.
- **`rwbt`:** 30 papers × 6 sizes. The only flags are the expected 6 on the corners-only paper, as before.
- **Full-site check:** 7 sizes, including 1920×1080. No overlap, no clipped cover text, no sideways scroll and no errors.
- **Opening:** 18/18.
- **Ornament and text overlap:** 108 runs, 0 overlaps.
- **Not tested:** Safari and real devices.

---

# Blank dashboard, and the message sent with each invitation link

## Blank dashboard (fixed at the cause)
- **Symptom.** `/admin` showed an empty page.
- **Cause.** The browser still had a valid sign-in cookie for an account that no longer exists in the database being used (deleted, or the database was reset, re-seeded or changed). The middleware only checks that the cookie is genuine, so it let the request through. The dashboard layout then found no account and rendered nothing. The login page could not help either: a genuine cookie is sent straight back to `/admin`.
- **Fix.** When the cookie is valid but its account is gone, the layout sends the browser to a new `GET /api/auth/logout?next=/admin/login`, which clears the cookie and opens the login page.
- **Reproduced first.** With an account created, signed in, then deleted, `/admin` returned 200 with an empty body before the fix. After the fix it lands on the login page, and signing in reaches the dashboard.

## The message with each invitation link
- **Where.** Admin → ភ្ញៀវ & តំណអញ្ជើញ → **សារភ្ជាប់ជាមួយតំណអញ្ជើញ**. You write the message once.
- **Placeholders.** These fill in for each guest: `{title}`, `{name}`, `{couple}`, `{date}`, `{venue}`, `{link}`. Click one to insert it at the cursor. A live preview shows the message for one of your guests.
- **Default.** It is built only from placeholders, with no invented details. **ប្រើសារលំនាំដើម** restores it.
- **Per-guest actions:**
  - **ចម្លងសារ** copies the message with that guest's link.
  - **ចម្លងតំណ** copies only the link, as before.
  - **Telegram** now sends the message along with the link.
  - **ចែករំលែក** opens the phone's share sheet, where the device supports it.
- **A message without `{link}`** gets the link added at the end.
- **Storage.** One message per workspace, in `wedding.share_caption` (`drizzle/0036_share_caption.sql`). Empty means the default, so a later improvement to the default reaches weddings that never changed it.

## Tests actually run
- **Stale sign-in, in a real browser:** it lands on the login form, and signing in again opens the dashboard.
- **Message:**
  - typed it and inserted placeholders by clicking;
  - the preview filled in correctly;
  - it was still there after saving and reloading;
  - ចម្លងសារ put the right text and the right guest's link on the clipboard;
  - the Telegram link carries both the link and the message;
  - the default was restored afterwards;
  - no page errors.
- **Regression:** the workspace isolation test passed 45/45, the dashboard save check passed, and the opening check passed 18/18.
- **Login rate limit.** My test sign-ins tripped it (8 per 10 minutes), which is the protection working. Restarting the server cleared it before the final run.

---

# Monogram between the names; map picture opens on the page

## Monogram on the invitation's face
- **Where.** The groom's and bride's names (កូនប្រុសនាម / កូនស្រីនាម) are now three columns: groom | monogram | bride. Before, the space between them was empty.
- **What it shows.** The monogram uses the couple's own monogram text and font from the dashboard (the same mark as on the envelope), or their initials when no monogram is set.
- **No animation.** It is printed in place, with no draw-in.
- **Size.** It scales from about 77 px wide on a phone to 120 px on desktop.

## Map picture opens on the page
- **Before.** Tapping the map picture in the venue section opened it in a new browser tab.
- **Now.** It opens in an overlay on the invitation itself (`MapViewer`):
  - the picture fits the screen;
  - tapping it switches to full size (scroll to read small street names) and back;
  - ✕, Esc, or a tap outside the picture closes it, and focus returns to the thumbnail.
- **Rendered at the page root.** The overlay is portalled into `<body>`, because the card carries transforms that would otherwise trap a fixed overlay inside the card.

## Tests actually run
- **Monogram:** 1339×941 on navy, 390×844 on ivory and 320×568 on burgundy. It sits between the names and centred, with no draw-in animation and no sideways scroll. Screenshots reviewed.
- **Map, with a test picture (removed afterwards):**
  - it opens over the whole screen on the same page (same URL, no new tab);
  - the picture is visible and focus goes to ✕;
  - the full-size toggle works;
  - Esc, ✕ and a tap outside each close it, and focus returns to the thumbnail;
  - no page errors.
- **Full-site check:** 7 sizes; no overlap, no clipped cover text, no errors.
- **Opening:** 18/18.

---

# Monogram crest, wider letter, seal-gold open button, couple dividers removed

- **Couple section.** The small wing ornament under each name was removed.
- **Monogram crest** (`MonogramCrest`). It replaces the plain monogram between the names on the invitation's face:
  - **The crest:** a fine double oval ring with a beaded line between; the vintage pack's fleuron above and below; its bow scroll at each side.
  - **Finish:** everything, the initials included, is printed in a textured, embossed gold foil, lit for light or dark papers.
  - **Initials:** HTML text in the couple's monogram face, so Khmer initials (e.g. វស in Moul) shape correctly; they are sized to the crest with container units.
  - **No animation:** it is printed in place, with no draw-in.
  - **Size:** about 99 px wide on a phone and up to 11 rem on desktop.
- **The letter's text area.** On wide screens the formal wording now runs up to 52 rem and the venue line up to 46 rem (the section up to 72 rem). Before, they were narrow 32 and 26 rem columns. On a 1339-wide window the wording sets in two lines instead of four. Phones are unchanged.
- **Open button.** **បើកសំបុត្រអញ្ជើញ** now uses the wax seal's own gold (`.btn-seal`, from WaxSeal's gradient stops), with a pale rim, an inner bevel and dark-brown lettering. It used to be the theme's dark brown.

## Tests actually run
- **Screenshots:**
  - the crest with វស in Moul (as in the request) on navy at 1339×941, ivory at 390×844 and burgundy at 320×568, and with the demo's Latin S&L;
  - the couple section on navy;
  - the envelope cover at 1919×942 and 390×844.

  The letters sit inside the crest and between the names, and there is no sideways scroll. The original monogram setting was restored afterwards.
- **Regression:** opening 18/18; full-site at 7 sizes (no overlap, clipping or errors); curtains.

---

# Monogram crest (laurel), and the couple's own name-logo image

## The drawn crest
- **Redesigned.** `MonogramCrest` became a stationer's crest: hairline double ring, laurel wreath, initials, a hairline rule and the wedding date in Khmer numerals, in one quiet foil.
- **Gradient fix.** Its gradient runs across the whole crest (user space), because a per-shape gradient collapsed on the flat rule. It remains the default when no logo image is uploaded.

## Name-logo image (the couple's own artwork)
- **Why.** The couple wanted a traditional Khmer name logo: initials joined with kbach flame scrolls. A designer's artwork cannot be copied, so the dashboard now takes the couple's own file. It must be one they have the right to use.
- **Dashboard.** Admin → ព័ត៌មានអាពាហ៍ពិពាហ៍ → **រូបភាពឡូហ្គោឈ្មោះ** (upload, replace, remove), with **របៀបបង្ហាញឡូហ្គោ**:
  - **មាស · Foil** (default): the artwork printed in the invitation's gold on any paper, with the file's own background removed.
  - **ដើម · Original**: the image exactly as uploaded.
- **How Foil works.** The browser builds an alpha mask from the image (`NameLogoImage`):
  - it reads the background as the median brightness round the border;
  - it treats the opposite end of the range as the artwork;
  - it maps between the two, so the background becomes fully transparent and the artwork fully solid.

  This works for light art on a dark ground, for dark art on a light ground, and for transparent PNGs. A plain CSS luminance mask would have left a faint gold film over a dark-but-not-black background.
- **Placement.** The logo replaces the crest between the groom's and bride's names when set.
- **Database.** `wedding.name_logo_media_id` and `name_logo_mode`, added by `drizzle/0037_name_logo_image.sql`. The upload must belong to the same workspace.
- **Draft kbach logo.** I also drew an original kbach logo (វស in Bokor, with a kbach flame scroll). It was sent as a draft for review and is not built into the app.

## Tests actually run
- **The dashboard** has the upload field and the mode selector.
- **Both modes**, with my own draft logo (white on burgundy) as the test file, at 1339×941 on navy and 390×844 on ivory:
  - Foil: the background is removed cleanly and the art prints in gold;
  - Original: the image is shown as uploaded;
  - the logo sits between the names in both;
  - no page errors.

  The test logo was removed afterwards.
- **Regression:** opening 18/18; full-site at 7 sizes, clean.

---

# Show / hide the name logo

- **Dashboard.** Admin → ព័ត៌មានអាពាហ៍ពិពាហ៍ → **បង្ហាញឡូហ្គោឈ្មោះ · Show name logo** (on by default). It controls the logo between the groom's and bride's names, whether that is the uploaded image or the drawn crest. While it is off, the logo upload and mode fields are dimmed but still editable.
- **Invitation.** With the logo off, the names sit in two equal columns with nothing between them.
- **Database.** `wedding.name_logo_enabled` (default true), added by `drizzle/0038_name_logo_toggle.sql`.

## Tests actually run
- **In the dashboard:** switched off and saved; the saved value was false. On the invitation (1339×941, navy) the logo was gone and the names were in two equal columns (402/402 px).
- **Switched back on** and saved: the saved value was true, the logo was back between the names, and there were no page errors. The setting was left on.
- **Regression:** opening 18/18; full-site at 7 sizes, clean.

---

# Paper colour set in the dashboard did not reach the invitation

- **Symptom.** The paper colour changed in Admin → theme (Mint) while the invitation kept showing an old colour (Midnight Navy).
- **Cause.** The boot script that applies the paper before the first paint always preferred a choice saved in the browser (`localStorage`) over the couple's settings:
  - It did so even when guests are **not** allowed to change the look (the guest panel switched off), so an old choice could never be undone from the dashboard.
  - A guest who had chosen once kept that choice for good, even after the couple changed their design.
- **Fix** (`lib/appearance.ts`, `appearance/store.ts`, `ThemeStyle.tsx`):
  - **Guest panel off:** a saved choice is never applied; everyone sees the couple's design.
  - **Guest panel on:** a guest's choice is saved with the couple's design it was made against (`basis` = paper|tone|fx|level). When the couple changes their design, older choices no longer match: they are dropped and the new design reaches every guest, who can still choose again afterwards.
  - **Older saved choices:** choices saved before this fix carry no basis and count as stale, so the reported browser shows the dashboard's colour on its next load.

## Tests actually run
- **A:** an old saved Navy, guest panel off, couple chose Mint → shows Mint.
- **A2:** the same with the panel on → shows Mint, and the old choice is cleared.
- **B:** a guest chooses Navy in the real panel → it survives a reload, saved with its basis.
- **C:** the couple then switches to Sage → that guest sees Sage.
- **Regression:**
  - the guest panel suite (choosing, persistence, reset, keyboard, blocked storage, reduced motion);
  - opening 18/18;
  - dashboard save.
- **Clean-up:** the local settings were restored afterwards.

---

# The letter reads rule to rule

- **Symptom.** While scrolling, the invitation's text was cut well inside the card: from y=151 to y=790 on a 1339×941 window, the full height of the corner ornaments at each end, with the paper between the corners left empty.
- **Cause.** The scrolling area sat between the top and bottom frame strips, each as tall as a corner ornament, although the corners only occupy the sides.
- **Fix:**
  - **Scroll area** (`CardShell`, `globals.css` "The letter, rule to rule"). On the composed papers the scroller now reaches over the frame strips, from just inside the top rule to just inside the bottom one: 18→923 at 1339×941 (was 151→790) and 13→831 at 390×844 (was 94→750). The strips themselves are unchanged; their heights were already measured (`--band-top`, `--band-bottom`).
  - **Corners.** The scroller's visibility mask is a cross: the soft top and bottom fade, intersected with the union of (the column between the corners) and (the band between the corner rows). A long line passing a corner dissolves before the ornament instead of running under the gold.
  - **Head and foot pieces.** Papers with a centred head or foot piece, or a head or foot band, keep that end clear as before (`--sv-top` / `--sv-bot`, set per paper in `paperThemes.ts`). Grand Ceremonial measures 151→790; Continuous Border 94→750 on a phone.
  - **Couple's own frames** (`frame.custom`) are unchanged.

## Tests actually run
- **Scroll area measured** before and after, at 1339×941 and 390×844.
- **Corner screenshots reviewed:** Classic Ivory on navy at 1339×941 and ivory at 390×844, and Vintage Gold at 1280×800, with the long formal paragraph scrolled into the top zone. The line ends dissolve before the corners, with no text over the gold.
- **Head clearance:** papers with head art or bands keep their clearance (checked on Grand Ceremonial and Continuous Border).
- **Text-over-corner scan:** an automated scan at 37–58 scroll positions on 7 paper and size combinations. It flags lines inside a corner's bounding box, which includes the empty space inside the L-shaped ornament, so its remaining flags were judged against the screenshots.
- **Regression:** full-site at 7 sizes clean; opening 18/18; band and text overlap check 108 runs, 0 overlaps.

## Follow-up: the letter comes right up to the corner ornaments
- **Problem.** The first version faded text out of each corner's whole square (a cross-shaped mask), so lines and the couple's photos were cut well before reaching any gold.
- **Fix.** Text now fades only out of a **halo** round each corner's actual drawing: the ornament widened by 5% of its width, with its holes filled and its edge smoothed.
  - The halos come from `scripts/corner-halos.py` (`<corner>-halo-{tl,tr,bl,br}.svg` next to each corner drawing).
  - They are drawn from the top-left drawing and mirrored for the other three. The corner files mirror themselves with an SVG transform, which a first version of the script ignored; a mask debug render caught it.
  - The scroller's mask is the top and bottom fade minus the four halos, placed exactly over the corners (`--bt-h-*`, set per paper in `paperThemes.ts`).
- **Tests actually run:**
  - **Mask debug render:** a flat colour behind the scroller to show the visible area. All four halos hug their ornaments, and the colour is uniform elsewhere (pixel-sampled).
  - **Screenshots** at 639×945 (navy) and 390×844 (ivory) of the reported views, with the formal paragraph at the top and the couple's photos at the foot.
  - **Regression:** full-site at 7 sizes clean; opening 18/18; `rwbt` on 7 corner styles × 6 sizes, 42 runs, 0 problems.

## Gallery captions; demo placeholders without lotus

**Caption colour (អនុស្សាវរីយ៍របស់យើង).** The photo caption was drawn with the
theme tokens `text-cream` on `from-brown/75`. Dark papers (navy, burgundy…) swap
those tokens, so the caption turned dark-on-dark or pale-on-pale. It is now
`.gallery-caption` (globals.css): a fixed warm white (#fffaf0) with a soft
shadow on a deep warm scrim that fades upward, independent of the paper. It
shows on hover/keyboard focus, and is always visible on touch screens
(`hover: none`), where there is no hover.

**Lotus in the demo gallery.** The generated placeholder art
(`src/lib/placeholder.ts`) carried a lotus mark. It is now two interlocking
rings and a small diamond. Migration `0039_demo_placeholders_no_lotus.sql`
updates existing databases: for each demo image still holding the old lotus
drawing it inserts a new media row (`<id>-rings`, new id because media is
served as immutable) and repoints the gallery at it. Photos the couple
uploaded are not touched. Re-running it changes nothing.

Checked: caption colour/opacity on navy and ivory at 1339px (hover) and
burgundy at 390px (touch); gallery screenshot shows the ring placeholders;
migration re-run on a copy of the database (no new rows, 0 lotus images in
use); opening suite 18/18; full-page run at 7 sizes with no overflow or
errors; `tsc --noEmit` clean.

## Section headings, letter ink, phone gallery

- **Gallery on phones:** one column below 640px (`columns-1`); three from `sm` up.
- **RSVP:** the "(កៅអីដែលបានរៀបចំ៖ N)" seat note under the guest counter is removed.
- **Section eyebrows removed:** គូស្វាមីភរិយាថ្មី, កម្មវិធី, ទីកន្លែង, ការស្លៀកពាក់, ដំណើរជីវិត,
  រូបភាព, បញ្ជាក់វត្តមាន, ចំណងដៃ, ព័ត៌មានទំនាក់ទំនង (removed at the call sites; `SectionTitle`
  still accepts `eyebrow` but nothing passes one).
- **Couple title:** "កូនប្រុស និង កូនស្រី" → "គូស្វាមីភរិយា".
- **Date section:** "ថ្ងៃដ៏សិរីមង្គល" and "រាប់ថយក្រោយដល់ថ្ងៃមង្គលការ" are now title-size gold headings
  (same 1.35rem as section titles); the date line drops from 1.35rem to 1.05rem.
- **Contact:** cards show `groomFullName` / `brideFullName` instead of the short names.
- **Letter ink:** every line of the សិរីមង្គលអាពាហ៍ពិពាហ៍ letter (parents, សូមគោរពអញ្ជើញ, the body,
  the couple's names and labels, time, date, venue) uses one colour, `.msg .msg-ink`:
  light gold `--gold-2` (#e5cb93) on dark papers; on light papers the paper's printing gold
  `--gold-1`, since a light gold would not read on ivory.

Checked in a browser (navy at 390 and 1339, ivory at 1339): seat note and eyebrows absent,
couple title, heading/date font sizes (21.6/16.8px phone, 23.2/18.0px desktop), gallery
column count 1 on phone and 3 on desktop, one letter colour per paper, full names in contact;
screenshots reviewed. `tsc --noEmit` and `next build` clean. The earlier opening/full-page
regression scripts were not re-run this round.

## Date block removed; couple after the countdown; letter in Muol

- **ថ្ងៃដ៏សិរីមង្គល removed:** `DateSection` is now the countdown alone (heading, date,
  time and ព.ស. year dropped — the letter already states them). It renders nothing when the
  countdown is switched off. The countdown lost its own top margin, since it now opens the section.
- **Order:** letter → រាប់ថយក្រោយដល់ថ្ងៃមង្គលការ → គូស្វាមីភរិយា → programme … (InvitationPage).
- **Letter in Khmer OS Muol Light:** the four parents' names, សូមគោរពអញ្ជើញ, កូនប្រុសនាម/កូនស្រីនាម
  with the couple's names, and the date line now carry `.title-face` (the face of the
  សិរីមង្គលអាពាហ៍ពិពាហ៍ title); `font-semibold` dropped on those, as Muol is drawn heavy already.
  The invitation body, the time line and the venue stay in the body face.

Checked in a browser (navy 1339 and 390, ivory 1339): section order, the date block gone, the
highlighted lines computed as "Khmer OS Muol Light" with the font loaded; screenshots reviewed.
`tsc --noEmit` and `next build` clean.

## Envelope set: heading, framed guest name, greeting, button ink

- **Heading:** សិរីសួស្តីអាពាហ៍ពិពាហ៍ → សិរីមង្គលអាពាហ៍ពិពាហ៍; the "The Wedding Invitation" script
  line is gone. Both are stored values (`envelope_title`, `envelope_subtitle`), so
  `0040_envelope_heading_mongkol.sql` updates rows still holding the old defaults (both spellings,
  ស្តី and ស្ដី) and changes the column defaults; schema defaults match. A couple's own wording is
  left alone, and the admin can still type a line under the heading if they want one.
- **Guest name:** light gold (#f1dfba, the heading's colour and glow) inside `KbachNameFrame`, a
  frame of Khmer scrollwork: stepped double-rule corners holding a scroll that curls back at both
  ends, a crest of scrolls and a lozenge at the middle of the top and bottom rules, CSS rules between
  them so it fits any name. No flowers or petals. The address may be wider than the envelope
  (min(92vw, 48rem)) so a name stays on one line on a desktop; on phones the frame's inner margin
  narrows so a long Latin surname does not break mid-word. `--env-chrome` (the height the envelope
  leaves for the furniture) grows by the frame's height: 372px, 226px below 620px tall.
- **សូមគោរពអញ្ជើញ:** clamp(1.1rem, 4.4vw, 1.3rem) (was ~0.82rem); 0.95rem on short screens.
- **Open button text:** `.btn-seal` now uses the letter's open-button ink (#2a1418, weight 500, no
  text shadow, as `.btn-gold` on the dark papers). On light papers the letter's button is white on
  brown; the envelope button stays dark because its face is the light seal gold.

Checked in a browser at 1050×925, 1440×760, 390×844, 390×700, 360×640 and 844×390 (Latin and Khmer
guest names): heading text, no script line, greeting size, name colour, button colour/weight, no
horizontal scroll, name not breaking mid-word; screenshots and a 2× close-up of the frame reviewed.
`tsc --noEmit` and `next build` clean.

## Gilt name plaque; cover type; letter greeting of its own; no map button in the letter

- **Map button removed from the letter** (InvitationMessage). The venue section keeps its map.
- **Envelope name box → gilt plaque** (`KbachNameFrame`, rewritten): a bevelled plate of polished
  gold (metal ramp lit from the upper left, dark outline, drop shadow, faint glow) around a recessed
  panel of dark grained card (SVG fractal-noise grain, inset shadow, translucent so it takes the
  room's colour) with a fine inner gold rule. Cast-gold corner brackets with a scroll, a faceted
  lozenge and a bead, and a faceted jewel with side scrolls at the top and bottom, all filled and
  stroked with the same metal ramp and casting a small shadow. Name lettering is set as if pressed
  into the card. Scrolls, lozenges and beads only.
- **Cover (លិខិត page):** title and guest name in the letter's light gold (`--msg-ink`: gold-2 on
  dark papers, gold-1 on light ones; the photo-cover overrides still win); the ថ្ងៃ/ទី/ខែ/ឆ្នាំ labels
  ×1.4 and the greeting ×1.3 (em-scaled spans, so every container-size rule keeps its proportions);
  បើកលិខិត in bold (700).
- **Letter greeting is its own setting:** new column `invitation_lead` (`0041_invitation_lead.sql`,
  default យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ), shown above the honorifics in the letter, editable in admin
  (អត្ថបទអញ្ជើញផ្លូវការ → ឃ្លាបើកលិខិត). The cover and envelope keep `subtitle` (សូមគោរពអញ្ជើញ), whose admin
  hint now says where it appears.

Checked in a browser: letter greeting text and no map button (navy 1339/390, ivory 1339); cover
colours, label/greeting sizes and bold button (computed and screenshots, navy and ivory); plaque at 2×
with Khmer and Latin names, envelope page at 1050×925, 390×844 and 844×390 with no horizontal
scroll. `tsc --noEmit` and `next build` clean.

## Carved-gold Khmer name frame (envelope page)

Request: a guest-name frame like the user's reference sheet (gold carved Khmer frames around red panels). The design is original and follows only the general style. The reference's flower rosettes are left out (no-lotus rule).

- `envelope/KbachNameFrame.tsx` is rewritten. It draws one SVG at the box's measured pixel size (ResizeObserver), so no ornament stretches, whatever the name's length:
  - the moulding has an outer rim, a twisted-rope band and an inner rim, with chamfered, pointed ends;
  - the panel is deep red velvet: a radial gradient, a turbulence nap and a fine gold fillet;
  - at each end, a "wing" of flame tongues (kbach phleung). They grow from a stem and stream outward, with curled tips and barbs. The middle holds a spear flame and a faceted jewel in a collar;
  - top and bottom crests have a flame spire and tongues running along the rail;
  - the tongues that run in over the rail are drawn only when the frame is about one line tall, so on a two- or three-line name they don't cross the text.
- The metal comes from one lighting filter. Every piece is drawn as a grey height map, then `feDiffuseLighting` (tinted gold) and `feSpecularLighting` light it from the upper left, and the frame casts a shadow.
- CSS: all geometry is in `--knf-u`:
  - 54px by default;
  - 34px below 480px wide;
  - 30px below 380px wide, where a Latin name also gets letter-spacing .03em so the surname stays whole;
  - 26px on short screens.
- CSS: the frame has a min-width of 9.5u, so a short name still shows some rail.
- CSS: `--env-chrome` is 392px, or 234px when the screen is shorter than 620px.
- Checked:
  - screenshots at 1050×925 (Latin and Khmer names; navy, ivory and wine), 390×844, 360×640, 844×390, 1440×760 and 390×700;
  - no horizontal scroll at any size;
  - the button stays on screen, including at 844×390;
  - tsc and `next build` are clean.

## Name frame: the couple's own carved-gold plate (replaces the drawn frame)

The code-drawn flame frame was rejected as "spiky / claw-like" and "not Khmer enough". At the user's choice, the name now sits on their own artwork: the top-left frame of the reference sheet they supplied. That is the rope-scroll border with pointed ends and a crest top and bottom, and it has no flower rosettes.

- Asset `public/frames/kbach-name-frame.webp` (1512×402, 120 KB):
  - cropped at the row-2 crest join;
  - semi-transparent glow specks (alpha ≤ 70) removed;
  - Lanczos 2× upscale with a light unsharp mask.
- `KbachNameFrame.tsx` is now a plain plate:
  - the image is shown whole at its own aspect ratio and never stretched;
  - the name sits on one line in the panel's straight part (inset 38.5% / 15% / 30.5%);
  - the name is scaled down with `--knf-fit` (ResizeObserver, and again on `document.fonts.ready`) only when it's too long. Measured fit is 0.70 at 360px and 0.77 at 390px for the long Latin name, and 1 on desktop.
- CSS:
  - plate width is min(34rem, 100vw − 1.5rem), full width minus 1.25rem on phones, and 16rem on short screens;
  - `--env-chrome` is 392px, or 250px on short screens.
- Checked with screenshots at 1050×925 (Latin and Khmer names), 390×844, 360×640, 844×390, 1440×760 and 390×700. There is no horizontal scroll. tsc and `next build` are clean.

## Name plate: champagne border, panel in the paper's colour

Request: make the frame's border the same colour as the បើកសំបុត្រអញ្ជើញ button, and its background the same colour as the paper.
- **Border:** `kbach-name-frame.webp` is regenerated from the source cut. The gold is remapped by luminance onto the `.btn-seal` champagne ramp (#ecd6a8 / #c7a163 / #a7834a / #8d6a35, with darker shadows and #fff9ee highlights), so the carving's light and shade survive. The red panel is cut out (flood fill from the centre, 1px grow, 0.7px feather).
- **Panel:** new `kbach-name-panel-mask.png` (its shape, as alpha). `.knf::before` fills it, masked, with the room's own shades: `--room-0…2` from paperThemes.ts, falling back to the burgundy room's values. It has a soft edge vignette and sits under the border (`isolation: isolate`, z-index −1).
- **Checked:** screenshots on the default (cocoa), navy and ivory papers at 1050×925 and 390×844. The panel computed to each paper's room colours. tsc and `next build` are clean.

## Cover (លិខិត): the name plate, and a larger time and venue

Request: put the guest-name frame on the cover too, and make the time line (វេលាម៉ោង … · ព.ស. …) and the venue line larger.
- **Name plate:** `CoverContent.tsx` wraps `.cv-guest` in `<KbachNameFrame className="knf-cover">`. `KbachNameFrame` takes a `className`, and its fit rules now apply to any child (`.knf .knf-body > *`).
  - `.knf.knf-cover` is width min(27rem, 88cqw, 52cqh). In the two-column landscape layout it is min(30cqw, 12.5rem).
  - Its panel is the paper itself: `--pp-base`, darkening to `--pp-shade`.
  - A Latin name on the plate gets letter-spacing .03em.
- **Time and venue:** both are wrapped in `.cv-up` at 1.3em, with line-height 1.65.
- **Room for the plate:** the couple's names logo gives some height back.
  - It is capped at 47cqh in both large-card blocks (was 52 and 58), and at 41cqh when the container is 380–640px tall and at least 520px wide.
  - `.cv-open` margin-top is 3–3.2cqh (was 4–4.4).
- **Checked:** the cover content (`.cv`) measured against its shell at 1344×944, 1050×925, 1440×760, 390×844, 390×700, 360×640 and 844×390, with Khmer and Latin names. Nothing overflows; 844×390 fits with 1px to spare. Screenshots were taken on navy, ivory and the default paper. tsc and `next build` are clean.

## Envelope page fits a full-screen desktop; cover name plate removed

Requests:
- On a full-screen desktop, the envelope page cut off the title and hid the hint (សូមចុចដើម្បីបើកសំបុត្រអញ្ជើញ).
- On the cover, remove the guest-name frame and give the name more space above and below.

Changes:
- **Root cause of the desktop cut-off:** `--env-chrome` (the height reserved for the heading, name plate, button and hint) was 392px. The real furniture measures ~428px at 1050×925 and ~482px on a large desktop, where the heading is sized from the envelope. The fix sets it to 436px by default and 500px at (min-width:1200px) and (min-height:860px). Short screens stay at 250px.
- Measured title-top / hint-bottom at 1919×945 (8 / 936), 1920×1080, 1440×760, 1344×944, 1280×720, 1050×925, 390×844 and 360×640. The heading and hint are fully on screen at every size. At 844×390 the hint is hidden by design and the button bottom is at 388.
- **Cover:** `CoverContent.tsx` no longer uses `KbachNameFrame`, and the `.knf-cover` CSS is gone. The couple's names logo and `.cv-open` margins are back to their earlier values.
- **Guest-name spacing:** `.cv .cv-guest` now has margin 1.6cqh / 2.6cqh, or 2.2cqh / 3.4cqh on the large cover. The two-column landscape cover keeps its own tight spacing.
- **Laptop fit:** on a 380–640px-tall wide cover, the names logo is capped at 45cqh so everything fits. Measured overflow is −4px at 1440×760, −4px at 1344×944, −2px at 1050×925, and fits at 390×844, 390×700, 360×640 and 844×390.
- tsc and `next build` are clean.

## The letter's "when and where" in the couple's own wording

Request: four lines, as given.
- ដែលនឹងប្រព្រឹត្តទៅនៅ
- ថ្ងៃសៅរ៍ ១០កើត ខែមិគសិរ ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ ២៥៧០ ត្រូវនឹង
- **ថ្ងៃទី១៩ ខែធ្នូ ឆ្នាំ២០២៦ វេលាម៉ោង ៥ៈ៣០ ល្ងាច** (emphasised)
- នៅគេហដ្ឋានខាងស្រី ស្ថិតនៅ ភូមិព្រៃទទឹង ឃុំជ្រៃ ស្រុកថ្មគោល ខេត្តបាត់ដំបង ដោយមេត្រីភាព។

Changes:
- **New settings:** `invitationWhenIntro`, `invitationLunarDate`, `invitationDateLine` and `invitationPlace` are added to the schema, the admin API and the WeddingForm card អត្ថបទអញ្ជើញផ្លូវការ.
- **Migration `0042_invitation_when_where.sql`:** adds the four columns and writes the couple's wording into the existing invitation, but only if all four are still empty.
- **`InvitationMessage.tsx`:** each line falls back to the old built line when its setting is empty. The lunar line is shown only when set. The date line keeps the emphasised Muol style.
- **Not changed:** the cover's date grid, the countdown and the time line under it still come from the wedding date and time settings.
- **Checked:** the four lines render with these exact texts (15.4px / 15.4px / 19.3px Muol / 15.4px on desktop; 14.4 / 14.4 / 18 / 14.4px on a phone). Screenshots were taken at 1340 and 390 wide. tsc and `next build` are clean.

## New paper colour: ព្រីងទុំ (#661a3b)

- `paperTones.ts`: added `{ key: "pringtum", km: "ព្រីងទុំ", en: "Ripe Java Plum", base: "#661a3b", dark: true }`, listed after Burgundy with the dark papers. The paper, the envelope matched to it, the room, the light ink and gold, the admin choice and the guest's paper picker all come from this list, so nothing else needed changing.
- Checked in a browser with the tone selected:
  - `data-paper-tone="pringtum"` and `data-paper-dark` are set, and the room shade `--room-0` is #8a2350;
  - the letter's ink is the dark-paper light gold;
  - screenshots of the envelope page, the cover and the letter.
- tsc and `next build` are clean.

## The cover photograph (រូបភាពគម្រប) is only the link preview

Request: the cover photograph should not appear on the cover (លិខិត) page, only on the shared invitation link.
- `Cover.tsx` no longer lays the photograph under the cover. The `.cover-photo` and `.cover-on-photo` styles are removed from globals.css, including the light-writing overrides and the banded-card placement.
- `InvitationOpening.tsx` no longer passes the photograph to `CinemaRoom`, so the blurred photograph behind the envelope is gone as well. CinemaRoom's optional `photo` prop is unchanged and simply unused.
- The link preview is unchanged: `metadata.ts` and `layout.tsx` still use the cover photograph as `og:image`.
- The admin hint for the field now says it is shown only as the shared link's picture.
- Checked on the production build, with a cover photograph temporarily set in the local DB (then cleared):
  - `og:image` was the photograph;
  - there was no `.cover-photo` or `.cover-on-photo` on the cover and no `.room-dusk-photo` behind the envelope;
  - the screenshot shows the cover on its paper.
- tsc and `next build` are clean.

## Music echo, a missing music button, and Safari vs Chrome showing different papers

Reported on the Vercel site:
- Safari shows a different paper from Chrome.
- In Chrome the music sometimes doesn't show or play.
- The music sounds echoed and different from the upload.

**Echo (root cause):** `InvitationPage` renders two `MusicPlayer`s: a floating one for phones and one in the desktop rail. Only CSS hid one of them. Each owned its own `<audio>`, both were mounted and both were told to start, so the song played twice, slightly offset. The upload is not altered: the media route serves the file as stored, with no transcoding.
- `MusicPlayer.tsx` is rewritten around a single module-level `Audio` element shared by every button. The buttons only display and toggle it (via `useSyncExternalStore`).

**Not starting:** the music is started when the envelope finishes, a moment after the guest's tap, so outside the gesture. iOS Safari, and Chrome in some cases, refuse that silently.
- The first tap anywhere unlocks the element with a muted play-then-pause inside the gesture.
- If a start is still refused, the next tap starts it.
- Taps on a music button are left to the button.
- If the guest turns the music off, it is never restarted for them.

**Button missing:** the floating button sat inside the card, under ancestors with transforms, filters and containment, which makes `position: fixed` relative to them rather than to the screen. It is now portalled to `<body>` (z-index 60, `xl:hidden`, `data-music-toggle`).

**Different papers in different browsers:** a guest's own pick in the appearance panel is saved per browser (`localStorage`), and it was kept until the couple *changed* a value. A browser that had once picked a paper kept showing it while another browser showed the couple's design.
- New `appearance_rev` column (migration `0043_appearance_rev.sql`), added to the boot script's basis.
- The admin appearance page's save sends `appearanceSaved: true`. The API bumps the rev, so every browser's saved pick is dropped on its next visit and everyone sees the couple's design again.
- Turning off the guest panel stops saved picks from applying at all.

**Checked on the production build in Chromium, with a 20 s test WAV temporarily set as the music (since removed):**
- Phone (390×844):
  - before the tap, nothing plays;
  - after the envelope opens, exactly one audio element is playing;
  - the floating button is on `<body>`, on screen and hit-testable (`elementFromPoint`);
  - toggle off and on both work.
- Desktop (1440×900): one audio element plays, and the floating button is hidden.
- Theme: a saved "pringtum" pick with basis `…|0` applied; after the rev was bumped to 1, it was dropped and the couple's design showed (the rev was reset to 0 afterwards).
- Not tested in real Safari or WebKit, since no WebKit browser is installed here.
- tsc and `next build` are clean.

## {address} in the link message; three invitation themes

Requests:
- Add `{address}` to the message sent with each invitation link.
- Add Theme 2, the same as Theme 1 but with the couple's photo on the opening page instead of the envelope.
- Add Theme 3, a garden theme.

The couple chose: one theme for everyone, set in admin; a new photo upload for Theme 2; both garden files are theirs to use; and the garden look across the whole invitation, with flowers allowed in that theme.

- **`{address}`:** a new caption token for the venue address (`wedding.venueAddress`). It is in `shareCaption.ts`, the GuestManager token buttons and the guests page.
- **Theme setting:**
  - `invitation_theme` (khmer, photo or garden) and `opening_photo_id/url` are added by migration `0044_invitation_theme.sql`, with every existing invitation staying on khmer.
  - `lib/invitationTheme.ts` holds the labels.
  - In admin, the first card on រូបរាង is "ស្បែកសំបុត្រ (Theme)", with three choices and, for Theme 2, the photo upload.
- **Theme 2 (photo):** `envelope/SceneOpening.tsx` replaces `InvitationOpening` when a photo is uploaded; until then the envelope stands in.
  - Layout: the photo is full screen on a phone, and a 3:5 portrait over a blurred copy of itself on wider screens.
  - Words: the envelope title at the top; the greeting, the guest's name on the gilt plate and the open button at the foot, over darkened gradients.
  - It keeps the envelope's contract with the page: onStart, onOpen and onFinished; once per visit; the skip link; and the `<a href>` tap target that works without JavaScript. The music, film, curtains and cover therefore run exactly as after the envelope.
- **Theme 3 (garden):**
  - **Opening:** the couple's footage, cut to 0–5.5 s (`public/themes/garden/garden-intro.mp4`, muted, H.264). That ends just before its baked-in lettering appears, holding on the empty conservatory. The poster is that same last frame, so a phone that won't autoplay lands in the same place.
  - **Words on the opening:** the heading, the couple's names logo, the greeting and the guest's name on a pale ribbon appear in the light under the arches. The button sits on the flower bed, and the hint is on a pale pill.
  - **Invitation:** `applyInvitationTheme()` (in `getInvitationData`, so public pages only) overlays the garden's choices on the saved settings without changing them:
    - the "flowering-vine" paper in its own tone;
    - sage #55623F, gold #B8975C, blush #EADFD3, sheet #FBF8F1 and text #4A4A3A;
    - the floral pattern;
    - no curtains;
    - a new "garden-arch" backdrop preset (the couple's flower-arch picture) behind the card.
- **Checked:**
  - **Theme 2:** checked in Chromium with a stand-in photo, at 390×844 and 1440×900. No horizontal scroll, and tapping the button removes the overlay and the curtains follow.
  - **Theme 3:**
    - the film plays and the words come in;
    - after the tap there is no overlay and no curtains;
    - screenshots of the letter, couple, programme, venue and RSVP sections on a phone show the garden paper, colours and button.
  - **Theme 1:** still shows the envelope.
  - **Admin:** the theme card renders, the photo upload appears for Theme 2, and saving Theme 3 stored `garden`.
  - **`{address}`:** `renderCaption` fills it, run with tsx.
  - **Build:** tsc and `next build` are clean, and all migrations apply to a freshly created database.
  - **Not tested:** real Safari or WebKit, and the user's own Theme 2 photo.
- The local test database was recreated with `db:setup` after a concurrent-access mistake on my side. That affects only this sandbox's demo data.

## Themes 2 and 3: cover and letter on the opening picture; ជាគូនឹង on the letter

Requests:
- In Themes 2 and 3, the cover (page 2) and the letter (page 3) should have the same background as the opening page.
- On the letter, replace the name logo with "ជាគូនឹង".

Changes:
- **`applyInvitationTheme`:**
  - Both themes now use the "couple" paper (the card printed on a picture, as an uploaded card background does) with tone "design".
  - **Theme 2:** the card background is the opening photo (`cardBgMediaId = openingPhotoId`, or the photo URL), cover-fit, with a 62% paper-colour wash under the writing.
  - **Theme 3:** the card background is the garden film's last frame (`garden-still.webp`) with a 38% wash. `frameTint` is on, so the card's corner art takes the sage of the lettering instead of bright gold.
- **`artwork.ts` `backdropOf`:** a preset value of `src:<url>` lays that picture directly. Only the themes use it.
- **`InvitationMessage.tsx`:** between the groom's and bride's names, the monogram crest or name-logo image is replaced by "ជាគូនឹង" (Muol, `msg-join`), in every theme. The now-unused imports and `crestDate` are removed.
- **Checked:** screenshots at 1344×944 and 390×844 of the cover and the letter's couple row, for Theme 2 (with a stand-in photo), Theme 3 and Theme 1. tsc and `next build` are clean.

## Smaller garden guest name, a border switch, readable letters on pictures

Requests:
- The guest's name on the Theme 3 opening page is too big.
- Add an option to turn off the border (ស៊ុមសំបុត្រ).
- In Themes 2 and 3, the background makes the letter hard to read.

Changes:
- **Garden guest ribbon:** the font size drops from clamp(1rem, 5.4cqw, 1.8rem) to clamp(0.95rem, 4.3cqw, 1.35rem).
- **Border switch:** new `frame_enabled` column (migration `0045_frame_enabled.sql`, default true), with a toggle "បង្ហាញស៊ុមសំបុត្រ" at the top of the admin ស៊ុមសំបុត្រ card.
  - `frameConfig().shown`; when it is false, `CardShell` draws no FrameEdge (top or bottom), no `bt-border` and no side rules, and the card gets a `no-frame` class.
- **Readability on pictures (Themes 2 and 3):**
  - `backdropVars()` takes a `readingVeil`: a radial wash of the paper colour, 0.55 in the middle fading to 0 at the edges, layered over the flat wash. The picture therefore stays clear round the edges and calm behind the words.
  - `ThemeStyle` adds `sceneReadingCss`:
    - a deeper ink (#3f2a1d for photo, #3d4a2c for garden) for `--msg-ink` and `--c-text`;
    - a paper-coloured halo (`text-shadow`) on body text inside `.frame-safe`;
    - for gradient or gold titles, a `drop-shadow` halo instead, because a text-shadow would show through background-clip text.
  - Washes are 60% for photo and 42% for garden.
- **Checked:** screenshots at 390×844 and 1344×944 of the cover and the letter for both themes with the border off, using a stand-in photo for Theme 2 (since removed), plus the 1920×945 garden opening. tsc and `next build` are clean.

## Theme 2: a toned-down photograph under light writing

Request: in Theme 2, lower the background's contrast rather than fading it, so the letter reads clearly (a sample was given: a dark, warm-toned photo with light gold writing).

- The photo is now covered by a warm dark-brown layer (`PHOTO_SHADE_RGB` 40 25 16, at 58%, plus a 0.30 reading veil in the middle) instead of the paper-coloured wash. This lowers its contrast like a toned print rather than whitening it.
- The card is printed light on dark through the existing dark-paper rules.
  - `appearanceBootScript` takes `coupleDark`. Theme 2 sets `data-couple-dark`, and with it `data-paper-dark`, even though its paper is the couple's own picture.
  - `isDarkSheet()` honours that attribute, so the guest panel keeps it.
- `sceneReadingCss(photo)`:
  - the dark-paper colours, browned to match (`--c-bg` #2c1c13, the cream and beige surfaces, `--msg-ink` #f2deb0);
  - a soft dark shadow under body text and titles.
- Theme 3 is unchanged: light paper with dark sage ink and a paper-coloured halo.
- Checked with a stand-in photo (since removed): `data-paper-dark` was set and the letter ink was rgb(242 222 176). Screenshots at 390×844 (cover, letter, programme, RSVP) and 1344×944. tsc and `next build` are clean.

## Centred name plate, one-line names and dates, the map shown, pictures preloaded

Requests:
- The guest name and its frame aren't centred.
- On some phones the guest name and date on the cover, and the parents' names and date on the letter, break onto a new line.
- The embedded map doesn't show.
- All images should load up front.

Changes:
- **Plate centring (Theme 2 opening):**
  - Cause: `.knf-scene` is 94cqw wide inside a 90cqw column, and auto side margins collapse to 0 on a box wider than its parent, so the plate hung 2cqw off to the right.
  - Fix: `margin-inline: -2cqw`. Measured 17 px each side at 570 wide, 12 px at 412 and 10 px at 360.
- **One-line text:** new `components/ui/FitLine.tsx`.
  - `FitGroup` measures its `Fit` lines with a ResizeObserver, re-measuring once fonts load, and gives them one shared scale: the one the widest line needs, never above 1 and never below 0.6. Below that it lets them wrap.
  - It is used for:
    - the cover's guest name;
    - the cover's time · BE year line;
    - the letter's four parents' names, as one group so all four stay the same size;
    - the letter's emphasised date line.
  - The parents grid's column gap is 0.75rem on phones (1.25rem from `sm`).
  - Measured with a long guest name ("លោក អ៊ាន សុខដាណា និង គូដណ្ដឹង") and long mothers' names, every line stayed on one line:
    - 412 px: guest ×0.97, parents ×0.84, date ×0.88;
    - 360 px: parents ×0.71;
    - 320 px: parents ×0.62.
- **Map:** `Venue.tsx` loads the iframe by itself when the section is within 800 px of the screen (IntersectionObserver), instead of waiting for a tap. The link is made frameable by `embeddableMapUrl()`:
  - a pasted `<iframe>` snippet is reduced to its src;
  - Google embed links are kept as they are;
  - place links, short `maps.app.goo.gl` links and plain links become `maps.google.com/maps?q=…&output=embed`, using the link's coordinates when it has them and otherwise the venue's name and address;
  - with no embed link at all, the Google Maps link is used.
- **Preloading:** new `ImagePreload.tsx`. It calls React's `preload()` during render, so every picture becomes a `<link rel="preload" as="image">` in `<head>`:
  - at high priority: the opening photo or garden still, the card and page backdrops, the frame art, the name plate and its mask, and the name-logo image;
  - at low priority: the couple's portraits, every gallery photo, the gift QR and the map picture.
- **Checked:** in Chromium, with a stand-in photo and the long names, all since restored:
  - the plate measurements above;
  - the fit scales above, with nothing overflowing;
  - the preload links present in `<head>`;
  - no iframe before scrolling, and the iframe with the converted src after scrolling to the venue;
  - `embeddableMapUrl` run with tsx against five kinds of link.
  - tsc and `next build` are clean.

## The whole letter scales as one on a phone

Request: not only the parents' names and the date but all of the letter should fit the phone, so the parents' names aren't smaller than the other phrases.

- `FitGroup` gains a `zoom` mode. It measures its `Fit` lines at full size, works out the one scale the widest needs (between `min` and 1), and applies it to the whole block with CSS `zoom`. Every line, gap and margin then shrinks by the same factor and the proportions are kept. The lines inside aren't scaled again.
- `InvitationMessage` wraps all its content in `<FitGroup zoom min={0.62}>`. The rows that must stay on one line are `Fit` cells:
  - the four parents' names;
  - the couple's two names;
  - the emphasised date line.
  
  Everything else (the lead, the body, the lunar date, the place) scales with them and wraps normally.
- A fit of exactly 1 is now 1, not 0.995.
- `ImagePreload` skips the name plate and its mask when the opening page won't show (`?envelope=open`), which removes the browser's "preloaded but not used" warnings.
- Checked with long mothers' names (since restored):
  - zoom is 0.86 at 412 px, 0.733 at 360 px, 0.635 at 320 px and 1 at 1280 px;
  - no `Fit` line overflows, and nothing wraps;
  - screenshots look proportional;
  - no console errors or warnings;
  - tsc and `next build` are clean.

## Vercel "Task timed out after 300 seconds" on /api/media and /api/track

Report: Vercel logs show bursts of `/api/media/<id>` and `/api/track` failing with "Vercel Runtime Timeout Error: Task timed out after 300 seconds".

**What was wrong:** every one of those routes waits on the database, and nothing in the connection code ever stopped waiting.
- **The migration lock (the likely main cause).** Each cold instance ran `pg_advisory_lock` … `pg_advisory_unlock` before serving anything. Behind a connection pooler (a "pooled" Neon or Supabase URL), the lock and the unlock can run on different server connections, so the unlock frees nothing and the lock stays held by a pooled connection. Every instance that starts after that waits on the lock for ever, and so does every request it holds: all the pictures on a page time out together, which matches the bursts in the log.
- **No timeouts on the pool.** There was no limit on waiting for a free connection, no keep-alive and no query timeout. A connection the host had cut while the function was frozen between requests could be reused and waited on until the 300-second wall.
- **A failed start was cached.** If the first connection attempt failed, the rejected promise was kept, and every later request on that instance failed with it.
- **All media came from the database for every guest,** so every image on every visit was a function call plus a database read, and the new image preloading asks for them all at once.

**Changes:**
- **`lib/db/index.ts` (real Postgres):**
  - **Pool settings:** `max: 8`, `connectionTimeoutMillis` 10 s, `idleTimeoutMillis` 10 s, `keepAlive`, `query_timeout` 30 s, `statement_timeout` 30 s. Errors on idle connections are logged, not fatal.
  - **Vercel:** `attachDatabasePool(pool)` from `@vercel/functions` (new dependency, 3.11.3), so Fluid compute closes idle connections before suspending an instance.
  - **Migrations, fast path:** a plain read of the ledger. When every migration file is already recorded (almost every cold start), no lock is taken.
  - **Migrations, when there is work:** one transaction on one connection, with `SET LOCAL lock_timeout '20s'` and `pg_advisory_xact_lock`. The lock ends with the commit or rollback on that same connection, so a pooler can't strand it, and a lock that can't be had becomes an error after 20 s instead of a hang.
  - **Failed start:** no longer cached, so the next request retries.
  - **PGlite:** unchanged.
- **`lib/db/migrate.ts`:** new `migrationFiles()`.
- **`/api/media/[id]`:**
  - `maxDuration` 60;
  - any database failure answers 503 with `Retry-After: 2` straight away;
  - whole-file responses carry `CDN-Cache-Control: public, max-age=2592000, immutable`, so after the first guest each picture is served from Vercel's CDN, not the function and the database. Byte-range (206) responses are `no-store` on the CDN.
- **`/api/track`:** `maxDuration` 15.

**Checked against a real PostgreSQL 16 started locally**, with the production build and `DATABASE_URL` set:
- **Burst:** 62 simultaneous requests (42 media, 20 track) all returned 200 in 0.3 s, with the CDN header present.
- **Stuck lock:** another session held the migration lock while a migration was pending. The first request returned 503 after 20.1 s instead of hanging. Once the lock was released, the next request returned 200 in 0.16 s and applied the migration. The test migration and its ledger row were then removed.
- **Not tested:** the user's Vercel and Neon/Supabase setup itself.
- tsc and `next build` are clean.

## Centred guest name on the cover; two envelope settings removed; mobile admin menu

Requests:
- The guest name on the cover isn't centred.
- Remove "រូបរាងសំបុត្រ" and "រូបភាពផ្ទាល់ខ្លួនលើសំបុត្រ" from 3D Envelope & Frame.
- Make the admin usable on a phone, with the navigation in a side drawer opened by a toggle button.

**Cover guest name:**
- **Cause:** `.cv-guest` (and `.cv-time`) keep `max-width: 94%` with side margins of 0. Since the one-line fit wrapped them in a block-level row, they sat against the left edge: the line was 11 px off centre at 502 px wide and 9 px at 390 px.
- **Fix:** `.cv .cv-fit > .fit-cell { margin-inline: auto }`. Measured centre now equals the cover's centre (251/251 and 195/195).

**Envelope admin:**
- The "រូបរាងសំបុត្រ" card (envelope style picker, match-paper toggle, paper and gold colours) and the "រូបភាពផ្ទាល់ខ្លួនលើសំបុត្រ" card (a picture printed on the envelope) are removed from `EnvelopeForm`, along with the unused `ENVELOPE_STYLE_LIST` and `envelopeConfig` preview.
- The saved values aren't touched, so nothing changes on a live invitation.

**Admin navigation:** new `components/admin/AdminSidebar.tsx`, used by `app/admin/layout.tsx`.
- **On a computer:** the same fixed left column as before (now sticky), with the current page highlighted.
- **Below `lg`:**
  - a slim sticky top bar with a ☰ button and the current page's name;
  - the same column slides in from the left over a dimmed page;
  - it closes on a link, the dimmed area, ✕, Esc or a page change; the page behind doesn't scroll while it is open, and it is `inert` while closed.
- The old horizontally scrolling nav strip and the bottom logout bar are gone; the email, "មើលសំបុត្រអញ្ជើញ ↗" and logout now sit in the drawer on phones too.

**Checked in Chromium:**
- the cover measurements above;
- admin at 390×844: the menu closed, then open, a navigation link closes it and loads the page, no horizontal scroll, no page errors;
- the envelope page lists the remaining cards: បើក / បិទ, វាំងនន, ក្បាច់លើគម្របស្រោមសំបុត្រ, ត្រាបិទសំបុត្រ, ចលនា និងអក្សរ, ស៊ុមក្បាច់ខ្មែរ and វីដេអូមុនអាពាហ៍ពិពាហ៍;
- admin at 1280×800;
- tsc and `next build` are clean.

## Every section at the letter's scale on a phone

Request: the letter section fits the phone well, but the other sections don't. Every section's text should share one size and fit the screen together.

- The zoomed `FitGroup` has moved from `InvitationMessage` to `InvitationPage`, where it now wraps every section in `<main>`: the letter, countdown, couple, programme, venue, dress colours, story, gallery, RSVP, gift, contact, blessing, share bar and footer.
  - The letter's one-line rows (the parents' names, the couple and the date) still decide the scale.
  - That one scale now applies to every heading, phrase, card, photo and gap, so all sections keep their designed proportions to each other.
  - It is 1 on a computer.
- `FitGroup` now re-measures only when its *width* changes. The zoom itself changes the height, and that must not trigger another pass.
- Pop-ups (the gallery lightbox, the map viewer and the music button) are portalled to `<body>`, so the zoom doesn't affect them.
- **Checked** with long mothers' names (since restored):
  - the zoom is 0.713 at 352 px and 0.86 at 412 px;
  - all nine section headings (h2) sit on one line at both widths;
  - no horizontal scroll and no page errors;
  - screenshots of the letter, countdown, couple, programme, venue and RSVP at 352 px.
  - tsc and `next build` are clean.

## Themes 4, 5 and 6

Request: add three more themes from the user's three videos.

**The films.** Each video is cut just before its baked-in lettering appears (a template couple's names, or "18th birthday" in the third), so the opening holds on a clean scene. The still is the frame right before the cut, checked by eye to contain no text.
- Theme 4, palace garden (`palace`): 0–5.9 s.
- Theme 5, golden palace (`golden`): 0–15.0 s. This is the longest; the open button can be tapped at any time.
- Theme 6, red velvet stage (`velvet`): 0–4.0 s.

Each is muted H.264 with faststart, saved in `public/themes/<key>/` as `-intro.mp4`, `-still.webp`, `-still-tiny.webp` and `-thumb.webp`. Garden now also has a thumbnail.

**Generalised scene system:**
- **`lib/invitationTheme.ts`:** a `SCENES` registry with one spec per film theme: film, still, thumbnail, dark or light, wash, shade, ink, palette, pattern and page backdrop. `applyInvitationTheme` applies any spec. `themeIsDark()` covers photo and velvet.
  - Palace: Wedgwood blue, lavender and pale stone.
  - Golden: champagne, ivory and gold.
  - Velvet: garnet and candle gold, printed light on dark, shade 34 6 12.
- **`ThemeStyle`:** the dark branch (garnet or brown dark-paper colours, light ink, dark text glow) is driven by the spec. The card's veil and the boot script's `coupleDark` follow `themeIsDark`.
- **`SceneOpening`:** accepts any film theme. The words-reveal fallback is now 17 s.
- **CSS:** `.scene-garden` becomes `.scene-film`, set by per-theme custom properties: `--sf-ink`, `--sf-glow`, `--sf-names`, `--sf-line`, `--sf-top` and `--sf-light-y`. `.scene-film-dark` is used for velvet.
- **`InvitationPage`** and **`ImagePreload`** work from `sceneOf(theme)`.
- **Admin:** the theme cards show a thumbnail and are laid out in two or three columns. One shared note is shown for all film themes.

No migration is needed; the theme is stored as text.

**Checked in Chromium for all three themes**, at 390×844 and 1440×900:
- the film plays and the words appear;
- the opening, the cover, and on a phone the letter and programme;
- `data-paper-dark` is set for velvet only;
- no page errors;
- tsc and `next build` are clean.

**Known nit:** on a wide desktop with the velvet theme, the side rail's info cards are pale on the dark backdrop.

## The cover (page 2) scales as one on a phone

Request: the cover's content should share one size and fit the phone, as page 3 does.

- `CoverContent`: `.cv` is now itself a zoomed `FitGroup` (min 0.62). The guest's name and the time line are its `Fit` rows (no longer separate groups), and their need sets one scale for the crest, the title, the names logo, the greeting, the date grid, the venue, the button and the gaps.
- **Root of a first-try failure:** the cover's width is in container units (`min(40rem, 90cqw)`), which a zoom shrinks along with the text, so the long name still didn't fit. `FitGroup` now also sets `--fit-zoom` (cleared when it measures), and `.cv.fit-group` divides its max-width by it: the column stays as wide as the cover and only its contents shrink.
- **Checked** with a long guest name (since restored) and a stand-in photo (removed):
  - the zoom is 0.80 at 352×860, 0.90 at 412×915, 0.93 at 320×640, and 1 at 1280 and on the two-column landscape cover;
  - no row overflows, the name is centred, and the button stays inside the cover;
  - no page errors;
  - tsc and `next build` are clean.

## Cover: the time and venue no longer outsize the guest's name on a small phone

Request: on small phones, the date (time) and venue lines on the cover are too big compared to the other phrases.

- **Cause:** `.cv-time`, `.cv-venue`, `.cv-lead` (សូមគោរពអញ្ជើញ) and the date labels were sized by the cover's *height* only (`cqh`), while the guest's name is bound by its width. On a tall, narrow phone the height made them as large as, or larger than, the guest's name. The ×1.3 and ×1.4 enlargements asked for earlier made it worse.
- **Fix:** each is now bound by width as well, so it sizes to whichever is smaller:
  - time and venue: `clamp(0.6rem, min(3.3cqw, 2.3cqh), 1.05rem)`;
  - greeting: `clamp(0.66rem, min(3.6cqw, 2.4cqh), 1.08rem)`;
  - date labels: `clamp(0.56rem, min(3cqw, 1.8cqh), 0.86rem)`.
  
  The desktop and large-card sizes are unchanged.
- **Measured** (greeting / guest / date label / time and venue, in px):

  | Viewport | Greeting | Guest | Date label | Time, venue |
  |---|---|---|---|---|
  | 375×860 | 15.1 (was 19.6) | 16.1 | 13.5 | 13.8 (was 14.6) |
  | 360×740 | 14.5 | 15.5 | 13 | 13.3 |
  | 320×640 | 13.7 | 14.4 | 12.5 | 12.5 |
  | 1280×900 | 20.6 | 25 | 17 | 19.8 |

  The 1280×900 figures are unchanged.
- tsc and `next build` are clean.
