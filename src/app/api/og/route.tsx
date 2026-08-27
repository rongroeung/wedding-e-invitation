import { ImageResponse } from "next/og";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Open Graph preview image (1200×630) used by Telegram, Messenger and Facebook.
 * The Khmer font is fetched from Google Fonts and subset to only the glyphs we
 * actually draw, so the image stays small and renders correctly.
 */
export async function GET() {
  let wedding;
  try {
    wedding = await getWedding();
  } catch {
    return new Response("Not available", { status: 404 });
  }

  const title = wedding.title;
  const names = `${wedding.groomName}  ❤  ${wedding.brideName}`;
  const date = wedding.weddingDateKhmer;
  const venue = wedding.venueName;
  const text = [title, names, date, venue].join("");

  const fonts = await loadKhmerFonts(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#FBF7F0 0%,#F3E8D2 45%,#EFE0C4 100%)",
          fontFamily: fonts.length ? "KhmerSerif" : "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "2px solid rgba(200,162,74,0.75)",
            borderRadius: 18,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 40,
            border: "1px solid rgba(200,162,74,0.4)",
            borderRadius: 12,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", fontSize: 46, color: "#A8842F", marginBottom: 6 }}>❦</div>

        <div style={{ display: "flex", fontSize: 44, color: "#A8842F", letterSpacing: 2 }}>
          {title}
        </div>

        <div
          style={{
            display: "flex",
            width: 420,
            height: 2,
            background: "linear-gradient(90deg,transparent,#C8A24A,transparent)",
            margin: "26px 0",
          }}
        />

        <div style={{ display: "flex", fontSize: 62, color: "#7B1F2F", textAlign: "center" }}>
          {names}
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#3E2A20", marginTop: 30 }}>{date}</div>
        <div style={{ display: "flex", fontSize: 24, color: "rgba(62,42,32,0.7)", marginTop: 10 }}>
          {venue}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length
        ? fonts.map((data) => ({ name: "KhmerSerif", data, style: "normal" as const, weight: 600 as const }))
        : undefined,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}

/** Downloads a TrueType subset of Noto Serif Khmer for the given characters. */
async function loadKhmerFonts(text: string): Promise<ArrayBuffer[]> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@600&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 86400 } },
    ).then((r) => r.text());

    const match = /src:\s*url\(([^)]+)\)/.exec(css);
    if (!match) return [];
    const font = await fetch(match[1]).then((r) => r.arrayBuffer());
    return [font];
  } catch {
    return [];
  }
}
