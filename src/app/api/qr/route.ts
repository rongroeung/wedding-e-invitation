import QRCode from "qrcode";
import { fail } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getGuestByCode } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * QR code for an invitation link, so a guest reading on a laptop can move to
 * their phone. Only encodes a URL the caller already holds, and 404s on an
 * unknown code so the endpoint cannot be used to probe for valid invitations.
 */
export async function GET(request: Request) {
  if (!rateLimit(clientKey(request, "qr"), 30, 60 * 1000).ok) {
    return fail("Too many requests", 429);
  }

  const code = (new URL(request.url).searchParams.get("code") ?? "").slice(0, 80);
  if (!code) return fail("Missing code", 400);
  if (!(await getGuestByCode(code))) return fail("Not found", 404);

  const png = await QRCode.toBuffer(`${siteUrl()}/invite/${encodeURIComponent(code)}`, {
    type: "png",
    width: 600,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#3B2C21", light: "#FFFFFFFF" },
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
