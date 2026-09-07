import type { Wedding } from "@/lib/db/schema";

/**
 * The sealed envelope a guest opens before the invitation itself.
 *
 * Styles are data, not components, so a new one is a row in this table rather
 * than another branch through the markup. Every style names the same four
 * surfaces — the paper, the shade its inside falls into, the ink, and the gold
 * — and the envelope draws itself from those alone.
 */
export type EnvelopeStyleKey =
  | "royal-khmer"
  | "burgundy-royal"
  | "white-gold"
  | "khmer-heritage"
  | "blush-rose";

export type EnvelopeStyle = {
  key: EnvelopeStyleKey;
  /** Khmer label for the admin picker. */
  label: string;
  note: string;
  /** The face of the paper. */
  paper: string;
  /** A shade deeper, for the flap and the inside of the pocket. */
  paperShade: string;
  /** Deeper still — the shadow the card sits in. */
  paperDeep: string;
  /** Text on the envelope. */
  ink: string;
  /** Foil: the mid tone the ornament is drawn in. */
  gold: string;
  /** Foil: the highlight the shimmer sweeps through. */
  goldLight: string;
  /** Foil: the shadow side of the emboss. */
  goldDeep: string;
  /** The wax seal. */
  seal: string;
  sealInk: string;
  /** How much ornament the style carries. */
  ornament: "corner" | "corner-rich";
};

export const ENVELOPE_STYLES: Record<EnvelopeStyleKey, EnvelopeStyle> = {
  /* STYLE 01 — ivory paper, antique gold. The default. */
  "royal-khmer": {
    key: "royal-khmer",
    label: "រាជវង្សខ្មែរ",
    note: "ក្រដាសពណ៌ភ្លឺទន់ ជាមួយមាសបុរាណ",
    paper: "#f4efe4",
    paperShade: "#ece4d4",
    paperDeep: "#ded2bd",
    ink: "#4a3527",
    gold: "#b18b4a",
    goldLight: "#e8cf9c",
    goldDeep: "#7c5f2c",
    seal: "#8c2f39",
    sealInk: "#f3dfae",
    ornament: "corner",
  },
  /* STYLE 02 — deep burgundy, champagne gold. */
  "burgundy-royal": {
    key: "burgundy-royal",
    label: "ទឹកក្រូចឆ្មារ",
    note: "ក្រដាសពណ៌ស្វាយចាស់ ជាមួយមាសសំប៉ាញ",
    paper: "#6d2732",
    paperShade: "#5c1f29",
    paperDeep: "#47161e",
    ink: "#f6e8d2",
    gold: "#dcc08a",
    goldLight: "#f7ebc9",
    goldDeep: "#a1854f",
    seal: "#e5cd97",
    sealInk: "#5c1f29",
    ornament: "corner",
  },
  /* STYLE 03 — pure ivory, the lightest touch of champagne. */
  "white-gold": {
    key: "white-gold",
    label: "សភ្លឺ និងមាស",
    note: "ក្រដាសពណ៌សភ្លឺ ជាមួយមាសស្រាល",
    paper: "#faf7f1",
    paperShade: "#f2ede3",
    paperDeep: "#e4dcce",
    ink: "#5a4636",
    gold: "#c3a367",
    goldLight: "#f0dfb6",
    goldDeep: "#93763f",
    seal: "#c3a367",
    sealInk: "#fdfaf3",
    ornament: "corner",
  },
  /* STYLE 04 — ivory and gold, carrying the fuller Khmer ornament. */
  "khmer-heritage": {
    key: "khmer-heritage",
    label: "បេតិកភណ្ឌខ្មែរ",
    note: "ក្រដាសពណ៌ភ្លឺ ជាមួយក្បាច់ខ្មែរពេញលេញ",
    paper: "#f2ebda",
    paperShade: "#e7dcc4",
    paperDeep: "#d6c8a9",
    ink: "#43301f",
    gold: "#a97f3c",
    goldLight: "#e6cb92",
    goldDeep: "#6d5023",
    seal: "#7d3a2a",
    sealInk: "#f0dcae",
    ornament: "corner-rich",
  },
  /*
   * STYLE 05 — blush paper, champagne gold. The light-pink set, and the one
   * the cinematic opening is built around.
   *
   * The paper runs light pink → blush → soft rose so the sheet has somewhere
   * to go as it turns in the light, and the gold is champagne rather than
   * yellow: on a pink ground a warm yellow gold goes orange, and champagne
   * stays gold.
   */
  "blush-rose": {
    key: "blush-rose",
    label: "ផ្កាឈូកស្រាល",
    note: "ក្រដាសពណ៌ផ្កាឈូកស្រាល ជាមួយមាសសំប៉ាញ",
    paper: "#fbe4e9",
    paperShade: "#f7d6de",
    paperDeep: "#efc1cc",
    ink: "#6b3a48",
    gold: "#c9a96e",
    goldLight: "#e8d2b0",
    goldDeep: "#94773f",
    seal: "#dfa8b6",
    sealInk: "#fff9f5",
    ornament: "corner-rich",
  },
};

export const ENVELOPE_STYLE_LIST = Object.values(ENVELOPE_STYLES);

/** Everything the opening experience needs, resolved once from the record. */
export type EnvelopeConfig = EnvelopeStyle & {
  enabled: boolean;
  animate: boolean;
  /** Milliseconds for the whole opening sequence. */
  duration: number;
  showSeal: boolean;
  sealText: string;
  music: boolean;
  skip: boolean;
  everyVisit: boolean;
};

/** A colour the admin typed, only if it is one we are willing to write to CSS. */
function safeColor(value: string): string {
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : "";
}

/**
 * Shifts a hex colour towards black or white.
 *
 * A custom paper or gold arrives as one colour, but the envelope needs a small
 * family — the flap sits a shade under the front, the emboss needs a highlight
 * and a shadow — so the rest are derived rather than asked for.
 */
export function shade(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value.split("").map((c) => c + c).join("")
      : value.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const mix = (channel: number) =>
    Math.round(amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount);
  const out = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** The couple's initials, for the seal. */
export function sealInitials(groom?: string, bride?: string): string {
  const first = (name?: string) => (name?.trim()?.[0] ?? "").toUpperCase();
  const g = first(groom);
  const b = first(bride);
  if (g && b) return `${g} & ${b}`;
  return g || b || "♡";
}

export function envelopeConfig(wedding: Wedding): EnvelopeConfig {
  const style =
    ENVELOPE_STYLES[wedding.envelopeStyle as EnvelopeStyleKey] ?? ENVELOPE_STYLES["royal-khmer"];

  const paper = safeColor(wedding.envelopePaper);
  const gold = safeColor(wedding.envelopeGold);

  return {
    ...style,
    ...(paper
      ? { paper, paperShade: shade(paper, -0.11), paperDeep: shade(paper, -0.24) }
      : {}),
    ...(gold
      ? { gold, goldLight: shade(gold, 0.42), goldDeep: shade(gold, -0.34) }
      : {}),
    enabled: wedding.envelopeEnabled,
    animate: wedding.envelopeAnimate,
    duration: Math.min(14000, Math.max(1600, wedding.envelopeDuration)),
    showSeal: wedding.envelopeSeal,
    sealText:
      wedding.envelopeSealText.trim() ||
      sealInitials(wedding.groomName, wedding.brideName),
    music: wedding.envelopeMusic,
    skip: wedding.envelopeSkip,
    everyVisit: wedding.envelopeEveryVisit,
  };
}
