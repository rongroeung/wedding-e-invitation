ALTER TABLE "wedding" ALTER COLUMN "invitation_honorific" SET DEFAULT 'ឯកឧត្តម លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា';--> statement-breakpoint
-- Carry the new wording to any row still holding the previous default, so an
-- existing deployment picks it up. Rows whose text was edited are left alone.
UPDATE "wedding"
   SET "invitation_honorific" = 'ឯកឧត្តម លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា'
 WHERE "invitation_honorific" = 'ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា';
