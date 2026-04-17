import type { Metadata } from "next";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tournamentId = Number(id);

  if (isNaN(tournamentId) || tournamentId <= 0) {
    return { title: `Tournament | ${SITE_NAME}` };
  }

  try {
    const [t] = await db
      .select({
        name: tournaments.name,
        startDate: tournaments.startDate,
        location: tournaments.location,
        divisions: tournaments.divisions,
      })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!t) {
      return { title: `Tournament Not Found | ${SITE_NAME}` };
    }

    const title = `${t.name} | ${SITE_NAME}`;
    const description = [
      "Tournament",
      t.divisions ? `for ${JSON.parse(t.divisions).join(", ")}` : "",
      t.startDate ? `on ${t.startDate}` : "",
      t.location ? `at ${t.location}` : "at Inspire Courts",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/tournaments/${id}`,
        siteName: SITE_NAME,
        type: "website",
        images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: t.name,
        description,
        images: ["/opengraph-image"],
      },
    };
  } catch {
    return { title: `Tournament | ${SITE_NAME}` };
  }
}

export default function TournamentDetailLayout({ children }: Props) {
  return children;
}
