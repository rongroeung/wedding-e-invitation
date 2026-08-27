import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getWedding } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7B1F2F",
};

export async function generateMetadata(): Promise<Metadata> {
  let title = "សិរីមង្គលអាពាហ៍ពិពាហ៍";
  let description = "សូមគោរពអញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយស ក្នុងពិធីមង្គលការរបស់យើងខ្ញុំ";
  let image = "/api/og";
  try {
    const w = await getWedding();
    title = `${w.title} | ${w.groomName} & ${w.brideName}`;
    description = w.metaDescription || `${w.weddingDateKhmer} • ${w.venueName}`;
    image = w.coverPhotoId
      ? `/api/media/${w.coverPhotoId}`
      : w.coverPhotoUrl || "/api/og";
  } catch {
    /* database not reachable at build time — fall back to defaults */
  }

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    applicationName: "Wedding E-Invitation",
    openGraph: {
      title,
      description,
      type: "website",
      locale: "km_KH",
      siteName: title,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
    },
  };
}

/** Prefer self-hosted fonts when `npm run fonts:download` has been run. */
const selfHostedFonts = existsSync(path.join(process.cwd(), "public", "fonts", "fonts.css"));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <head>
        {selfHostedFonts ? (
          <link rel="stylesheet" href="/fonts/fonts.css" />
        ) : (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
              href="https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap"
              rel="stylesheet"
            />
          </>
        )}
        {/* Enables the scroll-reveal animations only when JavaScript is available */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');`,
          }}
        />
      </head>
      <body className="paper antialiased">{children}</body>
    </html>
  );
}
