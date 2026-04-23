import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import TournamentClient from "./TournamentClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tournamentId = Number(id);
  let title = "Tournament | Inspire Courts AZ";
  let description = "Tournament details, divisions, schedule, and registration at Inspire Courts AZ.";

  if (Number.isInteger(tournamentId) && tournamentId > 0) {
    try {
      const [t] = await db
        .select({ name: tournaments.name, description: tournaments.description })
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1);
      if (t?.name) {
        title = `${t.name} | Inspire Courts AZ`;
        if (t.description) description = t.description.slice(0, 160);
      }
    } catch {
      // Fall back to generic metadata if the DB lookup fails — we don't want
      // metadata generation to break the page render.
    }
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

export default function Page() {
  return <TournamentClient />;
}
