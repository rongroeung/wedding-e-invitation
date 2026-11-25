"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  ADMIN_LANG_COOKIE,
  ADMIN_THEME_COOKIE,
  type AdminLang,
  type AdminTheme,
} from "@/lib/adminPrefs";
import { translator, type T } from "@/lib/i18n/admin";

type Prefs = {
  lang: AdminLang;
  theme: AdminTheme;
  t: T;
  setLang: (l: AdminLang) => void;
  setTheme: (t: AdminTheme) => void;
};

const Ctx = createContext<Prefs>({
  lang: "km",
  theme: "light",
  t: (s) => s,
  setLang: () => {},
  setTheme: () => {},
});

function remember(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * The admin's language and light/dark choice. The server reads the same
 * cookies, so the first paint is already right; switching rewrites the
 * cookie and refreshes the server-rendered parts in place.
 */
export function AdminPrefsProvider({
  lang: initialLang,
  theme: initialTheme,
  className = "",
  children,
}: {
  lang: AdminLang;
  theme: AdminTheme;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);
  const [theme, setThemeState] = useState(initialTheme);
  const setLang = useCallback(
    (l: AdminLang) => {
      remember(ADMIN_LANG_COOKIE, l);
      setLangState(l);
      router.refresh();
    },
    [router],
  );
  const setTheme = useCallback((t: AdminTheme) => {
    remember(ADMIN_THEME_COOKIE, t);
    setThemeState(t);
  }, []);
  const value = useMemo(() => ({ lang, theme, t: translator(lang), setLang, setTheme }), [lang, theme, setLang, setTheme]);

  return (
    <Ctx.Provider value={value}>
      <div className={`admin-root ${className}`} data-admin-theme={theme} lang={lang === "en" ? "en" : "km"}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export const useAdminPrefs = () => useContext(Ctx);
/** `const t = useT();` then `t("ខ្មែរ")` */
export const useT = () => useContext(Ctx).t;

/** The two switches: ខ្មែរ / EN and light / dark. */
export function AdminPrefsToggles({ className = "" }: { className?: string }) {
  const { lang, theme, setLang, setTheme, t } = useAdminPrefs();
  const btn =
    "inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-300" role="group" aria-label={t("ភាសា")}>
        {(["km", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`h-8 px-2.5 text-xs font-medium transition ${
              lang === l ? "bg-amber-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {l === "km" ? "ខ្មែរ" : "EN"}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={btn}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? t("ប្ដូរទៅពន្លឺ") : t("ប្ដូរទៅងងឹត")}
        title={theme === "dark" ? t("ប្ដូរទៅពន្លឺ") : t("ប្ដូរទៅងងឹត")}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </div>
  );
}
