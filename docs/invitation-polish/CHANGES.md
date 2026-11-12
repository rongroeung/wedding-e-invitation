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
