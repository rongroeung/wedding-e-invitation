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
  palace: { km: "ស្បែកទី ៤ · វិមានសួនច្បារ", hint: "ទ្វារវិមាន និងសួនច្បារពណ៌ខៀវស្រាល · ពណ៌ខៀវ និងស្វាយ" },
  golden: { km: "ស្បែកទី ៥ · វិមានមាស", hint: "ប្រាសាទមាស និងជណ្ដើរផ្កា · ពណ៌ក្រែម និងមាស" },
  velvet: { km: "ស្បែកទី ៦ · វាំងននក្រហម", hint: "វាំងននវល្លិ៍ក្រហមបើក ចង្កៀងគ្រីស្តាល់ · ពណ៌ក្រហមចាស់ និងមាស" },
  royal: { km: "ស្បែកទី ៧ · ទ្វារក្លោងមាស", hint: "ស្រោមសំបុត្រមាស ត្រាភ្លឺ រួចទ្វារក្លោងមាស · ពណ៌ក្រែម មាស និងក្រហមចាស់" },
} as const;

export type InvitationThemeKey = keyof typeof INVITATION_THEMES;
export const INVITATION_THEME_KEYS = Object.keys(INVITATION_THEMES) as [InvitationThemeKey, ...InvitationThemeKey[]];

export function themeKeyOf(value: string | null | undefined): InvitationThemeKey {
  return value && value in INVITATION_THEMES ? (value as InvitationThemeKey) : "khmer";
}

/**
 * The film themes (3–6): each opens on a short film of the couple's own
 * footage, cut just before its baked-in lettering, holding on its last frame,
 * and prints the cover and the letter on that frame.
 */
export type SceneSpec = {
  intro: string;
  still: string;
  stillTiny: string;
  thumb: string;
  /** Printed light on a dark picture. */
  dark: boolean;
  /** How much of the paper's colour (or, when dark, the shade) is laid over the picture. */
  wash: number;
  /** A dark theme's shade, `r g b`. */
  shade?: string;
  /** The deep ink the writing is set in on a light picture. */
  ink: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  pattern: string;
  /** What stands behind the card on a wide screen (a backdrop preset or `src:` picture). */
  pageBg: string;
};

const scene = (key: string, rest: Omit<SceneSpec, "intro" | "still" | "stillTiny" | "thumb">): SceneSpec => ({
  intro: `/themes/${key}/${key}-intro.mp4`,
  still: `/themes/${key}/${key}-still.webp`,
  stillTiny: `/themes/${key}/${key}-still-tiny.webp`,
  thumb: `/themes/${key}/${key}-thumb.webp`,
  ...rest,
});

export const SCENES: Partial<Record<InvitationThemeKey, SceneSpec>> = {
  // sage, antique gold, blush and a warm white sheet
  garden: scene("garden", {
    dark: false,
    wash: 42,
    ink: "#3d4a2c",
    colors: { primary: "#55623F", secondary: "#B8975C", accent: "#EADFD3", background: "#FBF8F1", text: "#4A4A3A" },
    pattern: "floral",
    pageBg: "garden-arch",
  }),
  // wedgwood blue and lavender over pale stone
  palace: scene("palace", {
    dark: false,
    wash: 46,
    ink: "#2e3b63",
    colors: { primary: "#34436E", secondary: "#9C86B8", accent: "#DCE4F2", background: "#F6F7FB", text: "#3A4258" },
    pattern: "floral",
    pageBg: "src:/themes/palace/palace-still.webp",
  }),
  // champagne, ivory and warm gold
  golden: scene("golden", {
    dark: false,
    wash: 40,
    ink: "#6a4a1c",
    colors: { primary: "#7A5A2B", secondary: "#C9A55C", accent: "#F3E7CF", background: "#FCF8EF", text: "#5A4426" },
    pattern: "floral",
    pageBg: "src:/themes/golden/golden-still.webp",
  }),
  // the gilded envelope and the golden arch: cream, gold and a deep wine ink
  royal: scene("royal", {
    dark: false,
    wash: 38,
    ink: "#6e1f2b",
    colors: { primary: "#7A2330", secondary: "#C29A4E", accent: "#F1E4CC", background: "#FBF5EA", text: "#5A3A2A" },
    pattern: "floral",
    pageBg: "src:/themes/royal/royal-still.webp",
  }),
  // garnet velvet, candle gold
  velvet: scene("velvet", {
    dark: true,
    wash: 52,
    shade: "34 6 12",
    ink: "#f2deb0",
    colors: { primary: "#F2DEB0", secondary: "#D6B678", accent: "#5C1622", background: "#2A0A10", text: "#F1E2D3" },
    pattern: "floral",
    pageBg: "src:/themes/velvet/velvet-still.webp",
  }),
};

export function sceneOf(theme: InvitationThemeKey): SceneSpec | undefined {
  return SCENES[theme];
}

/** The garden opening's own footage and stills (public/themes/garden). */
export const GARDEN_MEDIA = {
  intro: SCENES.garden!.intro,
  still: SCENES.garden!.still,
  stillTiny: SCENES.garden!.stillTiny,
  arch: "/themes/garden/garden-arch.webp",
};

/** Themes whose card is printed light on a dark picture. */
export function themeIsDark(theme: InvitationThemeKey): boolean {
  return theme === "photo" || Boolean(SCENES[theme]?.dark);
}


/* How much of the paper's colour is washed over the picture under the writing. */
const PHOTO_WASH = 58;

/**
 * The wedding as the guest's invitation renders it under its theme.
 *
 * In Themes 2–6 the cover and the letter are printed on the same picture as
 * the opening page (the couple's photograph, or the film's last frame), under
 * a wash so the writing on them stays readable.
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
  const spec = SCENES[theme];
  if (!spec) return w;
  return {
    ...w,
    // the opening's last frame, on the cover and the letter
    cardBgMediaId: null,
    cardBgPreset: `src:${spec.still}`,
    cardBgFit: "cover",
    cardBgScrim: spec.wash,
    // the paper is the picture itself (the "couple" paper), not a printed design
    appearancePaper: "couple",
    appearanceTone: "design",
    colorPrimary: spec.colors.primary,
    colorSecondary: spec.colors.secondary,
    colorAccent: spec.colors.accent,
    colorBackground: spec.colors.background,
    colorText: spec.colors.text,
    pattern: spec.pattern,
    // the card's corner art takes the colour of the lettering
    frameTint: true,
    // the film has already raised its own curtain
    curtainEnabled: false,
    pageBgMediaId: null,
    pageBgPreset: spec.pageBg,
    pageBgFit: "cover",
    pageBgScrim: spec.dark ? 0 : 0,
  };
}
