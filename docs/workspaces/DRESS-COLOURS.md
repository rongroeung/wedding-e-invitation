# Wedding colours (ពណ៌សម្លៀកបំពាក់)

**Asked:** a section so guests can choose clothes that match the wedding's colours.

## What was added
- **Dashboard page.** **Admin → ពណ៌សម្លៀកបំពាក់** (`/admin/dress`):
  - a show/hide switch;
  - a title (default ពណ៌សម្លៀកបំពាក់);
  - an optional note to guests;
  - up to 8 colours. Each colour has a colour picker, a hex field and an optional name, and can be reordered or removed.
  - a live preview.

  A bad hex value disables Save.
- **Invitation section.** `DressColors` sits after the venue.
  - **Swatches of cloth:** each colour is lit from the upper left, with a soft shade, a faint weave and a fine gold rim. Pale colours get an edge of their own so they show on cream paper, and dark papers get a darker setting.
  - **Balanced rows:** up to 5 colours sit side by side, and 6–8 split evenly; phones wrap naturally.
  - **Hidden by default:** the section is hidden until at least one colour exists, so existing invitations are unchanged.
- **Data.** `wedding.dress_code_enabled`, `dress_code_title`, `dress_code_note`, and `dress_colors` (jsonb `[{hex, name}]`). The migration is `drizzle/0034_dress_colours.sql`, which only adds columns with defaults.
  - **Per workspace:** each workspace has its own colours, since they live on the wedding row.
  - **Server checks:** the server validates the hex format, a maximum of 8 colours, and names of at most 40 characters.
- **No colours are preset.** The couple chooses them.

## Tests actually run
- **Dashboard in a browser:**
  - added 5 colours and saved;
  - after a reload, all 5 were still there;
  - a bad hex disabled Save.
- **API:** a bad hex returns 422, 9 colours return 422, and clearing works. With no colours the section is not rendered.
- **The invitation, opened and scrolled to the section:**
  - 390×844 on ivory paper;
  - 390×844 on a navy (dark) paper;
  - 1280×800.

  There was no sideways scroll and there were no page errors. Screenshots were reviewed, and the rows were then balanced (desktop had wrapped 4 + 1).
- **Regression:**
  - opening 18/18;
  - full-site check at 7 sizes with no errors;
  - guest panel.
- **Clean-up:** the test colours were cleared from the local database afterwards.
- **Not tested:** Safari and real devices.
