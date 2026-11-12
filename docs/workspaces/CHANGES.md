# Workspaces and the eleven redrawn papers

## 1 · Eleven paper designs redrawn

**Asked:** "not realistic, too cartoon; some don't fit the top border left and right".

### Designs changed
- **Traditional Khmer ornament (A):**
  - A01 Khmer Classical Flourish
  - A03 Symmetrical Royal Ornament
  - A07 Continuous Ornamental Border
  - A08 Engraved Antique Ornament
  - A09 Contemporary Khmer Heritage
  - A10 Grand Ceremonial Ornament
- **Khmer sculpture & relief (B):**
  - B06 Sculpted Scrollwork
  - B07 Recessed Relief Frame
  - B08 Heritage Engraving
  - B09 Stone-and-Gold Elegance
  - B10 Grand Khmer Relief Composition

### Why the top border didn't fit (root causes, fixed for all 30 designs)
1. **Single-rule corners were detected by name.** `corner-plain-single` was missed, so its CSS rule was drawn 1.3 px off the corner's own rule (`paperThemes.ts`).
2. **The rule bars were positioned by their edge.** The corner drawing's rule is centred on its line, so the two were offset by half a line width (`globals.css` `.bt-border`).
3. **The corner rules were too thin at phone size.** Below about 160 px a corner's rule is narrower than a pixel and renders as a faint hairline that meets a crisp 1 px line. The CSS rules now run on through the corner up to the quarter-round notch, so one crisp line runs from end to end.
4. **The metal shading changed colour at the joins.** Each corner's gold shading is now turned so it passes its middle tone (the colour of the rules) where the rules leave the corner.
5. **Corner art hung below the corner.** Ornaments placed in upper corners sat 0.62 of a corner below it. A `snug` placement now sets them right into the corner.

### What made them look cartoonish, and what replaced it
- **Removed:**
  - the kit's flame crests and medallions;
  - phka rosettes;
  - the garland band;
  - the spiky arch;
  - the colonnettes and balusters;
  - a coarse engraving.
- **Replaced with:** the hand-drawn ornaments of the supplied vintage pack (crest, medallion, star rule, rule, fleuron, rosette, twin scroll, bow scroll, acanthus corner). These are now exported as single shapes with mirrored variants. Each design keeps its finish:
  - gold foil;
  - ink engraving;
  - carved relief.
- **Engraving redrawn.** The line weights and hatch spacing are now sized for the size the pieces are actually shown at. The lit side stays clean paper; the shaded side gets hatching, and the deepest shade is cross-hatched. The pack's crest, medallion, bow scroll and star rule were added as engravings.
- **Honest note.** These pieces are European vintage ornament. That makes these designs less specifically Khmer than the flame-crest versions were. B02 Architectural Carved Border, which was not on the list, keeps its balusters and colonnettes.

## 2 · Workspaces — one per wedding

- **The model.** The `wedding` row is the workspace, with a unique `slug`, a `workspace_name` and a `created_at`. These tables get `wedding_id`:
  - `wedding_events`, `story_items`, `gallery_images`;
  - `guests`, `rsvps`, `page_views`;
  - `media`.
- **Admins and the owner.**
  - `workspace_members(user_id, wedding_id, role)` records who manages what.
  - `users.is_owner` marks the platform owner; the earliest account becomes the owner.
- **The migration** is `drizzle/0033_workspaces.sql`. Existing data is filed under `main`, and every existing admin is made a member of `main`.
- **Rollout safety.** The database keeps `DEFAULT 'main'` on `wedding_id`, so rows written by the previous version while a deploy rolls out land in the right wedding. The code's schema has no default, so the app always names the wedding; TypeScript refuses an insert without it.
- **Addresses.**
  - `/` is `main`.
  - `/w/<slug>` is any other workspace (`/w/main` redirects to `/`).
  - `/invite/<code>` finds its wedding from the guest's code.
  - Share previews (title, description, image, `/api/og?w=`) belong to that wedding.
- **Every admin page and API** works on the active workspace. The active workspace comes from a cookie, and that cookie is checked against the admin's memberships on every request; the owner may use any workspace.
- **Uploads.** An upload can only be attached to, or deleted from, the workspace that owns it.
- **Public replies and views.** RSVP and view tracking are filed by the guest code, or, for an anonymous reply, by the page's workspace.
- **Dashboard.**
  - A switcher appears when an admin has more than one workspace.
  - The "view invitation" link points at the current workspace.
  - The owner gets **កន្លែងធ្វើការទាំងអស់**:
    - create a workspace (with an optional first admin);
    - rename it, or change its address;
    - add or remove admins;
    - delete it, after typing its address (`main` cannot be deleted).
  - An account with no workspace sees a short explanation instead of the dashboard.
- **Users page.** It shows the current workspace's admins.
  - A couple can add a co-admin with a new account. Adding an existing account is the owner's call.
  - Couples cannot reset the owner's password, or the password of anyone who manages a wedding they don't.
- **New workspaces** start with the app's generic wording and design. The couple's and parents' names are left empty, so the first wedding's names never appear on another couple's invitation.

### Also fixed
- **Fresh local databases could not be set up.** Migration `0023_own_artwork.sql` held 16 statements in one chunk, which embedded PGlite refuses. It now has statement breakpoints. Databases that already applied it are unaffected: the ledger tracks names.
- **The seed fills in the default wedding.** It now fills a default wedding row that has never been filled in (the migration creates it bare).

## Tests actually run
- **The eleven designs, rendered and reviewed.**
  - Rendered at 390×844 and 1280×800 and looked at.
  - The top-border joins were checked at the pixel level: before the fix, the corner's rule and the CSS rule were in different rows and colours; after it, the same row and the same colour `(191,157,102)`.
- **`rwbt` size checks.**
  - The 11 designs × 6 sizes × fx `none`/`dust`: 132 runs, 0 problems.
  - All 30 designs × 6 sizes, fx `none`: 180 runs. 6 runs were flagged, all for A06, which is corners-only by design, as before.
- **`rwband` overlap check:** 108 runs, 0 overlaps.
- **Thumbnails and concept sheet.** The 11 thumbnails were regenerated, and the 30-design concept sheet was regenerated and reviewed.
- **The migration on a copy of the existing local database.** Row counts are identical before and after: users 1, media 7, events 7, story 4, gallery 6, guests 3, page views 3122. All of them are under `main`, the admin is owner and member, and the guest codes are unchanged.
- **Migration edge cases.**
  - Running it a second time: this found a bug (`INSERT … ON CONFLICT` still checks NOT NULL), which is fixed; the re-run now passes.
  - A database with no wedding row, migrated twice: passes.
  - An insert in the previous version's style (no `wedding_id`) lands in `main`.
- **Fresh database.** Seeded twice: the first run seeds everything, and the second skips it.
- **Isolation test (`ws.mjs`), 45/45 against the running server.**
  - Owner create; duplicate and reserved addresses refused.
  - A new workspace is empty and has blank names.
  - The couple's edits stay theirs: guests, wedding, export, users.
  - Cross-access is refused:
    - switching to a workspace they don't belong to;
    - a forged cookie;
    - editing or deleting another wedding's guest;
    - listing workspaces;
    - pulling in an existing account;
    - resetting the owner's password;
    - using another wedding's upload in the details or the gallery.
  - Public pages: `/w/<slug>`, an unknown slug (404), `/w/main` (redirect), `/` unchanged, the guest links of both weddings.
  - RSVP filed by code and by workspace; views counted.
  - Deletion: requires typing the address; `main` is protected; the deleted wedding's links return 404; a removed account loses access.
- **Dashboard in a browser.** Create a workspace, then switch with the switcher; the guests page follows. The phone layout has no sideways scroll, and there were no console errors.
- **Regression scripts:**
  - opening 18/18;
  - full-site check (7 sizes, no overlap or errors);
  - guest panel;
  - dashboard paper save;
  - curtains.
- **Not tested.**
  - Hosted Postgres: the migration ran on PGlite, the same Postgres engine, not on your Vercel database.
  - The share image itself: it needs Google Fonts, which this sandbox cannot reach.
  - Safari and real devices.
