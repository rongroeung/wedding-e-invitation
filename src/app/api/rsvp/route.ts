import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { rsvps } from "@/lib/db/schema";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fail, isSameOrigin, ok, readJson } from "@/lib/api";
import { getGuestByCode } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  attending: z.boolean(),
  guestCount: z.number().int().min(0).max(20).default(1),
  message: z.string().trim().max(600).optional().default(""),
  guestCode: z.string().trim().max(80).optional().default(""),
});

/** Public RSVP submission (rate limited, validated, same-origin only). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Bad origin", 403);

  const limit = rateLimit(clientKey(request, "rsvp"), 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return fail("សូមមេត្តារង់ចាំមួយភ្លែត មុននឹងផ្ញើម្ដងទៀត", 429, { retryAfter: limit.retryAfter });
  }

  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("ព័ត៌មានមិនត្រឹមត្រូវ សូមពិនិត្យម្ដងទៀត", 422);

  const input = parsed.data;
  const guest = input.guestCode ? await getGuestByCode(input.guestCode) : null;

  const values = {
    guestId: guest?.id ?? null,
    guestCode: guest?.code ?? "",
    name: input.name,
    attending: input.attending,
    guestCount: input.attending ? Math.max(1, input.guestCount) : 0,
    message: input.message,
  };

  const db = await getDb();

  /*
   * A guest holding an invitation code gets exactly one reply, edited in place.
   *
   * Filing a second row instead would leave the invitation guessing which of
   * two rows with the same timestamp is current, and would show the couple the
   * same guest twice in the RSVP list. An anonymous submission has no identity
   * to update, so it is simply recorded.
   */
  if (guest) {
    const existing = await db
      .select({ id: rsvps.id })
      .from(rsvps)
      .where(eq(rsvps.guestCode, guest.code))
      .limit(1);
    if (existing[0]) {
      await db
        .update(rsvps)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(rsvps.id, existing[0].id));
      return ok({ received: true, updated: true });
    }
  }

  await db.insert(rsvps).values(values);
  return ok({ received: true, updated: false });
}
