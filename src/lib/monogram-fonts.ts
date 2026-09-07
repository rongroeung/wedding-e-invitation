/**
 * The faces a couple can set their monogram in.
 *
 * Twenty of them — ten Latin, ten Khmer — chosen for one job: two capitals at
 * 236px on an otherwise empty card. That is a much narrower brief than "a nice
 * wedding font", and it is why the list is what it is. A face here has to hold
 * weight when the mark shrinks to 158px on a phone, and it has to have a
 * capital worth looking at on its own, because in a monogram a letter is not
 * part of a word — it *is* the word.
 *
 * All twenty are bundled under `public/fonts/monogram` (SIL OFL 1.1; see the
 * README there) rather than pulled from Google Fonts. The monogram is the first
 * thing a guest sees, and a webfont that arrives late shows the mark in
 * whatever serif the phone had first. **Only the chosen face is ever
 * downloaded** — twenty `@font-face` rules cost a guest nothing until something
 * on the page is actually set in one of them.
 */

export type MonogramFont = {
  /** Stored in the database. Never change one: it would re-set a live card. */
  id: string;
  /** What the dashboard calls it. */
  label: string;
  /** The CSS family name, which is also the `@font-face` name. */
  family: string;
  /** Which script this face is *for* — how the dashboard groups the list. */
  script: "latin" | "khmer";
  /** A word about what it is like, shown under the name in the dashboard. */
  note: string;
  /** Cormorant Garamond is only here for its italic. */
  italic?: boolean;
  /**
   * How the face measures, per 1000 units of font size — filled in by
   * `/tmp/font-metrics.mjs`, which loads each one in a browser and reads
   * `actualBoundingBoxAscent`/`Descent` off a canvas.
   *
   * **This is the part that cannot be guessed.** A font size is not a cap
   * height, and across these twenty the gap between them ranges from about a
   * quarter to about four fifths: set them all at one size and half the
   * monograms run off the card while the other half sit in the middle of it
   * like a postage stamp. `asc` and `desc` are the ink above and below the
   * baseline for a capital of that script; `adv` is its advance width. The
   * component solves for a size and a baseline from these, so every face fills
   * the same box.
   */
  m: { asc: number; desc: number; adv: number };
  /**
   * How far the two initials overlap, as a fraction of a letter's width.
   *
   * A formal script's capitals carry swashes off both sides and are *drawn* to
   * run into each other, so bringing them together interleaves them and the
   * pair reads as one mark. A serif's do not: the same overlap collides two
   * solid letterforms and prints a blot. Khmer has no swashes at all and its
   * glyphs are wide for their height, so its faces stand clear.
   */
  lap: number;
};

/** The Latin faces: eight formal scripts and two serifs. */
const LATIN: MonogramFont[] = [
  { id: "great-vibes", label: "Great Vibes", family: "Great Vibes", script: "latin",
    note: "Flowing formal script — the default", m: { asc: 828, desc: 391, adv: 1453 }, lap: 0.46 },
  { id: "pinyon-script", label: "Pinyon Script", family: "Pinyon Script", script: "latin",
    note: "Fine copperplate, very light", m: { asc: 734, desc: 375, adv: 1469 }, lap: 0.4 },
  { id: "parisienne", label: "Parisienne", family: "Parisienne", script: "latin",
    note: "Ornate, generous swashes", m: { asc: 781, desc: 375, adv: 1344 }, lap: 0.44 },
  { id: "italianno", label: "Italianno", family: "Italianno", script: "latin",
    note: "Light italic script", m: { asc: 594, desc: 359, adv: 1266 }, lap: 0.4 },
  { id: "tangerine", label: "Tangerine", family: "Tangerine", script: "latin",
    note: "Delicate and airy", m: { asc: 656, desc: 188, adv: 1250 }, lap: 0.38 },
  { id: "alex-brush", label: "Alex Brush", family: "Alex Brush", script: "latin",
    note: "Brush script, softer edges", m: { asc: 719, desc: 156, adv: 1297 }, lap: 0.42 },
  { id: "allura", label: "Allura", family: "Allura", script: "latin",
    note: "Flowing, wide swashes", m: { asc: 625, desc: 375, adv: 1188 }, lap: 0.44 },
  { id: "petit-formal-script", label: "Petit Formal Script", family: "Petit Formal Script",
    script: "latin", note: "Engraved formal script", m: { asc: 844, desc: 266, adv: 1156 }, lap: 0.34 },
  { id: "cormorant", label: "Cormorant Garamond", family: "Cormorant Garamond", script: "latin",
    note: "Serif italic — quiet and classical", italic: true,
    m: { asc: 641, desc: 203, adv: 844 }, lap: 0.16 },
  { id: "playfair", label: "Playfair Display", family: "Playfair Display", script: "latin",
    note: "High-contrast serif", m: { asc: 734, desc: 203, adv: 953 }, lap: 0.12 },
];

/** The Khmer faces: the ceremonial hands a Cambodian invitation is set in. */
const KHMER: MonogramFont[] = [
  { id: "moul", label: "មូល · Moul", family: "Moul", script: "khmer",
    note: "The ceremonial hand — what invitations are titled in",
    m: { asc: 734, desc: 328, adv: 1431 }, lap: 0.06 },
  { id: "moulpali", label: "មូលបាលី · Moulpali", family: "Moulpali", script: "khmer",
    note: "Moul's rounder cousin", m: { asc: 1422, desc: 469, adv: 1531 }, lap: 0.06 },
  { id: "koulen", label: "គូលេន · Koulen", family: "Koulen", script: "khmer",
    note: "Bold and upright", m: { asc: 781, desc: 297, adv: 1208 }, lap: 0.06 },
  { id: "bokor", label: "បូកគោ · Bokor", family: "Bokor", script: "khmer",
    note: "Angular and decorative", m: { asc: 938, desc: 328, adv: 1137 }, lap: 0.06 },
  { id: "taprom", label: "តាព្រហ្ម · Taprom", family: "Taprom", script: "khmer",
    note: "Inscriptional, carved", m: { asc: 906, desc: 344, adv: 1664 }, lap: 0.06 },
  { id: "fasthand", label: "ហ្វាស់ហែន · Fasthand", family: "Fasthand", script: "khmer",
    note: "Brushed, informal", m: { asc: 953, desc: 234, adv: 1474 }, lap: 0.06 },
  { id: "odor-mean-chey", label: "ឧត្តរមានជ័យ · Odor Mean Chey", family: "Odor Mean Chey",
    script: "khmer", note: "Rounded display", m: { asc: 891, desc: 328, adv: 1248 }, lap: 0.06 },
  { id: "preahvihear", label: "ព្រះវិហារ · Preahvihear", family: "Preahvihear", script: "khmer",
    note: "Slender and formal", m: { asc: 781, desc: 344, adv: 1104 }, lap: 0.06 },
  { id: "suwannaphum", label: "សុវណ្ណភូមិ · Suwannaphum", family: "Suwannaphum", script: "khmer",
    note: "Classic bookish serif", m: { asc: 734, desc: 250, adv: 1199 }, lap: 0.06 },
  { id: "hanuman", label: "ហនុមាន · Hanuman", family: "Hanuman", script: "khmer",
    note: "Clean and even", m: { asc: 766, desc: 250, adv: 1173 }, lap: 0.06 },
];

export const MONOGRAM_FONTS: MonogramFont[] = [...LATIN, ...KHMER];

export const DEFAULT_MONOGRAM_FONT = "great-vibes";

export function monogramFont(id: string | null | undefined): MonogramFont {
  return (
    MONOGRAM_FONTS.find((f) => f.id === id) ??
    MONOGRAM_FONTS.find((f) => f.id === DEFAULT_MONOGRAM_FONT)!
  );
}

/**
 * The stack a monogram is actually set in.
 *
 * The chosen face first, then a face for the *other* script, then a serif. The
 * fall-through is per **glyph**, not per string, so a couple with one Latin and
 * one Khmer initial gets each set in something sensible without this file
 * having to know which is which — and a Khmer face, which has no ampersand
 * worth the name, hands the `&` to Great Vibes rather than printing a box.
 */
export function monogramStack(font: MonogramFont): string {
  const other = font.script === "khmer" ? "'Great Vibes'" : "'Noto Serif Khmer'";
  return `'${font.family}', ${other}, 'Cormorant Garamond', Georgia, serif`;
}

/**
 * The ids, as a tuple, for the API's `z.enum`.
 *
 * Derived from the list rather than written out beside it, so adding a face is
 * one edit and cannot leave the validator behind — which would show the new
 * face in the dashboard and then quietly refuse to save it.
 */
export const MONOGRAM_FONT_IDS = MONOGRAM_FONTS.map((f) => f.id) as [string, ...string[]];
