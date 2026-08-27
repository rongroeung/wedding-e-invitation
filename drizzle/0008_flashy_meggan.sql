DROP TABLE "gift_accounts" CASCADE;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "gift_qr_media_id" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "gift_qr_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "gift_account_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" DROP COLUMN "phone";