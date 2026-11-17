-- The line that opens the letter's invitation (above ឯកឧត្តម …), set on its own.
-- It used to be the same value as the greeting on the envelope page and the
-- cover (`subtitle`, សូមគោរពអញ្ជើញ); those keep that value, and the letter now
-- reads យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ unless the couple changes it.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "invitation_lead" text DEFAULT 'យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ' NOT NULL;
