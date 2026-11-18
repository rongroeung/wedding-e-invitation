import type { Wedding } from "@/lib/db/schema";

/**
 * The invitation's theme, chosen once in admin (រូបរាង → ស្បែកសំបុត្រ).
 *
 * - **khmer** (Theme 1): the invitation as it has always been — the Khmer
 *   envelope, the velvet, the couple's own paper and colours.
 * - **photo** (Theme 2): the same invitation, but its opening page is the
 *   couple's photograph instead of the envelope.
 * - **garden** (Theme 3): a garden look throughout. The opening is a short
 *   film into a flower-hung conservatory (the couple's own footage, cut before
 *   its baked-in lettering), and the cover and letter are printed on its last frame,
 *   sage-and-gold colours, a floral pattern and the couple's flower-arch
 *   picture behind it. No velvet: a garden has no theatre curtain.
 *
 * The garden's choices are applied when the invitation is rendered
 * (`applyInvitationTheme`), on top of the couple's saved settings, which are
 * left untouched — switching back to Theme 1 or 2 restores everything.
 */
export const INVITATION_THEMES = {
  khmer: { km: "ស្បែកទី ១ · ក្បាច់ខ្មែរ", hint: "ស្រោមសំបុត្រខ្មែរ និងវាំងននវល្លិ៍" },
  photo: { km: "ស្បែកទី ២ · រូបថតរបស់អ្នក", hint: "ដូចស្បែកទី ១ ប៉ុន្តែទំព័រដំបូងជារូបថតរបស់អ្នក ជំនួសស្រោមសំបុត្រ" },
  garden: { km: "ស្បែកទី ៣ · សួនផ្កា", hint: "ទំព័រដំបូងជាវីដេអូសួនផ្កា និងរូបរាងសួនផ្កាគ្រប់ផ្នែក" },
} as const;

export type InvitationThemeKey = keyof typeof INVITATION_THEMES;
export const INVITATION_THEME_KEYS = Object.keys(INVITATION_THEMES) as [InvitationThemeKey, ...InvitationThemeKey[]];

export function themeKeyOf(value: string | null | undefined): InvitationThemeKey {
  return value && value in INVITATION_THEMES ? (value as InvitationThemeKey) : "khmer";
}

/** The garden opening's own footage and stills (public/themes/garden). */
export const GARDEN_MEDIA = {
  intro: "/themes/garden/garden-intro.mp4",
  still: "/themes/garden/garden-still.webp",
  stillTiny: "/themes/garden/garden-still-tiny.webp",
  arch: "/themes/garden/garden-arch.webp",
};

/* How much of the paper's colour is washed over the picture under the writing. */
const PHOTO_WASH = 58;
const GARDEN_WASH = 42;

/**
 * The wedding as the guest's invitation renders it under its theme.
 *
 * In Themes 2 and 3 the cover and the letter are printed on the same picture
 * as the opening page (the couple's photograph, or the garden), under a wash of
 * the paper's own colour so the writing on them stays readable.
 */
export function applyInvitationTheme(w: Wedding): Wedding {
  const theme = themeKeyOf(w.invitationTheme);
  if (theme === "photo") {
    // "couple" is the paper made of the couple's own picture (lib/appearance)
    const paper = { appearancePaper: "couple", appearanceTone: "design", cardBgFit: "cover", cardBgScrim: PHOTO_WASH };
    if (w.openingPhotoId) return { ...w, ...paper, cardBgMediaId: w.openingPhotoId };
    if (w.openingPhotoUrl) return { ...w, ...paper, cardBgMediaId: null, cardBgPreset: `src:${w.openingPhotoUrl}` };
    return w;
  }
  if (theme !== "garden") return w;
  return {
    ...w,
    // the opening's own conservatory, on the cover and the letter
    cardBgMediaId: null,
    cardBgPreset: `src:${GARDEN_MEDIA.still}`,
    cardBgFit: "cover",
    cardBgScrim: GARDEN_WASH,
    // the paper is the picture itself (the "couple" paper), not a printed design
    appearancePaper: "couple",
    appearanceTone: "design",
    // sage, antique gold, blush and a warm white sheet
    colorPrimary: "#55623F",
    colorSecondary: "#B8975C",
    colorAccent: "#EADFD3",
    colorBackground: "#FBF8F1",
    colorText: "#4A4A3A",
    pattern: "floral",
    // the card's gold corner art takes the sage of the lettering
    frameTint: true,
    // no theatre curtain in a garden
    curtainEnabled: false,
    // the couple's flower arch behind the invitation
    pageBgMediaId: null,
    pageBgPreset: "garden-arch",
    pageBgFit: "cover",
    pageBgScrim: 0,
  };
}
