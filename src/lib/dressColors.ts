import type { DressColor } from "./db/schema";

/** As many colours as fit in two neat rows on a phone. */
export const MAX_DRESS_COLORS = 8;

/** The colours to show: valid hex only, in the couple's order. */
export function dressPalette(list: unknown): DressColor[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c): c is DressColor => !!c && typeof c === "object" && /^#[0-9a-f]{6}$/i.test((c as DressColor).hex))
    .slice(0, MAX_DRESS_COLORS)
    .map((c) => ({ hex: c.hex.toLowerCase(), name: typeof c.name === "string" ? c.name : "" }));
}

/** Relative luminance (WCAG), 0 = black, 1 = white. */
export function luminance(hex: string) {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = ch.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
