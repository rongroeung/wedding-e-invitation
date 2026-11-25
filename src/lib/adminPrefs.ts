/**
 * The admin's own display preferences — language (Khmer / English) and light
 * or dark — kept in cookies so the server renders the right one from the
 * first byte (no flash), and remembered per browser.
 */
export type AdminLang = "km" | "en";
export type AdminTheme = "light" | "dark";
export const ADMIN_LANG_COOKIE = "admin_lang";
export const ADMIN_THEME_COOKIE = "admin_theme";

export function adminLangOf(v: string | undefined | null): AdminLang {
  return v === "en" ? "en" : "km";
}
export function adminThemeOf(v: string | undefined | null): AdminTheme {
  return v === "dark" ? "dark" : "light";
}
