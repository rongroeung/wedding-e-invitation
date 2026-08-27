ALTER TABLE "wedding" ALTER COLUMN "invitation_body" SET DEFAULT 'អញ្ជើញចូលរួម ជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីមង្គលអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "font_heading" SET DEFAULT '''Khmer OS Muol Light''';--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "wedding" DROP COLUMN "invitation_intro";--> statement-breakpoint
ALTER TABLE "wedding" DROP COLUMN "invitation_closing";