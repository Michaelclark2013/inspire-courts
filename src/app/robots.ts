import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  // Block list — same for every crawler. Listing all bots here so it's
  // easy to revoke a specific one later without restructuring.
  const disallow = [
    "/admin/", "/portal/", "/api/",
    "/login", "/register", "/forgot-password", "/reset-password",
    "/verify-email", "/offline",
    "/r/", // Branded short links — not content, just redirects.
    "/leave-a-review", // Campaign destination, not a search target.
    "/_next/static/", "/_next/image/",
  ];

  return {
    rules: [
      // Default rule covers Google, Bing, Yandex, DuckDuckGo, etc.
      { userAgent: "*", allow: "/", disallow },
      // Explicitly allow modern AI crawlers so our sport microsites,
      // tournament pages, and inquiry CTAs surface in AI search +
      // chat-driven discovery. Each gets the same disallow list as
      // the default so they can't crawl admin/portal/api surfaces.
      // Without an explicit allow, several of these (notably GPTBot,
      // ClaudeBot, Google-Extended) treat ambiguous robots as opt-out.
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "Claude-Web", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Perplexity-User", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      { userAgent: "Applebot-Extended", allow: "/", disallow },
      { userAgent: "CCBot", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
