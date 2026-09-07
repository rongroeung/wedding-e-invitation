# Bundled fonts

**KhmerOSMuolLight.woff2** — Khmer OS Muol Light, by Danh Hong / Open Forum of
Cambodia, licensed **LGPL-2.1+** (see `KhmerOS-LICENSE.txt`). It is bundled so
every guest sees the same ceremonial headings, whatever device they open the
invitation on — the font is common on Cambodian desktops but absent from
phones. Converted from the Debian `fonts-khmeros` TTF to WOFF2; no glyphs or
metrics were altered.

**monogram/** — the twenty faces a couple can set their monogram in, ten Latin
and ten Khmer, all **SIL OFL 1.1**. See that folder's own README for the list
and each project's copyright line, and `src/lib/monogram-fonts.ts` for which
and why. Bundled rather than loaded from Google Fonts because the monogram is
the first thing a guest sees; `font-display: block` from our own origin shows
it once instead of re-setting the cover a moment after it opens. Only the face
actually chosen is ever downloaded.

Body text uses Noto Sans Khmer, loaded from Google Fonts (or self-hosted via
`npm run fonts:download`).
