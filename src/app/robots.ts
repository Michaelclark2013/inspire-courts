import type { MetadataRoute } from "next";

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
          "/_next/static/", "/_next/image/",
        ],
      },
    ],
    sitemap: "https://inspirecourtsaz.com/sitemap.xml",
  };
}
