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
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Binary assets (kept in the DB so serverless hosts work out of the box) ─ */
export const media = pgTable("media", {
  id: id(),
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

/* ── Wedding information (single row, id = "main") ─────────────────────── */
export const wedding = pgTable("wedding", {
  id: text("id").primaryKey().default("main"),

  // Cover
  title: text("title").notNull().default("សិរីមង្គលអាពាហ៍ពិពាហ៍"),
  subtitle: text("subtitle").notNull().default("សូមគោរពអញ្ជើញ"),
  openButton: text("open_button").notNull().default("បើកលិខិត"),
  /** Decorative monogram on the cover, e.g. "S&K" or "ស ក". */
  monogram: text("monogram").notNull().default(""),
  /**
   * The face it is set in — a catalogue id, not a CSS family name.
   *
   * See `src/lib/monogram-fonts.ts`. Storing the id means a face can be
   * renamed or re-filed without rewriting rows, and an id that is no longer
   * offered resolves to the default rather than asking a guest's browser for a
   * font that no longer exists.
   */
  monogramFont: text("monogram_font").notNull().default("great-vibes"),
  coverPhotoId: text("cover_photo_id"),
  coverPhotoUrl: text("cover_photo_url").notNull().default(""),

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
  invitationHonorific: text("invitation_honorific")
    .notNull()
    .default("ឯកឧត្តម លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា"),
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

  // Closing blessing
  blessingThanks: text("blessing_thanks").notNull().default(""),
  blessingWish: text("blessing_wish").notNull().default(""),

  // Digital gift
  giftEnabled: boolean("gift_enabled").notNull().default(true),
  giftIntro: text("gift_intro").notNull().default(""),
  giftNote: text("gift_note").notNull().default(""),
  /** A single KHQR — Cambodia's unified QR, scannable from every bank app. */
  giftQrMediaId: text("gift_qr_media_id"),
  giftQrUrl: text("gift_qr_url").notNull().default(""),
  giftAccountName: text("gift_account_name").notNull().default(""),

  // Music
  musicEnabled: boolean("music_enabled").notNull().default(false),
  musicTitle: text("music_title").notNull().default(""),
  musicUrl: text("music_url").notNull().default(""),
  musicMediaId: text("music_media_id"),

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
  frameMotif: text("frame_motif").notNull().default("kbach"),
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
  envelopeDuration: integer("envelope_duration").notNull().default(2800),
  envelopeMusic: boolean("envelope_music").notNull().default(true),
  envelopeSkip: boolean("envelope_skip").notNull().default(true),
  /** Off: opened once, the envelope stays open for the rest of the visit. */
  envelopeEveryVisit: boolean("envelope_every_visit").notNull().default(false),
  /* Wording on the envelope, so the couple can phrase the invitation to open
     it however they wish. */
  envelopeOpenLabel: text("envelope_open_label").notNull().default("បើកសំបុត្រអញ្ជើញ"),
  envelopeHint: text("envelope_hint").notNull().default("សូមចុចដើម្បីបើកសំបុត្រអញ្ជើញ"),
  envelopeSkipLabel: text("envelope_skip_label").notNull().default("រំលង"),

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
  /** Wording on the button that carries on to the invitation. */
  videoContinueLabel: text("video_continue_label").notNull().default("បន្តទៅលិខិតអញ្ជើញ"),

  /* ── The gold frame as pressed foil rather than a flat picture ─────────
     The artwork is the couple's own; these settle how it is lit and how far
     it is raised off the paper. Both static: the invitation is stationery,
     and the envelope is where the animation lives. */
  frameEmboss: boolean("frame_emboss").notNull().default(true),
  /** How far the ornament stands off the paper, 0–100. */
  frameDepth: integer("frame_depth").notNull().default(55),

  // SEO
  metaDescription: text("meta_description").notNull().default(""),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Wedding programme ─────────────────────────────────────────────────── */
export const weddingEvents = pgTable("wedding_events", {
  id: id(),
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
  label: text("label").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ── Gallery ───────────────────────────────────────────────────────────── */
export const galleryImages = pgTable("gallery_images", {
  id: id(),
  mediaId: text("media_id"),
  url: text("url").notNull().default(""),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ── Guests ────────────────────────────────────────────────────────────── */
export const guests = pgTable("guests", {
  id: id(),
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
  guestCode: text("guest_code").notNull().default(""),
  path: text("path").notNull().default("/"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Wedding = typeof wedding.$inferSelect;
export type WeddingEvent = typeof weddingEvents.$inferSelect;
export type StoryItem = typeof storyItems.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;

export const nowSql = sql`now()`;
