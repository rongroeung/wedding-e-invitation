import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, getSession, ok, readJson, requireAdmin } from "@/lib/api";
import { getDb } from "@/lib/db";
import { wedding } from "@/lib/db/schema";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().max(160).optional(),
  subtitle: z.string().max(160).optional(),
  openButton: z.string().max(80).optional(),
  monogram: z.string().max(12).optional(),
  coverPhotoId: z.string().max(80).nullable().optional(),
  coverPhotoUrl: z.string().max(500).optional(),

  groomTitle: z.string().max(40).optional(),
  groomName: z.string().max(120).optional(),
  groomFullName: z.string().max(160).optional(),
  groomFatherName: z.string().max(160).optional(),
  groomMotherName: z.string().max(160).optional(),
  groomPhone: z.string().max(40).optional(),
  groomPhotoId: z.string().max(80).nullable().optional(),
  groomPhotoUrl: z.string().max(500).optional(),

  brideTitle: z.string().max(40).optional(),
  brideName: z.string().max(120).optional(),
  brideFullName: z.string().max(160).optional(),
  brideFatherName: z.string().max(160).optional(),
  brideMotherName: z.string().max(160).optional(),
  bridePhone: z.string().max(40).optional(),
  bridePhotoId: z.string().max(80).nullable().optional(),
  bridePhotoUrl: z.string().max(500).optional(),

  invitationHonorific: z.string().max(300).optional(),
  invitationBody: z.string().max(900).optional(),

  weddingDate: z.string().optional(),
  weddingDateKhmer: z.string().max(160).optional(),
  weddingTimeKhmer: z.string().max(160).optional(),
  buddhistYear: z.string().max(60).optional(),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(400).optional(),
  mapUrl: z.string().max(600).optional(),
  mapEmbedUrl: z.string().max(900).optional(),

  blessingThanks: z.string().max(600).optional(),
  blessingWish: z.string().max(600).optional(),

  giftEnabled: z.boolean().optional(),
  giftIntro: z.string().max(400).optional(),
  giftNote: z.string().max(400).optional(),

  musicEnabled: z.boolean().optional(),
  musicTitle: z.string().max(160).optional(),
  musicUrl: z.string().max(600).optional(),
  musicMediaId: z.string().max(80).nullable().optional(),

  showCountdown: z.boolean().optional(),
  showProgram: z.boolean().optional(),
  showLoveStory: z.boolean().optional(),
  showGallery: z.boolean().optional(),
  showRsvp: z.boolean().optional(),
  showContact: z.boolean().optional(),
  showShare: z.boolean().optional(),

  colorPrimary: z.string().max(30).optional(),
  colorSecondary: z.string().max(30).optional(),
  colorAccent: z.string().max(30).optional(),
  colorBackground: z.string().max(30).optional(),
  colorText: z.string().max(30).optional(),
  fontHeading: z.string().max(80).optional(),
  fontBody: z.string().max(80).optional(),
  pattern: z.enum(["lotus", "angkor", "floral", "none"]).optional(),
  frameSource: z.enum(["builtin", "custom"]).optional(),
  frameMotif: z
    .enum(["kbach", "royal", "royal-light", "lotus", "flame", "angkor", "wheel"])
    .optional(),
  frameLayout: z.enum(["band", "corner"]).optional(),
  frameTopMediaId: z.string().max(80).nullable().optional(),
  frameTopUrl: z.string().max(600).optional(),
  frameBottomMediaId: z.string().max(80).nullable().optional(),
  frameBottomUrl: z.string().max(600).optional(),
  frameMirrorBottom: z.boolean().optional(),
  frameSideRules: z.boolean().optional(),

  metaDescription: z.string().max(400).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Unauthorized", 401);
  return ok(await getWedding());
}

export async function PUT(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail("Invalid data", 422, { issues: parsed.error.flatten() });

  const { weddingDate, ...rest } = parsed.data;
  await getWedding(); // makes sure the row exists

  const db = await getDb();
  const [updated] = await db
    .update(wedding)
    .set({
      ...rest,
      ...(weddingDate ? { weddingDate: new Date(weddingDate) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(wedding.id, "main"))
    .returning();

  return ok(updated);
}
