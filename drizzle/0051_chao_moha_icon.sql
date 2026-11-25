-- ពិធីចៅមហានិយាយជើងការ រាប់ផ្លែឈើ gets its own icon (a tray of fruit to be
-- counted) instead of sharing the offering bowl. A couple's own choice is kept.
UPDATE "wedding_events" SET "icon" = 'pi:chao-moha'
WHERE "title" = 'ពិធីចៅមហានិយាយជើងការ រាប់ផ្លែឈើ' AND "icon" IN ('', 'pi:offering-bowl');
