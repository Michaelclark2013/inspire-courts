import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentRegistrations,
} from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// GET /api/tournaments — public tournament listing
export async function GET(request: Request) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  if (isRateLimited(ip + ":tournaments", 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "15" } }
    );
  }
  try {
    const allTournaments = await db
      .select()
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active", "completed"]))
      .orderBy(tournaments.startDate);

    if (allTournaments.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
      });
    }

    const ids = allTournaments.map((t) => t.id);

    // Batch counts in 2 queries instead of 2N
    const teamCounts = await db
      .select({
        tournamentId: tournamentTeams.tournamentId,
        count: sql<number>`count(*)`,
      })
      .from(tournamentTeams)
      .where(inArray(tournamentTeams.tournamentId, ids))
      .groupBy(tournamentTeams.tournamentId);

    const regCounts = await db
      .select({
        tournamentId: tournamentRegistrations.tournamentId,
        count: sql<number>`count(*)`,
      })
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.tournamentId, ids))
      .groupBy(tournamentRegistrations.tournamentId);

    const teamMap = new Map(teamCounts.map((r) => [r.tournamentId, r.count]));
    const regMap = new Map(regCounts.map((r) => [r.tournamentId, r.count]));

    const result = allTournaments.map((t) => ({
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
      teamCount: teamMap.get(t.id) ?? 0,
      registrationCount: regMap.get(t.id) ?? 0,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("[api/tournaments] Failed to fetch tournaments:", err);
    return NextResponse.json([], { status: 500 });
  }
}
