CREATE TABLE "gallery_images" (
	"id" text PRIMARY KEY NOT NULL,
	"media_id" text,
	"url" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_name" text NOT NULL,
	"account_name" text NOT NULL,
	"account_number" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"qr_media_id" text,
	"qr_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text DEFAULT 'លោក' NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"allowed_seats" integer DEFAULT 1 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"kind" text DEFAULT 'image' NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" text PRIMARY KEY NOT NULL,
	"guest_code" text DEFAULT '' NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" text PRIMARY KEY NOT NULL,
	"guest_id" text,
	"guest_code" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"attending" boolean DEFAULT true NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_items" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'Admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wedding" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"title" text DEFAULT 'សិរីមង្គលអាពាហ៍ពិពាហ៍' NOT NULL,
	"subtitle" text DEFAULT 'សូមគោរពអញ្ជើញ' NOT NULL,
	"open_button" text DEFAULT 'បើកសំបុត្រអញ្ជើញ' NOT NULL,
	"cover_photo_id" text,
	"cover_photo_url" text DEFAULT '' NOT NULL,
	"groom_title" text DEFAULT 'លោក' NOT NULL,
	"groom_name" text DEFAULT 'សុខ វិសាល' NOT NULL,
	"groom_full_name" text DEFAULT 'សុខ វិសាល' NOT NULL,
	"groom_father_name" text DEFAULT 'លោក សុខ សុវណ្ណ' NOT NULL,
	"groom_mother_name" text DEFAULT 'អ្នកស្រី ចាន់ សុភា' NOT NULL,
	"groom_phone" text DEFAULT '' NOT NULL,
	"groom_photo_id" text,
	"groom_photo_url" text DEFAULT '' NOT NULL,
	"bride_title" text DEFAULT 'កញ្ញា' NOT NULL,
	"bride_name" text DEFAULT 'លីន ស្រីពៅ' NOT NULL,
	"bride_full_name" text DEFAULT 'លីន ស្រីពៅ' NOT NULL,
	"bride_father_name" text DEFAULT 'លោក លីន វណ្ណៈ' NOT NULL,
	"bride_mother_name" text DEFAULT 'អ្នកស្រី សុខ សុជាតា' NOT NULL,
	"bride_phone" text DEFAULT '' NOT NULL,
	"bride_photo_id" text,
	"bride_photo_url" text DEFAULT '' NOT NULL,
	"invitation_honorific" text DEFAULT 'ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា' NOT NULL,
	"invitation_intro" text DEFAULT 'យើងខ្ញុំមានកិត្តិយសដ៏ខ្ពង់ខ្ពស់ សូមគោរពអញ្ជើញ' NOT NULL,
	"invitation_body" text DEFAULT 'អញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយស ក្នុងពិធីមង្គលការរបស់' NOT NULL,
	"invitation_closing" text DEFAULT 'ដើម្បីចូលរួមជាសក្ខីភាព និងប្រសិទ្ធពរជ័យ ក្នុងឱកាសដ៏សិរីមង្គលនៃការចាប់ផ្តើមជីវិតគូរបស់យើងខ្ញុំ។' NOT NULL,
	"wedding_date" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_date_khmer" text DEFAULT '' NOT NULL,
	"wedding_time_khmer" text DEFAULT '' NOT NULL,
	"buddhist_year" text DEFAULT '' NOT NULL,
	"venue_name" text DEFAULT '' NOT NULL,
	"venue_address" text DEFAULT '' NOT NULL,
	"map_url" text DEFAULT '' NOT NULL,
	"map_embed_url" text DEFAULT '' NOT NULL,
	"blessing_thanks" text DEFAULT '' NOT NULL,
	"blessing_wish" text DEFAULT '' NOT NULL,
	"gift_enabled" boolean DEFAULT true NOT NULL,
	"gift_intro" text DEFAULT '' NOT NULL,
	"gift_note" text DEFAULT '' NOT NULL,
	"music_enabled" boolean DEFAULT false NOT NULL,
	"music_title" text DEFAULT '' NOT NULL,
	"music_url" text DEFAULT '' NOT NULL,
	"music_media_id" text,
	"show_countdown" boolean DEFAULT true NOT NULL,
	"show_program" boolean DEFAULT true NOT NULL,
	"show_love_story" boolean DEFAULT true NOT NULL,
	"show_gallery" boolean DEFAULT true NOT NULL,
	"show_rsvp" boolean DEFAULT true NOT NULL,
	"show_contact" boolean DEFAULT true NOT NULL,
	"show_share" boolean DEFAULT true NOT NULL,
	"color_primary" text DEFAULT '#7B1F2F' NOT NULL,
	"color_secondary" text DEFAULT '#C8A24A' NOT NULL,
	"color_accent" text DEFAULT '#E4CE9B' NOT NULL,
	"color_background" text DEFAULT '#FBF7F0' NOT NULL,
	"color_text" text DEFAULT '#3E2A20' NOT NULL,
	"font_heading" text DEFAULT '''Noto Serif Khmer''' NOT NULL,
	"font_body" text DEFAULT '''Noto Sans Khmer''' NOT NULL,
	"pattern" text DEFAULT 'lotus' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_events" (
	"id" text PRIMARY KEY NOT NULL,
	"group_name" text DEFAULT 'ពេលព្រឹក' NOT NULL,
	"group_icon" text DEFAULT '🌸' NOT NULL,
	"time_label" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;