import type { AdminLang } from "../adminPrefs";
import { ADMIN_EN } from "./admin-en";

/** JSX collapses runs of whitespace; the dictionary is keyed the same way. */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * The admin's words in the chosen language. The Khmer text is the key, so
 * the code still reads in Khmer, and anything not in the dictionary is shown
 * as written rather than going missing. Leading and trailing spaces are kept
 * (they separate the text from what sits beside it).
 */
export function translate(lang: AdminLang, text: string): string {
  if (lang === "km" || !text) return text;
  const en = ADMIN_EN[norm(text)];
  if (en === undefined) return text;
  const lead = /^\s/.test(text) ? " " : "";
  const trail = /\s$/.test(text) ? " " : "";
  return lead + en + trail;
}

export type T = (text: string) => string;
export const translator = (lang: AdminLang): T => (text) => translate(lang, text);
