import type { Metadata } from "next";
import { cache } from "react";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import TournamentClient from "./TournamentClient";

// Dedupe the tournament fetch between generateMetadata and the page
// body — Next runs both in the same request, so React's cache() turns
// two queries into one.
const getTournament = cache(async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    const [t] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id))
      .limit(1);
    return t ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tournamentId = Number(id);
  let title = "Tournament | Inspire Courts AZ";
  let description = "Tournament details, divisions, schedule, and registration at Inspire Courts AZ.";

  const t = await getTournament(tournamentId);
  if (t?.name) {
    title = `${t.name} | Inspire Courts AZ`;
    if (t.description) description = t.description.slice(0, 160);
  }

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/tournaments/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tournaments/${id}`,
      images: [{ url: `${SITE_URL}/images/courts-bg.jpg`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournamentId = Number(id);

  // SportsEvent JSON-LD — emitted server-side so crawlers see it on
  // first paint. Cached lookup is shared with generateMetadata.
  const t = await getTournament(tournamentId);
  const jsonLd: object | null = t?.name
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: t.name,
        description: t.description || `${t.name} at Inspire Courts AZ`,
        url: `${SITE_URL}/tournaments/${tournamentId}`,
        startDate: t.startDate,
        endDate: t.endDate || t.startDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: "Inspire Courts AZ",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Gilbert",
            addressRegion: "AZ",
            addressCountry: "US",
          },
        },
        organizer: {
          "@type": "SportsOrganization",
          name: "Inspire Courts AZ",
          url: SITE_URL,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TournamentClient />
    </>
  );
}
