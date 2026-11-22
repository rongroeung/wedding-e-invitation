-- The couple's own two-day agenda (their printed programme, 2026-11-22), with
-- its ceremony icons (lib/programIcons). Written once, to the invitation that
-- carries their wording from 0042, replacing the sample programme.
DELETE FROM "wedding_events" WHERE "wedding_id" IN (
  SELECT "id" FROM "wedding" WHERE "invitation_date_line" = 'ថ្ងៃទី១៩ ខែធ្នូ ឆ្នាំ២០២៦ វេលាម៉ោង ៥ៈ៣០ ល្ងាច'
);
--> statement-breakpoint
INSERT INTO "wedding_events" ("id", "wedding_id", "group_name", "group_icon", "time_label", "title", "description", "location", "icon", "sort_order")
SELECT gen_random_uuid()::text, w."id", e.g, '', e.t, e.title, '', '', e.icon, e.n
FROM "wedding" w
CROSS JOIN (VALUES
  (1, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៧:០០ ព្រឹក', 'ជួបជុំភ្ញៀវកិត្តិយសរៀបចំពិធីហែជំនូន', 'pi:guests'),
  (2, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៨:០០ ព្រឹក', 'ពិធីហែជំនូន (កំណាត់) ចូលរោងជ័យ', 'pi:procession'),
  (3, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៨:៣០ ព្រឹក', 'ពិធីចៅមហានិយាយជើងការ រាប់ផ្លែឈើ', 'pi:offering-bowl'),
  (4, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ១០:០០ ព្រឹក', 'អញ្ជើញភ្ញៀវកិត្តិយសពិសាអាហារពេលព្រឹក', 'pi:dining'),
  (5, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០១:០០ រសៀល', 'ពិធីកាត់សក់បង្កក់សិរី កូនប្រុស - កូនស្រី', 'pi:haircut'),
  (6, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៣:០០ រសៀល', 'ពិធីជាវខាន់ស្លា', 'pi:khan-sla'),
  (7, 'កម្មវិធីថ្ងៃទី១ ថ្ងៃសុក្រ ទី១៨ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៦:០០ ល្ងាច', 'ពិធីបុកល័ក្ខ', 'pi:bok-leak'),
  (8, 'កម្មវិធីថ្ងៃទី២ ថ្ងៃសៅរ៍ ទី១៩ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៦:០០ ព្រឹក', 'ពិធីយកពាលាជ័យ', ''),
  (9, 'កម្មវិធីថ្ងៃទី២ ថ្ងៃសៅរ៍ ទី១៩ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ១០:៣០ ព្រឹក', 'ពិធីសំពះផ្ទឹម បង្វិលពពិល និងគួចចំណងដៃ', 'pi:couple-feast'),
  (10, 'កម្មវិធីថ្ងៃទី២ ថ្ងៃសៅរ៍ ទី១៩ ខែធ្នូ ឆ្នាំ២០២៦', 'ម៉ោង ០៥:៣០ ល្ងាច', 'ទទួលបដិសណ្ឋារកិច្ចភ្ញៀវកិត្តិយសពិសាអាហារពេលល្ងាច សូមអរគុណ!', 'pi:toast')
) AS e(n, g, t, title, icon)
WHERE w."invitation_date_line" = 'ថ្ងៃទី១៩ ខែធ្នូ ឆ្នាំ២០២៦ វេលាម៉ោង ៥ៈ៣០ ល្ងាច';
