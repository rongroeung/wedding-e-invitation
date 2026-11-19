import { z } from "zod";
import { fail, isSameOrigin, ok, readJson } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getGuestByCode, getWeddingBySlug, trackView } from "@/lib/queries";

const schema = z.object({
  path: z.string().max(200).default("/"),
  guestCode: z.string().max(80).default(""),
  workspace: z.string().max(60).default("main"),
});

/* a view count is never worth a long wait */
export const maxDuration = 15;

/** Records an invitation view for the dashboard counters. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Bad origin", 403);
  if (!rateLimit(clientKey(request, "track"), 30, 60 * 1000).ok) return ok({ skipped: true });

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return ok({ skipped: true });

  try {
    const { path, guestCode, workspace } = parsed.data;
    const guest = guestCode ? await getGuestByCode(guestCode) : null;
    const weddingId = guest ? guest.weddingId : (await getWeddingBySlug(workspace || "main"))?.id;
    if (weddingId) await trackView(weddingId, path, guest ? guest.code : "");
  } catch {
    /* view tracking must never break the invitation */
  }
  return ok({ tracked: true });
}
