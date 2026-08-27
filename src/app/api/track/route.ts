import { z } from "zod";
import { fail, isSameOrigin, ok, readJson } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { trackView } from "@/lib/queries";

const schema = z.object({
  path: z.string().max(200).default("/"),
  guestCode: z.string().max(80).default(""),
});

/** Records an invitation view for the dashboard counters. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Bad origin", 403);
  if (!rateLimit(clientKey(request, "track"), 30, 60 * 1000).ok) return ok({ skipped: true });

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return ok({ skipped: true });

  try {
    await trackView(parsed.data.path, parsed.data.guestCode);
  } catch {
    /* view tracking must never break the invitation */
  }
  return ok({ tracked: true });
}
