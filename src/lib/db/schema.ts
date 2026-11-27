/**
 * Database schema — PostgreSQL (Drizzle ORM).
 *
 * The same schema runs against a hosted Postgres in production and against the
 * embedded PGlite instance used for local development, so there is exactly one
 * source of truth.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * The wedding (workspace) a row belongs to. No default here, so every insert
 * has to name its wedding; the database keeps 'main' as a default only for
 * rows written by the previous version during a rollout (drizzle/0033).
 */
const weddingId = () => text("wedding_id").notNull();

/**
 * One colour of the wedding palette: its colour and name, optionally a photo
 * of the fabric (an upload, `mediaId`, or one of the swatches shipped in
 * public/dress, `image`), and the group it belongs to (an index into
 * `dressGroups`).
 */
export type DressColor = { hex: string; name: string; group?: number; mediaId?: string; image?: string };
/** A group of colours with its own heading, e.g. "Evening Attire" / "December-19, 2026". */
export type DressGroup = { title: string; note: string };

/** Raw binary column used for uploaded photos / audio / QR images. */
export const bytea = customType<{ data: Buffer; default: false }>({
  dataType: () => "bytea",
});

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/* ── Admin users ───────────────────────────────────────────────────────── */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Admin"),
  /** The platform owner: sees every workspace, creates them, assigns their admins. */
  isOwner: boolean("is_owner").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Binary assets (kept in the DB so serverless hosts work out of the box) ─ */
export const media = pgTable("media", {
  id: id(),
  weddingId: weddingId(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull().default(0),
  kind: text("kind").notNull().default("image"), // image | audio
  data: bytea("data").notNull(),
  /*
   * Whether every part of this file has arrived.
   *
   * A wedding film is far larger than the request a serverless host will pass
   * to a function — Vercel stops at 4.5 MB — so a large upload is cut into
   * pieces by the browser and appended here one at a time. Between the first
   * piece and the last, the row exists and is *not* the file: served then, it
   * would be a video that plays for two seconds and stops. Defaults to true so
   * every row written before this column existed stays exactly as valid as it
   * was.
   */
  complete: boolean("complete").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Wedding information: one row per workspace ("main" is the first, at /) ─ */
export const wedding = pgTable("wedding", {
  id: text("id").primaryKey().default("main"),
  /** Its public address, /w/<slug> ("main" is also served at /). */
  slug: text("slug").notNull().unique(),
  /** What the workspace is called in the dashboard (the couple's names, say). */
  workspaceName: text("workspace_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // Cover
  title: text("title").notNull().default("សិរីមង្គលអាពាហ៍ពិពាហ៍"),
  subtitle: text("subtitle").notNull().default("សូមគោរពអញ្ជើញ"),
  openButton: text("open_button").notNull().default("បើកលិខិត"),
  /** Decorative monogram on the cover, e.g. "S&K" or "ស ក". */
  monogram: text("monogram").notNull().default(""),
  /** Show the name logo (image or drawn crest) between the groom's and bride's names. */
  nameLogoEnabled: boolean("name_logo_enabled").notNull().default(true),
  /** The couple's own name-logo image (an upload); replaces the drawn crest when set. */
  nameLogoMediaId: text("name_logo_media_id"),
  /** "foil": the image's light parts printed in gold; "original": the image as uploaded. */
  nameLogoMode: text("name_logo_mode").notNull().default("foil"),
  /**
   * The face it is set in — a catalogue id, not a CSS family name.
   *
   * See `src/lib/monogram-fonts.ts`. Storing the id means a face can be
   * renamed or re-filed without rewriting rows, and an id that is no longer
   * offered resolves to the default rather than asking a guest's browser for a
   * font that no longer exists.
   */
  monogramFont: text("monogram_font").notNull().default("great-vibes"),
  /** What is foil-stamped on the envelope flap: "namelogo" or "monogram". */
  envelopeFlapMark: text("envelope_flap_mark").notNull().default("namelogo"),
  coverPhotoId: text("cover_photo_id"),
  coverPhotoUrl: text("cover_photo_url").notNull().default(""),
  /** khmer | photo | garden (lib/invitationTheme). */
  invitationTheme: text("invitation_theme").notNull().default("khmer"),
  /** Theme 2's opening page: the couple's photograph, shown instead of the envelope. */
  openingPhotoId: text("opening_photo_id"),
  openingPhotoUrl: text("opening_photo_url").notNull().default(""),

  // Groom
  groomTitle: text("groom_title").notNull().default("លោក"),
  groomName: text("groom_name").notNull().default("សុខ វិសាល"),
  groomFullName: text("groom_full_name").notNull().default("សុខ វិសាល"),
  groomFatherName: text("groom_father_name").notNull().default("លោក សុខ សុវណ្ណ"),
  groomMotherName: text("groom_mother_name").notNull().default("អ្នកស្រី ចាន់ សុភា"),
  groomPhone: text("groom_phone").notNull().default(""),
  groomPhotoId: text("groom_photo_id"),
  groomPhotoUrl: text("groom_photo_url").notNull().default(""),

  // Bride
  brideTitle: text("bride_title").notNull().default("កញ្ញា"),
  brideName: text("bride_name").notNull().default("លីន ស្រីពៅ"),
  brideFullName: text("bride_full_name").notNull().default("លីន ស្រីពៅ"),
  brideFatherName: text("bride_father_name").notNull().default("លោក លីន វណ្ណៈ"),
  brideMotherName: text("bride_mother_name").notNull().default("អ្នកស្រី សុខ សុជាតា"),
  bridePhone: text("bride_phone").notNull().default(""),
  bridePhotoId: text("bride_photo_id"),
  bridePhotoUrl: text("bride_photo_url").notNull().default(""),

  // Formal invitation wording
  /** The letter's opening line, above the honorifics (the cover and envelope use `subtitle`). */
  invitationLead: text("invitation_lead").notNull().default("យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ"),
  /** Between the two names on the letter: ជាគូនឹង (true) or the couple's monogram (false). */
  letterJoinText: boolean("letter_join_text").notNull().default(false),
  /*
   * The letter's "when and where", as the couple word it (each one optional:
   * an empty line falls back to the one built from the date, time and venue
   * fields). Opening line, the lunar date, the emphasised solar date and
   * time, and the place.
   */
  invitationWhenIntro: text("invitation_when_intro").notNull().default(""),
  invitationLunarDate: text("invitation_lunar_date").notNull().default(""),
  invitationDateLine: text("invitation_date_line").notNull().default(""),
  invitationPlace: text("invitation_place").notNull().default(""),
  invitationHonorific: text("invitation_honorific")
    .notNull()
    .default("ឯកឧត្តម លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា"),
  /** On the opening page and the cover when the link names no guest. */
  defaultGuestName: text("default_guest_name").notNull().default("ភ្ញៀវកិត្តិយស"),
  invitationBody: text("invitation_body").notNull().default("អញ្ជើញចូលរួម ជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីមង្គលអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ"),

  // Date & venue
  weddingDate: timestamp("wedding_date", { withTimezone: true }).notNull().defaultNow(),
  weddingDateKhmer: text("wedding_date_khmer").notNull().default(""),
  weddingTimeKhmer: text("wedding_time_khmer").notNull().default(""),
  buddhistYear: text("buddhist_year").notNull().default(""),
  venueName: text("venue_name").notNull().default(""),
  venueAddress: text("venue_address").notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  mapEmbedUrl: text("map_embed_url").notNull().default(""),
  /** The couple's own picture of the map (an upload); shown in the venue section. */
  venueMapMediaId: text("venue_map_media_id"),

  // Closing blessing
  blessingThanks: text("blessing_thanks").notNull().default(""),
  blessingWish: text("blessing_wish").notNull().default(""),
  /** The closing letters: សេចក្ដីថ្លែងអំណរគុណ and លិខិតសូមអភ័យទោស (empty hides one). */
  thanksLetter: text("thanks_letter").notNull().default("យើងខ្ញុំជា មាតាបិតា កូនប្រុស កូនស្រី សូមថ្លែងអំណរគុណ យ៉ាងជ្រាលជ្រៅចំពោះការចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ក្នុងពិធីសិរីមង្គលអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ។ យើងខ្ញុំ សូមគោរពជូនពរដល់ ឯកឧត្ដម លោកឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា និងភ្ញៀវកិត្តិយសទាំងអស់ សូមប្រកបតែភាពសុខដុម ចម្រុងចម្រើន និងសុភមង្គល ក្នុងក្រុមគ្រួសារជានិច្ចនិរន្តរ៍។"),
  apologyLetter: text("apology_letter").notNull().default("យើងខ្ញុំជា មាតាបិតា កូនប្រុស កូនស្រី សូមអភ័យទោស ក្នុងករណីពុំបានជូនសំបុត្រអញ្ជើញដោយផ្ទាល់ និងការសរសេរឈ្មោះរបស់ភ្ញៀវកិត្តិយសមិនបានត្រឹមត្រូវ ឬពុំបានសរសេរឈ្មោះ។ វត្តមានរបស់ ឯកឧត្ដម លោកឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា គឺជាកិត្តិយសដ៏ឧត្ដុង្គឧត្ដមសម្រាប់គ្រួសារយើងខ្ញុំ។ សូមអរគុណ!"),

  // Digital gift
  giftEnabled: boolean("gift_enabled").notNull().default(true),
  giftIntro: text("gift_intro").notNull().default(""),
  giftNote: text("gift_note").notNull().default(""),
  /** A single KHQR — Cambodia's unified QR, scannable from every bank app. */
  giftQrMediaId: text("gift_qr_media_id"),
  giftQrUrl: text("gift_qr_url").notNull().default(""),
  giftAccountName: text("gift_account_name").notNull().default(""),

  /* ── Wedding colours: what guests are asked to wear ──────────────────
     Empty until the couple adds a colour; the section is hidden until then. */
  dressCodeEnabled: boolean("dress_code_enabled").notNull().default(true),
  dressCodeTitle: text("dress_code_title").notNull().default("ពណ៌សម្លៀកបំពាក់"),
  /** A line to guests, e.g. which colours to wear or to leave to the bride. */
  dressCodeNote: text("dress_code_note").notNull().default(""),
  /** In order: [{ hex: "#a4b8c4", name: "ខៀវស្រាល" }, …] (lib/dressColors). */
  dressColors: jsonb("dress_colors").$type<DressColor[]>().notNull().default([]),
  /** A film theme's background moves (live loop or breathing picture) — LivePaper, SceneOpening. */
  livePaperEnabled: boolean("live_paper_enabled").notNull().default(true),
  /** The couple's own honorifics for guests, after the built-in ones (lib/guestTitles). */
  guestTitles: jsonb("guest_titles").$type<string[]>().notNull().default([]),
  /** Optional headings that split the colours, e.g. by day (lib/dressColors). */
  dressGroups: jsonb("dress_groups").$type<DressGroup[]>().notNull().default([]),

  // Music
  musicEnabled: boolean("music_enabled").notNull().default(false),
  musicTitle: text("music_title").notNull().default(""),
  musicUrl: text("music_url").notNull().default(""),
  musicMediaId: text("music_media_id"),
  /** The opening sound: plays on the first page until the guest opens the invitation. */
  preMusicEnabled: boolean("pre_music_enabled").notNull().default(false),
  preMusicUrl: text("pre_music_url").notNull().default(""),
  preMusicMediaId: text("pre_music_media_id"),
  preMusicLoop: boolean("pre_music_loop").notNull().default(true),

  // Section toggles
  showCountdown: boolean("show_countdown").notNull().default(true),
  showProgram: boolean("show_program").notNull().default(true),
  showLoveStory: boolean("show_love_story").notNull().default(true),
  showGallery: boolean("show_gallery").notNull().default(true),
  showRsvp: boolean("show_rsvp").notNull().default(true),
  showContact: boolean("show_contact").notNull().default(true),
  showShare: boolean("show_share").notNull().default(true),

  // Theme
  colorPrimary: text("color_primary").notNull().default("#4A3527"),
  colorSecondary: text("color_secondary").notNull().default("#C29A5B"),
  colorAccent: text("color_accent").notNull().default("#E3D3B8"),
  colorBackground: text("color_background").notNull().default("#F6F3EE"),
  colorText: text("color_text").notNull().default("#4A3A2C"),
  fontHeading: text("font_heading").notNull().default("'Khmer OS Muol Light'"),
  fontBody: text("font_body").notNull().default("'Noto Sans Khmer'"),
  pattern: text("pattern").notNull().default("none"), // lotus | angkor | floral | none
  /** "builtin" uses frameMotif; "custom" uses the uploaded artwork below. */
  frameSource: text("frame_source").notNull().default("builtin"),
  /** Built-in frame: kbach (band art), royal | royal-light (corner art),
   *  lotus | flame | angkor | wheel (generated bands) */
  frameMotif: text("frame_motif").notNull().default("flourish"),
  /** The set of ornaments the whole invitation is decorated with (`lib/designKit`). */
  designKit: text("design_kit").notNull().default("vintage-flourish"),
  /** How uploaded artwork is placed: "band" (head/foot) or "corner" (all four). */
  frameLayout: text("frame_layout").notNull().default("band"),
  /** Uploaded band artwork crowning the head of the card. */
  frameTopMediaId: text("frame_top_media_id"),
  frameTopUrl: text("frame_top_url").notNull().default(""),
  /** Optional separate artwork for the foot; otherwise the head is mirrored. */
  frameBottomMediaId: text("frame_bottom_media_id"),
  frameBottomUrl: text("frame_bottom_url").notNull().default(""),
  frameMirrorBottom: boolean("frame_mirror_bottom").notNull().default(true),
  frameSideRules: boolean("frame_side_rules").notNull().default(true),
  /** Tint the frame artwork to the title colour instead of its own gold. */
  frameTint: boolean("frame_tint").notNull().default(false),
  /** Hold the frame on screen and scroll the invitation inside it. */
  frameSticky: boolean("frame_sticky").notNull().default(true),
  /** Whether the card has a border at all (ស៊ុមសំបុត្រ): the corner or band art and its rules. */
  frameEnabled: boolean("frame_enabled").notNull().default(true),
  /** Frame artwork size, as a percentage of the card's width. */
  frameScale: integer("frame_scale").notNull().default(60),
  /** Overall type size for the invitation, as a percentage. */
  fontScale: integer("font_scale").notNull().default(100),

  /* ── The 3D envelope shown before the invitation ──────────────────────
     Guests should feel they are opening a physical card, so the invitation
     arrives sealed. Everything here is optional: turned off, the guest lands
     on the cover exactly as before. */
  envelopeEnabled: boolean("envelope_enabled").notNull().default(true),
  envelopeStyle: text("envelope_style").notNull().default("royal-khmer"),
  /** Overrides for the chosen style; empty means "use the style's own". */
  envelopePaper: text("envelope_paper").notNull().default(""),
  envelopeGold: text("envelope_gold").notNull().default(""),
  envelopeSeal: boolean("envelope_seal").notNull().default(true),
  /** Empty means the couple's initials. */
  envelopeSealText: text("envelope_seal_text").notNull().default(""),
  envelopeAnimate: boolean("envelope_animate").notNull().default(true),
  /** Length of the opening sequence, in milliseconds. */
  envelopeDuration: integer("envelope_duration").notNull().default(6200),
  envelopeMusic: boolean("envelope_music").notNull().default(true),
  envelopeSkip: boolean("envelope_skip").notNull().default(true),
  /** Off: opened once, the envelope stays open for the rest of the visit. */
  envelopeEveryVisit: boolean("envelope_every_visit").notNull().default(false),
  /** The envelope and its room in the chosen paper's colours. */
  envelopeMatchPaper: boolean("envelope_match_paper").notNull().default(true),
  /* Wording on the envelope, so the couple can phrase the invitation to open
     it however they wish. */
  envelopeOpenLabel: text("envelope_open_label").notNull().default("បើកសំបុត្រអញ្ជើញ"),
  envelopeHint: text("envelope_hint").notNull().default("សូមចុចដើម្បីបើកសំបុត្រអញ្ជើញ"),
  envelopeSkipLabel: text("envelope_skip_label").notNull().default("រំលង"),
  /* The heading on the set above the envelope, and the script line under it.
     Empty hides either one. */
  envelopeTitle: text("envelope_title").notNull().default("សិរីមង្គលអាពាហ៍ពិពាហ៍"),
  envelopeSubtitle: text("envelope_subtitle").notNull().default(""),

  /* ── The pre-wedding film, played between the envelope and the curtains ──
     One beat, in the one place it belongs: the envelope has just been opened
     and the invitation has not been read yet, which is the only moment in the
     visit where a guest is watching rather than reading. Off by default, and
     off costs nothing — the envelope hands straight to the curtains exactly as
     it did before. */
  videoEnabled: boolean("video_enabled").notNull().default(false),
  /** A link — YouTube, Vimeo, Facebook, or a direct .mp4 / .webm file. */
  videoUrl: text("video_url").notNull().default(""),
  /** Or an uploaded file, which wins over the link when both are set. */
  videoMediaId: text("video_media_id"),
  /** Shown while the film loads, and it is worth setting: a black rectangle
      between the envelope and the curtains undoes both of them. */
  videoPosterId: text("video_poster_id"),
  videoSkipLabel: text("video_skip_label").notNull().default("រំលងវីដេអូ"),
  /** The film's frame: "portrait" (the size of the invitation) or "original" (its own shape). */
  videoFrame: text("video_frame").notNull().default("portrait"),

  /*
   * The couple's own artwork, on the four surfaces the app otherwise draws
   * itself. All of it is optional and all of it defaults to "as before": an
   * invitation that uploads nothing renders exactly what it rendered before
   * any of these columns existed.
   *
   * The ids are nullable rather than empty strings, so "never set" and
   * "cleared" stay distinguishable.
   */

  /* Printed on the envelope's paper, across both sliding panels. */
  envelopeFaceMediaId: text("envelope_face_media_id"),
  /** cover | contain | stretch */
  envelopeFaceFit: text("envelope_face_fit").notNull().default("cover"),
  /** How much paper colour is laid back over it, 0-100. */
  envelopeFaceScrim: integer("envelope_face_scrim").notNull().default(0),
  /** Whether the gilt frame and emboss are still struck over the picture. */
  envelopeFaceOrnament: boolean("envelope_face_ornament").notNull().default(true),

  /* Printed on the curtain panels, which still part and gather. */
  curtainMediaId: text("curtain_media_id"),
  /** image | video — video is allowed here and on no other surface. */
  curtainMediaKind: text("curtain_media_kind").notNull().default("image"),
  curtainPosterId: text("curtain_poster_id"),
  /** cover | contain | tile */
  curtainFit: text("curtain_fit").notNull().default("cover"),
  /** Drape the drawn folds over it as shading rather than paint over it. */
  curtainFolds: boolean("curtain_folds").notNull().default(true),
  /** Whether the curtains hang across the invitation and part at all. */
  curtainEnabled: boolean("curtain_enabled").notNull().default(true),
  curtainShade: integer("curtain_shade").notNull().default(55),

  /* Behind everything. */
  pageBgMediaId: text("page_bg_media_id"),
  /** cover | contain | tile */
  pageBgFit: text("page_bg_fit").notNull().default("cover"),
  pageBgScrim: integer("page_bg_scrim").notNull().default(0),
  /** A built-in design (`lib/backgrounds`), used when nothing is uploaded. */
  pageBgPreset: text("page_bg_preset").notNull().default(""),

  /* The card's own paper. Its scrim defaults high: this one is under the
     writing, and a photograph at full strength behind Khmer body text is an
     invitation nobody can read. */
  cardBgMediaId: text("card_bg_media_id"),
  cardBgFit: text("card_bg_fit").notNull().default("cover"),
  cardBgScrim: integer("card_bg_scrim").notNull().default(55),
  cardBgPreset: text("card_bg_preset").notNull().default(""),
  /* ── Appearance: the paper theme and the live layer (`lib/appearance`) ── */
  appearancePaper: text("appearance_paper").notNull().default("classic-ivory"),
  appearanceFx: text("appearance_fx").notNull().default("dust"),
  appearanceLevel: text("appearance_level").notNull().default("medium"),
  /** The paper colour over the design (lib/paperTones); "design" keeps its own. */
  appearanceTone: text("appearance_tone").notNull().default("design"),
  /** Whether guests see the small appearance-settings button. */
  appearanceGuestPanel: boolean("appearance_guest_panel").notNull().default(true),
  /**
   * Bumped every time the couple saves their appearance settings. It is part
   * of what a guest's saved look is checked against (appearanceBasis), so a
   * save makes every browser show the couple's design again, even when the
   * values themselves did not change.
   */
  appearanceRev: integer("appearance_rev").notNull().default(0),
  /** Wording on the button that carries on to the invitation. */

  /* ── The gold frame as pressed foil rather than a flat picture ─────────
     The artwork is the couple's own; these settle how it is lit and how far
     it is raised off the paper. Both static: the invitation is stationery,
     and the envelope is where the animation lives. */
  frameEmboss: boolean("frame_emboss").notNull().default(true),
  /** How far the ornament stands off the paper, 0–100. */
  frameDepth: integer("frame_depth").notNull().default(55),

  /** The message sent with each guest's link; empty uses lib/shareCaption's default. */
  shareCaption: text("share_caption").notNull().default(""),

  // SEO
  metaDescription: text("meta_description").notNull().default(""),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Wedding programme ─────────────────────────────────────────────────── */
export const weddingEvents = pgTable("wedding_events", {
  id: id(),
  weddingId: weddingId(),
  groupName: text("group_name").notNull().default("ពេលព្រឹក"),
  groupIcon: text("group_icon").notNull().default("🌸"),
  timeLabel: text("time_label").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  icon: text("icon").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ── Love story timeline ───────────────────────────────────────────────── */
export const storyItems = pgTable("story_items", {
  id: id(),
  weddingId: weddingId(),
  label: text("label").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ── Gallery ───────────────────────────────────────────────────────────── */
export const galleryImages = pgTable("gallery_images", {
  id: id(),
  weddingId: weddingId(),
  mediaId: text("media_id"),
  url: text("url").notNull().default(""),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ── Guests ────────────────────────────────────────────────────────────── */
export const guests = pgTable("guests", {
  id: id(),
  weddingId: weddingId(),
  code: text("code").notNull().unique(),
  title: text("title").notNull().default("លោក"),
  name: text("name").notNull(),
  /** Optional Latin form shown on the cover, e.g. "Mr. Theng Rathrongroeung". */
  nameLatin: text("name_latin").notNull().default(""),
  allowedSeats: integer("allowed_seats").notNull().default(1),
  notes: text("notes").notNull().default(""),
  views: integer("views").notNull().default(0),
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── RSVP ──────────────────────────────────────────────────────────────── */
export const rsvps = pgTable("rsvps", {
  id: id(),
  weddingId: weddingId(),
  guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
  guestCode: text("guest_code").notNull().default(""),
  name: text("name").notNull(),
  attending: boolean("attending").notNull().default(true),
  guestCount: integer("guest_count").notNull().default(1),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /* A guest who changes their mind edits their reply rather than filing a
     second one, so the list needs to know when it last moved. */
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Page views ────────────────────────────────────────────────────────── */
export const pageViews = pgTable("page_views", {
  id: id(),
  weddingId: weddingId(),
  guestCode: text("guest_code").notNull().default(""),
  path: text("path").notNull().default("/"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Who may manage which wedding ──────────────────────────────────────── */
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    weddingId: text("wedding_id").notNull().references(() => wedding.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weddingId] })],
);

export type Wedding = typeof wedding.$inferSelect;
export type WeddingEvent = typeof weddingEvents.$inferSelect;
export type StoryItem = typeof storyItems.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;

export const nowSql = sql`now()`;

/* ── The system owner: one row for the whole site ───────────────────────── */
/** A further link of the owner's, e.g. { label: "LINE", url: "https://…" }. */
export type OwnerLink = { label: string; url: string };

/**
 * Who made the system, shown at the end of every invitation (SystemOwner):
 * their message and how to reach them. Edited by the site owner from the main
 * workspace (/admin/owner). A field left empty is not shown.
 */
export const systemOwner = pgTable("system_owner", {
  id: text("id").primaryKey().default("site"),
  enabled: boolean("enabled").notNull().default(true),
  message: text("message")
    .notNull()
    .default("តើលោកអ្នកចាប់អារម្មណ៍នឹងប្រើប្រាស់សេវាកម្មសំបុត្រអញ្ជើញឌីជីថលរបស់ពួកយើង សម្រាប់កម្មវិធីរបស់លោកអ្នកដែរឬទេ? ទាក់ទងមកកាន់ពួកយើងតាមរយៈ"),
  phone: text("phone").notNull().default(""),
  telegram: text("telegram").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  facebook: text("facebook").notNull().default(""),
  tiktok: text("tiktok").notNull().default(""),
  youtube: text("youtube").notNull().default(""),
  website: text("website").notNull().default(""),
  links: jsonb("links").$type<OwnerLink[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type SystemOwner = typeof systemOwner.$inferSelect;
