import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://inspirecourts.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
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
  ];
}
