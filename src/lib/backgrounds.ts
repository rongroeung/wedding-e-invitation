/**
 * The built-in background designs offered under រូបភាពផ្ទៃខាងក្រោយ.
 *
 * Three designs the couple supplied (originals in `design/backgrounds/`),
 * prepared for the web: the floral and the dusk pictures resized to fit a
 * large screen, and the damask cut down to exactly one repeat of its pattern
 * (1360 px at source, measured by autocorrelation) so it tiles with no seam.
 *
 * Either surface — the page behind everything, or the card's own paper — can
 * use any of them. An uploaded picture always wins over a preset.
 */
export type BackdropPreset = {
  label: string;
  src: string;
  thumb: string;
  /** How the design is laid: one picture across the surface, or a repeat. */
  fit: "cover" | "tile";
  /** For a repeat: the size of one tile on screen. */
  tile?: string;
  /**
   * The paper-colour wash the dashboard sets when the design is picked for
   * the card, so the writing on it reads at once. Tuned by eye on the real
   * card: the floral is pale already, the damask and the dusk need more.
   */
  cardStrength: number;
};

export const BACKDROP_PRESETS = {
  "vintage-floral": {
    label: "ក្បាច់ផ្កាបុរាណ",
    src: "/backgrounds/vintage-floral.webp",
    thumb: "/backgrounds/vintage-floral-thumb.webp",
    fit: "cover",
    cardStrength: 10,
  },
  damask: {
    label: "ក្បាច់ដាម៉ាស",
    src: "/backgrounds/damask-tile.webp",
    thumb: "/backgrounds/damask-thumb.webp",
    fit: "tile",
    tile: "320px",
    cardStrength: 55,
  },
  "decorative-dusk": {
    label: "ក្បាច់លើពណ៌ព្រលប់",
    src: "/backgrounds/decorative-dusk.webp",
    thumb: "/backgrounds/decorative-dusk-thumb.webp",
    fit: "cover",
    cardStrength: 40,
  },
} satisfies Record<string, BackdropPreset>;

export type BackdropPresetKey = keyof typeof BACKDROP_PRESETS;
export const BACKDROP_PRESET_KEYS = Object.keys(BACKDROP_PRESETS) as [BackdropPresetKey, ...BackdropPresetKey[]];

export function backdropPreset(key: string | null | undefined): BackdropPreset | null {
  return (BACKDROP_PRESETS as Record<string, BackdropPreset>)[key ?? ""] ?? null;
}
