import QRCode from "qrcode";
import { fail, getSession } from "@/lib/api";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Generates a downloadable PNG QR code that opens a (personalised) invitation.
 *   /api/admin/qr?code=ABC123&download=1
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return fail("Unauthorized", 401);

  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").slice(0, 80);
  const download = url.searchParams.get("download") === "1";
  const target = code ? `${siteUrl()}/invite/${encodeURIComponent(code)}` : siteUrl();

  const png = await QRCode.toBuffer(target, {
    type: "png",
    width: 900,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#7B1F2F", light: "#FFFFFFFF" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
      ...(download
        ? { "Content-Disposition": `attachment; filename="invitation-${code || "wedding"}.png"` }
        : {}),
    },
  });
}
