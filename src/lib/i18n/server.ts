import { cookies } from "next/headers";
import { ADMIN_LANG_COOKIE, ADMIN_THEME_COOKIE, adminLangOf, adminThemeOf } from "../adminPrefs";
import { translator } from "./admin";

/** The admin's language and theme for this request (cookies). */
export async function adminPrefs() {
  const store = await cookies();
  return {
    lang: adminLangOf(store.get(ADMIN_LANG_COOKIE)?.value),
    theme: adminThemeOf(store.get(ADMIN_THEME_COOKIE)?.value),
  };
}

/** For server components: `const t = await getT();` */
export async function getT() {
  return translator((await adminPrefs()).lang);
}
