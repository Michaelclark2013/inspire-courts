import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournaments,
  tournamentTeams,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { apiNotFound } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/registrations/[id]
//
// Single-registration lookup by primary key. Convenience endpoint for
// payment-dispute triage + audit-log investigation — previously callers
// had to know the tournamentId and page through the tournament-scoped
// registrations list.
//
// Returns the full registration row plus the linked tournament (name +
// status) and any tournament_teams row auto-created when the registration
// reached approved+paid — same shape the admin UI cares about.
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const regId = Number(id);
  if (!Number.isInteger(regId) || regId <= 0) {
    return NextResponse.json({ error: "Invalid registration id" }, { status: 400 });
  }

  try {
    // Column-scoped select — don't return any columns we don't need and
    // never will want in an admin UI (e.g. raw Square payment IDs stay
    // available if the admin loads the tournament-scoped list, but this
    // convenience endpoint focuses on what a human would audit).
    const [registration] = await db
      .select({
        id: tournamentRegistrations.id,
        tournamentId: tournamentRegistrations.tournamentId,
        teamName: tournamentRegistrations.teamName,
        coachName: tournamentRegistrations.coachName,
        coachEmail: tournamentRegistrations.coachEmail,
        coachPhone: tournamentRegistrations.coachPhone,
        division: tournamentRegistrations.division,
        playerCount: tournamentRegistrations.playerCount,
        entryFee: tournamentRegistrations.entryFee,
        paymentStatus: tournamentRegistrations.paymentStatus,
        status: tournamentRegistrations.status,
        rosterSubmitted: tournamentRegistrations.rosterSubmitted,
        waiversSigned: tournamentRegistrations.waiversSigned,
        notes: tournamentRegistrations.notes,
        squareOrderId: tournamentRegistrations.squareOrderId,
        createdAt: tournamentRegistrations.createdAt,
        updatedAt: tournamentRegistrations.updatedAt,
      })
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.id, regId))
      .limit(1);

    if (!registration) {
      return apiNotFound("Registration not found");
    }

    const [tournament] = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        status: tournaments.status,
        startDate: tournaments.startDate,
      })
      .from(tournaments)
      .where(eq(tournaments.id, registration.tournamentId))
      .limit(1);

    // Linked tournament_teams row (if the registration reached
    // approved + paid|waived and got auto-promoted to the bracket).
    const [teamEntry] = await db
      .select({
        id: tournamentTeams.id,
        teamName: tournamentTeams.teamName,
        seed: tournamentTeams.seed,
        poolGroup: tournamentTeams.poolGroup,
        eliminated: tournamentTeams.eliminated,
      })
      .from(tournamentTeams)
      .where(
        and(
          eq(tournamentTeams.tournamentId, registration.tournamentId),
          eq(tournamentTeams.teamName, registration.teamName)
        )
      )
      .limit(1);

    return NextResponse.json(
      {
        registration,
        tournament: tournament ?? null,
        teamEntry: teamEntry ?? null,
      },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("Failed to fetch registration detail", { regId, error: String(err) });
    return NextResponse.json({ error: "Failed to fetch registration" }, { status: 500 });
  }
}
