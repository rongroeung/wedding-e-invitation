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
        <link
          rel="preload"
          href="/fonts/KhmerOSMuolLight.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {selfHostedFonts ? (
          <link rel="stylesheet" href="/fonts/fonts.css" />
        ) : (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
              href="https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@300;400;500;600&family=Moul&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap"
              rel="stylesheet"
            />
          </>
        )}
        {/*
          * Two things that have to happen before React does.
          *
          * The first enables the scroll-reveal animations, and only when
          * JavaScript is available to run them.
          *
          * The second catches taps on the sealed envelope that land before the
          * bundle has hydrated. React attaches its listeners at the root once
          * the page is interactive; on a mid-range phone over mobile data that
          * can be several seconds after the envelope is on screen and plainly
          * asking to be touched. Those taps used to go nowhere at all, which is
          * indistinguishable from a broken invitation — and it is intermittent
          * by nature, which is exactly how it was reported. This records them
          * against the one element that matters, and the overlay replays the
          * tap the moment it mounts. It is a counter and a capture-phase
          * listener: no dependency on the bundle, and nothing to go wrong if
          * the bundle never arrives.
          */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');" +
              "window.__envTap=0;" +
              "document.addEventListener('click',function(e){" +
              "var t=e.target;" +
              "if(t&&t.closest&&t.closest('.env-anywhere'))window.__envTap++;" +
              "},true);",
          }}
        />
      </head>
      <body className="paper antialiased">{children}</body>
    </html>
  );
}
