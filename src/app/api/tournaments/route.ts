import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentRegistrations,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// GET /api/tournaments — public tournament listing
export async function GET() {
  try {
    const allTournaments = await db
      .select()
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active", "completed"]))
      .orderBy(tournaments.startDate);

    const result = await Promise.all(
      allTournaments.map(async (t) => {
        const teams = await db
          .select()
          .from(tournamentTeams)
          .where(eq(tournamentTeams.tournamentId, t.id));

        const regs = await db
          .select()
          .from(tournamentRegistrations)
          .where(eq(tournamentRegistrations.tournamentId, t.id));

        return {
          id: t.id,
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
          location: t.location,
          format: t.format,
          status: t.status,
          divisions: t.divisions ? JSON.parse(t.divisions) : [],
          entryFee: t.entryFee,
          registrationOpen: t.registrationOpen,
          registrationDeadline: t.registrationDeadline,
          maxTeamsPerDivision: t.maxTeamsPerDivision,
          description: t.description,
          teamCount: teams.length,
          registrationCount: regs.length,
        };
      })
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("[api/tournaments] Failed to fetch tournaments:", err);
    return NextResponse.json([], { status: 500 });
  }
}
