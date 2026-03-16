import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Görsel optimizasyonu ───────────────────────────────────
  images: {
    remotePatterns: [
      // Open Food Facts ürün görselleri
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org",
        pathname: "/images/products/**",
      },
      {
        protocol: "https",
        hostname: "static.openfoodfacts.org",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 saat
  },

  // ── Güvenlik başlıkları ────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",         value: "DENY" },
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",     // Next.js için gerekli
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://images.openfoodfacts.org https://static.openfoodfacts.org",
              "connect-src 'self' https://*.supabase.co https://world.openfoodfacts.org wss://*.supabase.co",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Yönlendirmeler ─────────────────────────────────────────
  async redirects() {
    return [
      {
        source:      "/",
        destination: "/search",
        permanent:   false,
      },
    ];
  },

  // ── Deneysel özellikler ────────────────────────────────────
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
