import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  serverExternalPackages: ["@electric-sql/pglite", "pg", "bcryptjs"],
  /*
   * The database brings itself up to date on first use (lib/db/index.ts,
   * ensureSchema) by reading the SQL files in ./drizzle at run time. Nothing
   * imports them, so the build's file tracing cannot see them and a
   * serverless deploy (Vercel) ships every function without them — the
   * migrator then finds no folder and applies nothing, and the first query
   * for a newer column fails. Ship them with every route.
   */
  outputFileTracingIncludes: {
    // the home page has to be named on its own: "/**/*" needs a segment
    "/": ["./drizzle/*.sql"],
    "/**/*": ["./drizzle/*.sql"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
