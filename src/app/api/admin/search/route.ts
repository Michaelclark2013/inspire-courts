import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  tournamentTeams,
  tournamentRegistrations,
  tournaments,
} from "@/lib/db/schema";
import { like, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { canAccess } from "@/lib/permissions";

// Global admin search across users, teams (tournament_teams), registrations,
// and tournaments. Each entity type returns up to PER_TYPE_LIMIT matches so
// a broad query can't dump the full DB.
const PER_TYPE_LIMIT = 5;

type SearchType = "users" | "teams" | "registrations" | "tournaments";
const ALL_TYPES: SearchType[] = ["users", "teams", "registrations", "tournaments"];

// GET /api/admin/search?q=&types=users,teams
//   q       required, min 2 chars
//   types   comma-separated subset of: users|teams|registrations|tournaments
//           (default: all)
// Response: { query, results: { users, teams, registrations, tournaments } }
// Only admin role — search results include PII (emails, phones).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "search")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Cap query length — no reason to LIKE against an unbounded string.
  const safeQ = q.slice(0, 100);
  const needle = `%${safeQ}%`;

  const requestedTypes = (sp.get("types") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SearchType => (ALL_TYPES as string[]).includes(s));
  const types: SearchType[] = requestedTypes.length > 0 ? requestedTypes : ALL_TYPES;

  try {
    // Run each fan-out query in parallel. Empty arrays for types not
    // requested — keeps response shape stable.
    const [userRows, teamRows, regRows, tournamentRows] = await Promise.all([
      types.includes("users")
        ? db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
            })
            .from(users)
            .where(or(like(users.name, needle), like(users.email, needle)))
            .limit(PER_TYPE_LIMIT)
        : Promise.resolve([]),
      types.includes("teams")
        ? db
            .select({
              id: tournamentTeams.id,
              teamName: tournamentTeams.teamName,
              division: tournamentTeams.division,
              tournamentId: tournamentTeams.tournamentId,
            })
            .from(tournamentTeams)
            .where(like(tournamentTeams.teamName, needle))
            .limit(PER_TYPE_LIMIT)
        : Promise.resolve([]),
      types.includes("registrations")
        ? db
            .select({
              id: tournamentRegistrations.id,
              teamName: tournamentRegistrations.teamName,
              coachName: tournamentRegistrations.coachName,
              coachEmail: tournamentRegistrations.coachEmail,
              tournamentId: tournamentRegistrations.tournamentId,
              status: tournamentRegistrations.status,
              paymentStatus: tournamentRegistrations.paymentStatus,
            })
            .from(tournamentRegistrations)
            .where(
              or(
                like(tournamentRegistrations.teamName, needle),
                like(tournamentRegistrations.coachName, needle),
                like(tournamentRegistrations.coachEmail, needle)
              )
            )
            .limit(PER_TYPE_LIMIT)
        : Promise.resolve([]),
      types.includes("tournaments")
        ? db
            .select({
              id: tournaments.id,
              name: tournaments.name,
              status: tournaments.status,
              startDate: tournaments.startDate,
            })
            .from(tournaments)
            .where(like(tournaments.name, needle))
            .limit(PER_TYPE_LIMIT)
        : Promise.resolve([]),
    ]);

    return NextResponse.json(
      {
        query: safeQ,
        results: {
          users: userRows,
          teams: teamRows,
          registrations: regRows,
          tournaments: tournamentRows,
        },
        totals: {
          users: userRows.length,
          teams: teamRows.length,
          registrations: regRows.length,
          tournaments: tournamentRows.length,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    logger.error("Admin search failed", { q: safeQ, error: String(err) });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

