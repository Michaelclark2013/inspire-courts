import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/", "/portal/", "/api/",
          "/login", "/register", "/forgot-password", "/reset-password",
          "/verify-email", "/offline",
          "/r/", // Branded short links — not content, just redirects.
          "/leave-a-review", // Campaign destination, not a search target.
          "/_next/static/", "/_next/image/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
