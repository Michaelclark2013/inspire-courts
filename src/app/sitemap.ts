import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://inspirecourtsaz.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tournaments`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/scores`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/facility`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/gameday`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/prep`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/teams`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/training`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/media`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/schedule`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/book`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/camps`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/open-gym`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // Dynamic tournament pages
  let tournamentPages: MetadataRoute.Sitemap = [];
  try {
    const tournaments = await db
      .select({
        id: schema.tournaments.id,
        updatedAt: schema.tournaments.updatedAt,
      })
      .from(schema.tournaments);

    tournamentPages = tournaments.map((t) => ({
      url: `${base}/tournaments/${t.id}`,
      lastModified: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // If DB is unavailable, skip dynamic pages gracefully
  }

  return [...staticPages, ...tournamentPages];
}
