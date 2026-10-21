import { PAPERS, type PaperGroup } from "./paperThemes";

/**
 * Appearance: the paper the invitation is printed on, and the live layer of
 * motion above it.
 *
 * The couple choose the defaults in the dashboard. A guest may change them for
 * themselves from the small settings button on the invitation; that choice is
 * kept in this browser only (`localStorage`) and contains nothing but these
 * three appearance values.
 *
 * How it reaches the page: the choice is written as three attributes on
 * `<html>` (`data-paper-theme`, `data-fx`, `data-fx-level`). Every rule that
 * draws the paper or the motion keys off those attributes, so switching is a
 * restyle — nothing reloads, nothing re-mounts, the music and the envelope are
 * untouched. An inline script (`appearanceBootScript`) applies the saved
 * choice before the first paint, so a returning guest never sees the default
 * flash first.
 */

export const PAPER_THEMES = {
  ...Object.fromEntries(PAPERS.map((p) => [p.key, { km: p.km, en: p.en, group: p.group }])),
  /** The couple's own card picture or chosen design (in the same settings card). */
  couple: { km: "ក្រដាសរបស់គូស្វាមីភរិយា", en: "The couple's paper", group: "own" },
} as Record<string, { km: string; en: string; group: PaperGroup | "own" }>;
export type PaperTheme = string;
export const PAPER_THEME_KEYS = Object.keys(PAPER_THEMES) as [PaperTheme, ...PaperTheme[]];
/** Papers printed light on dark (the card's writing turns light on them). */
export const DARK_PAPERS: readonly PaperTheme[] = PAPERS.filter((p) => p.dark).map((p) => p.key);

export const FX_MODES = {
  none: { km: "គ្មាន", en: "None" },
  dust: { km: "ធូលីមាស", en: "Elegant Gold Dust" },
  petals: { km: "ផ្កាអណ្ដែត", en: "Floating Petals" },
  glow: { km: "ពន្លឺស្និទ្ធស្នាល", en: "Romantic Glow" },
  full: { km: "ពេញលេញ", en: "Full Experience" },
  butterflies: { km: "មេអំបៅហើរ", en: "Butterflies" },
  fireflies: { km: "អំពិលអំពែក", en: "Fireflies" },
  blossoms: { km: "ផ្កាម្លិះ និងចំប៉ាជ្រុះ", en: "Falling Blossoms" },
  goldleaf: { km: "ស្លឹកមាស", en: "Gold Leaf" },
  starlight: { km: "ផ្កាយភ្លឺ", en: "Starlight" },
  sunbeams: { km: "ពន្លឺព្រះអាទិត្យ", en: "Sunbeams" },
} as const;
export type FxMode = keyof typeof FX_MODES;
export const FX_MODE_KEYS = Object.keys(FX_MODES) as [FxMode, ...FxMode[]];

export const FX_LEVELS = {
  low: { km: "តិច", en: "Low" },
  medium: { km: "មធ្យម", en: "Medium" },
  high: { km: "ច្រើន", en: "High" },
} as const;
export type FxLevel = keyof typeof FX_LEVELS;
export const FX_LEVEL_KEYS = Object.keys(FX_LEVELS) as [FxLevel, ...FxLevel[]];

export type Appearance = { paper: PaperTheme; fx: FxMode; level: FxLevel };

export const STORAGE_KEY = "wedding-appearance-v1";

/**
 * The script that runs before the invitation paints. Inlined by `ThemeStyle`,
 * so it carries the couple's defaults in it. Wrapped in try/catch throughout:
 * storage can be missing or throw (private windows, blocked cookies), and the
 * defaults must still be applied.
 *
 * Reduced motion: if the device asks for it and the guest has not explicitly
 * chosen an animation here, motion starts off. An explicit choice in the
 * settings panel is the guest's own decision and is honoured.
 */
export function appearanceBootScript(defaults: Appearance): string {
  const d = JSON.stringify(defaults);
  const keys = JSON.stringify(PAPER_THEME_KEYS);
  const dark = JSON.stringify(DARK_PAPERS);
  // a saved paper that no longer exists (one that was retired) falls back to
  // the couple's default rather than leaving the sheet without colours
  return `(function(){try{var d=${d},K=${keys},D=${dark},a=d,s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(
    STORAGE_KEY,
  )})||"null")}catch(e){}if(s&&typeof s==="object"){a={paper:K.indexOf(s.paper)>=0?s.paper:d.paper,fx:s.fx||d.fx,level:s.level||d.level}}var fx=a.fx;try{if((!s||!s.explicit)&&matchMedia("(prefers-reduced-motion: reduce)").matches)fx="none"}catch(e){}var h=document.documentElement;h.setAttribute("data-paper-theme",a.paper);if(D.indexOf(a.paper)>=0)h.setAttribute("data-paper-dark","");else h.removeAttribute("data-paper-dark");h.setAttribute("data-fx",fx);h.setAttribute("data-fx-level",a.level)}catch(e){}})();`;
}

export function isPaper(v: unknown): v is PaperTheme {
  return typeof v === "string" && (PAPER_THEME_KEYS as string[]).includes(v);
}
export function isFx(v: unknown): v is FxMode {
  return typeof v === "string" && (FX_MODE_KEYS as string[]).includes(v);
}
export function isLevel(v: unknown): v is FxLevel {
  return typeof v === "string" && (FX_LEVEL_KEYS as string[]).includes(v);
}

/** The couple's defaults, from the wedding record, checked. */
export function appearanceDefaults(w: {
  appearancePaper: string;
  appearanceFx: string;
  appearanceLevel: string;
}): Appearance {
  return {
    paper: isPaper(w.appearancePaper) ? w.appearancePaper : "classic-ivory",
    fx: isFx(w.appearanceFx) ? w.appearanceFx : "dust",
    level: isLevel(w.appearanceLevel) ? w.appearanceLevel : "medium",
  };
}
