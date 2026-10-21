/**
 * The sheet the invitation is printed on, in plates: tone and light, the
 * flowers' washes (leaf, petal, heart), the engraving, the foil accents, a
 * slow glint across the foil, a blind impression, and the cotton's own fibre.
 * Purely decorative and entirely styled by the paper theme on <html>: the
 * artwork comes from scripts/stationery-art.py and each paper places it
 * (lib/paperThemes, "the stationery suites"; base layers in globals.css).
 */
export function PaperSurface() {
  return (
    <div className="paper-surface" aria-hidden="true">
      <span className="ps-tone" />
      <span className="ps-leaf" />
      <span className="ps-petal" />
      <span className="ps-heart" />
      <span className="ps-foil" />
      <span className="ps-kline" />
      <span className="ps-line" />
      <span className="ps-sheen" />
      <span className="ps-relief" />
      <span className="ps-fibre" />
    </div>
  );
}
