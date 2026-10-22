/**
 * Paper colours: the stock a design is printed on.
 *
 * The thirty designs each have their own paper, and that stays the default
 * ("design"). A colour chosen here replaces only the paper — its tone, its
 * shading, the envelope matched to it and the room behind it — and leaves
 * the design's artwork, frame and finishes as they are. On a dark paper the
 * writing turns light, the engraving prints in light gold, and carved relief
 * is lit for a dark surface (`data-paper-dark`, paperThemes.ts).
 */
export type PaperTone = {
  key: string;
  km: string;
  en: string;
  base: string;
  dark: boolean;
};

export const PAPER_TONES: PaperTone[] = [
  { key: "ivory", km: "ភ្លុក", en: "Ivory", base: "#f8f2e7", dark: false },
  { key: "cream", km: "ក្រែម", en: "Cream", base: "#f4ead8", dark: false },
  { key: "champagne", km: "សំប៉ាញ", en: "Champagne", base: "#efe2c9", dark: false },
  { key: "sand", km: "ខ្សាច់", en: "Sandstone", base: "#ece0cb", dark: false },
  { key: "blush", km: "ស៊ីជម្ពូស្រាល", en: "Blush", base: "#f7e9e4", dark: false },
  { key: "rose", km: "ផ្កាកុលាបស្រអាប់", en: "Dusty Rose", base: "#efd9d6", dark: false },
  { key: "sage", km: "បៃតងស្លឹកគ្រៃ", en: "Sage", base: "#e7ebdd", dark: false },
  { key: "mint", km: "បៃតងស្រាល", en: "Mint", base: "#e2ede6", dark: false },
  { key: "blue", km: "ខៀវស្រអាប់", en: "Dusty Blue", base: "#e1e7ee", dark: false },
  { key: "lavender", km: "ស្វាយស្រាល", en: "Lavender", base: "#eae4ef", dark: false },
  { key: "burgundy", km: "ក្រហមទំពាំងបាយជូរ", en: "Burgundy", base: "#5a1f2b", dark: true },
  { key: "navy", km: "ខៀវរាត្រី", en: "Midnight Navy", base: "#1e2a3f", dark: true },
  { key: "emerald", km: "បៃតងត្បូងមរកត", en: "Emerald", base: "#1d3b32", dark: true },
  { key: "charcoal", km: "ប្រផេះធ្យូង", en: "Charcoal", base: "#2b2927", dark: true },
];

/** "design" keeps each design's own paper. */
export const TONE_KEYS = ["design", ...PAPER_TONES.map((t) => t.key)] as [string, ...string[]];
export const DARK_TONES = PAPER_TONES.filter((t) => t.dark).map((t) => t.key);
export function isTone(v: unknown): v is string {
  return typeof v === "string" && TONE_KEYS.includes(v);
}

/** The light ink and brighter gold a dark paper is printed with. */
export const DARK_INK = "#f3e4cc";
export const DARK_METAL = ["#a07a42", "#d2ae6a", "#efdba4", "#b48d4e"];
