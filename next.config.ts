import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for its runtime scripts and style injection
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  // Images: self, data URIs, blob, and the SportNgin CDN used for court photos
  "img-src 'self' data: blob: https://cdn.sportngin.com https://cdn1.sportngin.com https://cdn4.sportngin.com https://*.instagram.com https://www.facebook.com https://www.google-analytics.com",
  // Iframes: Google Maps and YouTube embeds
  "frame-src https://www.google.com https://maps.google.com https://www.youtube.com https://quickscores.com",
  // API calls: Claude AI, Google Analytics, Facebook Pixel, and self
  "connect-src 'self' https://api.anthropic.com https://www.google-analytics.com https://www.googletagmanager.com https://*.facebook.com",
  "font-src 'self' data:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]
  .join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.instagram.com",
      },
      {
        protocol: "https",
        hostname: "cdn1.sportngin.com",
      },
      {
        protocol: "https",
        hostname: "cdn4.sportngin.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
    {
      source: "/admin-sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/admin" },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: ContentSecurityPolicy },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default nextConfig;
