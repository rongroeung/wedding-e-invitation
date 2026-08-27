import "./load-env";
/**
 * Seeds demo wedding content and the first admin account.
 *   npm run db:seed
 */
import bcrypt from "bcryptjs";
import { getDb } from "../src/lib/db";
import {
  galleryImages,
  giftAccounts,
  guests,
  media,
  storyItems,
  users,
  wedding,
  weddingEvents,
} from "../src/lib/db/schema";
import { placeholderPhoto } from "../src/lib/placeholder";

async function main() {
  const db = await getDb();

  /* ── Admin user ─────────────────────────────────────────────── */
  const email = process.env.ADMIN_EMAIL || "admin@wedding.local";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const existing = await db.select().from(users).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      email,
      name: "អ្នកគ្រប់គ្រង",
      passwordHash: await bcrypt.hash(password, 12),
    });
    console.log(`✔ admin created — ${email} / ${password}`);
  } else {
    console.log("• admin already exists, skipped");
  }

  /* ── Wedding information ────────────────────────────────────── */
  const hasWedding = await db.select().from(wedding).limit(1);
  if (hasWedding.length === 0) {
    await db.insert(wedding).values({
      id: "main",
      weddingDate: new Date("2027-04-24T17:30:00+07:00"),
      weddingDateKhmer: "ថ្ងៃសៅរ៍ ទី ២៤ ខែ មេសា ឆ្នាំ ២០២៧",
      weddingTimeKhmer: "វេលាម៉ោង ០៥:៣០ នាទីល្ងាច",
      buddhistYear: "ព.ស. ២៥៧១",
      venueName: "សណ្ឋាគារ សុខា ភ្នំពេញ",
      venueAddress: "ផ្លូវសម្តេច ហ៊ុន សែន រាជធានីភ្នំពេញ ព្រះរាជាណាចក្រកម្ពុជា",
      mapUrl: "https://maps.google.com/?q=Sokha+Phnom+Penh+Hotel",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Sokha%20Phnom%20Penh%20Hotel&output=embed",
      groomPhone: "012 345 678",
      bridePhone: "012 987 654",
      blessingThanks:
        "សូមអរគុណយ៉ាងជ្រាលជ្រៅចំពោះវត្តមាន និងសេចក្តីអនុគ្រោះរបស់លោកអ្នក។",
      blessingWish:
        "សូមជូនពរឱ្យលោកអ្នក និងក្រុមគ្រួសារ ជួបប្រទះតែសេចក្តីសុខ សុភមង្គល សុខភាពល្អ និងជោគជ័យគ្រប់ភារកិច្ច។",
      giftIntro: "វត្តមានរបស់លោកអ្នក គឺជាកិត្តិយសដ៏ធំធេងសម្រាប់យើងខ្ញុំ។",
      giftNote:
        "ប្រសិនបើលោកអ្នកមានបំណងចូលរួមជាចំណងដៃ សូមមេត្តាប្រើប្រាស់ព័ត៌មានខាងក្រោម៖",
      metaDescription:
        "សូមគោរពអញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយស ក្នុងពិធីមង្គលការរបស់ សុខ វិសាល និង លីន ស្រីពៅ",
      monogram: "S&L",
      frameMotif: "kbach",
      invitationHonorific:
        "ឯកឧត្តម លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា",
      invitationBody:
        "អញ្ជើញចូលរួម ជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីមង្គលអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ",
    });
    console.log("✔ wedding information seeded");
  } else {
    console.log("• wedding row already exists, skipped");
  }

  /* ── Programme ──────────────────────────────────────────────── */
  if ((await db.select().from(weddingEvents).limit(1)).length === 0) {
    await db.insert(weddingEvents).values([
      { groupName: "ពេលព្រឹក", groupIcon: "🌸", timeLabel: "០៦:០០ នាទីព្រឹក", title: "ពិធីហែជំនូន", description: "ក្បួនហែជំនូនចេញដំណើរពីផ្ទះខាងកូនប្រុស", icon: "🌺", sortOrder: 1 },
      { groupName: "ពេលព្រឹក", groupIcon: "🌸", timeLabel: "០៧:០០ នាទីព្រឹក", title: "ពិធីកាត់សក់", description: "ពិធីកាត់សក់ជូនពរដល់កូនកំលោះ នាងក្រមុំ", icon: "✂️", sortOrder: 2 },
      { groupName: "ពេលព្រឹក", groupIcon: "🌸", timeLabel: "០៨:០០ នាទីព្រឹក", title: "ពិធីសំពះផ្ទឹម និងចងដៃ", description: "ពិធីប្រគេនពរជ័យពីមាតាបិតា និងញាតិសន្តាន", icon: "🙏", sortOrder: 3 },
      { groupName: "ពេលព្រឹក", groupIcon: "🌸", timeLabel: "០៩:៣០ នាទីព្រឹក", title: "ពិធីបង្វិលពពិល", description: "ពិធីបង្វិលពពិលជូនពរដល់គូស្វាមីភរិយាថ្មី", icon: "🕯️", sortOrder: 4 },
      { groupName: "ពេលល្ងាច", groupIcon: "🌙", timeLabel: "០៥:៣០ នាទីល្ងាច", title: "ទទួលភ្ញៀវកិត្តិយស", description: "សូមគោរពអញ្ជើញភ្ញៀវកិត្តិយសចូលរួមក្នុងពិធី", icon: "🌟", sortOrder: 5 },
      { groupName: "ពេលល្ងាច", groupIcon: "🌙", timeLabel: "០៦:៣០ នាទីល្ងាច", title: "ពិធីស្វាគមន៍ និងថតរូបអនុស្សាវរីយ៍", description: "ថតរូបជាមួយគូស្វាមីភរិយាថ្មី", icon: "📷", sortOrder: 6 },
      { groupName: "ពេលល្ងាច", groupIcon: "🌙", timeLabel: "០៧:០០ នាទីល្ងាច", title: "ពិធីជប់លៀងអាពាហ៍ពិពាហ៍", description: "អាហារពេលល្ងាច និងកម្មវិធីសិល្បៈ", icon: "🍽️", sortOrder: 7 },
    ]);
    console.log("✔ programme seeded");
  }

  /* ── Love story ─────────────────────────────────────────────── */
  if ((await db.select().from(storyItems).limit(1)).length === 0) {
    await db.insert(storyItems).values([
      { label: "ឆ្នាំ ២០១៩", title: "ថ្ងៃដំបូងដែលយើងបានស្គាល់គ្នា", description: "ការជួបគ្នាដំបូងនៅសាកលវិទ្យាល័យ ដែលបានក្លាយជាការចាប់ផ្តើមនៃរឿងរ៉ាវដ៏ស្រស់ស្អាត", sortOrder: 1 },
      { label: "ឆ្នាំ ២០២១", title: "ការចាប់ផ្តើមនៃដំណើរជីវិតរបស់យើង", description: "យើងបានសម្រេចចិត្តដើរជាមួយគ្នា ក្នុងគ្រប់ពេលវេលាទាំងសុខ និងទុក្ខ", sortOrder: 2 },
      { label: "ឆ្នាំ ២០២៦", title: "ថ្ងៃដែលយើងសម្រេចចិត្តដើររួមគ្នា", description: "ពិធីភ្ជាប់ពាក្យ ដោយមានវត្តមានមាតាបិតា និងញាតិសន្តានទាំងសងខាង", sortOrder: 3 },
      { label: "ថ្ងៃរៀបការ", title: "ថ្ងៃដែលយើងចាប់ផ្តើមជីវិតគូ", description: "ថ្ងៃដ៏សិរីមង្គល ដែលយើងខ្ញុំសូមគោរពអញ្ជើញលោកអ្នកចូលរួមជាសក្ខីភាព", sortOrder: 4 },
    ]);
    console.log("✔ love story seeded");
  }

  /* ── Demo gallery (locally generated placeholder artwork) ───── */
  if ((await db.select().from(galleryImages).limit(1)).length === 0) {
    const captions = [
      "ថ្ងៃដំបូងនៃការជួបគ្នា",
      "ពិធីភ្ជាប់ពាក្យ",
      "អនុស្សាវរីយ៍មុនអាពាហ៍ពិពាហ៍",
      "ក្រុមគ្រួសារទាំងសងខាង",
      "ការរៀបចំពិធីមង្គលការ",
      "ស្នេហាដ៏យូរអង្វែង",
    ];
    for (let i = 0; i < captions.length; i++) {
      const svg = Buffer.from(placeholderPhoto(captions[i], i), "utf8");
      const [row] = await db
        .insert(media)
        .values({
          filename: `demo-${i + 1}.svg`,
          mimeType: "image/svg+xml",
          size: svg.byteLength,
          kind: "image",
          data: svg,
        })
        .returning();
      await db.insert(galleryImages).values({
        mediaId: row.id,
        caption: captions[i],
        sortOrder: i + 1,
      });
    }
    console.log("✔ demo gallery seeded");
  }

  /* ── Gift accounts ──────────────────────────────────────────── */
  if ((await db.select().from(giftAccounts).limit(1)).length === 0) {
    await db.insert(giftAccounts).values([
      { bankName: "ABA Bank", accountName: "SOK VISAL", accountNumber: "000 123 456", sortOrder: 1 },
      { bankName: "ACLEDA Bank", accountName: "LIN SREYPOV", accountNumber: "1000 12345 6", sortOrder: 2 },
      { bankName: "Wing", accountName: "SOK VISAL", accountNumber: "012 345 678", sortOrder: 3 },
    ]);
    console.log("✔ gift accounts seeded");
  }

  /* ── Demo guests ────────────────────────────────────────────── */
  if ((await db.select().from(guests).limit(1)).length === 0) {
    await db.insert(guests).values([
      {
        code: "K7Q4MXA2",
        title: "លោក",
        name: "ថេង រ័ត្នរង្សីរឿង",
        nameLatin: "Mr. Theng Rathrongroeung",
        allowedSeats: 2,
      },
      { code: "P3WHY9TB", title: "លោកស្រី", name: "ចាន់ ដារ៉ា", allowedSeats: 2 },
      { code: "R6JZ2NDK", title: "កញ្ញា", name: "សុវណ្ណ មករា", allowedSeats: 1 },
    ]);
    console.log("✔ demo guests seeded");
  }

  console.log("\nSeeding complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
