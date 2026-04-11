import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, tournamentTeams, tournamentGames, games, gameScores } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

// GET /api/scores/tournaments — public list of active/published tournaments
export async function GET() {
  try {
    const activeTournaments = await db
      .select()
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active"]))
      .orderBy(desc(tournaments.startDate));

    const result = await Promise.all(
      activeTournaments.map(async (t) => {
        const teams = await db
          .select({ teamName: tournamentTeams.teamName })
          .from(tournamentTeams)
          .where(eq(tournamentTeams.tournamentId, t.id));

        const bracketEntries = await db
          .select({ gameId: tournamentGames.gameId })
          .from(tournamentGames)
          .where(eq(tournamentGames.tournamentId, t.id));

        // Get game statuses
        const bracketStatuses = await Promise.all(
          bracketEntries.map(async (bg) => {
            const [game] = await db
              .select({ status: games.status })
              .from(games)
              .where(eq(games.id, bg.gameId));
            return { status: game?.status || "scheduled" };
          })
        );

        return {
          id: t.id,
          name: t.name,
          startDate: t.startDate,
          location: t.location,
          format: t.format,
          status: t.status,
          teams,
          bracket: bracketStatuses,
        };
      })
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
