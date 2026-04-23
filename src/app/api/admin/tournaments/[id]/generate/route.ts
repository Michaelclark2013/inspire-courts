import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentGames,
  tournamentRegistrations,
  games,
} from "@/lib/db/schema";
import { eq  } from "drizzle-orm";
import { generateBracket, type TeamEntry, type ScheduleConfig } from "@/lib/tournament-engine";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/tournaments/[id]/generate — generate bracket + schedule
// POST /api/admin/tournaments/[id]/generate
//   ?dryRun=1   Run the bracket generator and return the computed slots
//               WITHOUT writing anything to the DB. Lets admins preview
//               byes and seedings before committing.
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";

  // Idempotency-Key guard — a double-click or retry on a flaky connection
  // would otherwise trigger two full bracket writes. Skip for dry runs.
  const idemKey = dryRun ? null : request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  try {
    // Get tournament
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId));

    if (!tournament) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (tournament.status !== "draft") {
      return NextResponse.json(
        { error: "Bracket can only be generated for draft tournaments" },
        { status: 400 }
      );
    }

    // Get teams — only include those with approved+paid registrations (or all if no registrations exist)
    const allTeams = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId))
      .orderBy(tournamentTeams.seed);

    // Check if registrations exist for this tournament
    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.tournamentId, tournamentId));

    let teams = allTeams;

    // If registrations exist, filter to only approved+paid/waived teams
    if (regs.length > 0) {
      const approvedTeamNames = new Set(
        regs
          .filter(
            (r) =>
              r.status === "approved" &&
              (r.paymentStatus === "paid" || r.paymentStatus === "waived")
          )
          .map((r) => r.teamName)
      );
      teams = allTeams.filter((t) => approvedTeamNames.has(t.teamName));
    }

    if (teams.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 approved/paid teams to generate bracket" },
        { status: 400 }
      );
    }

    const courts = tournament.courts ? JSON.parse(tournament.courts) : ["Court 1"];
    const startTime = new Date(tournament.startDate + "T09:00:00").toISOString();

    const teamEntries: TeamEntry[] = teams.map((t) => ({
      id: t.teamId ?? undefined,
      teamName: t.teamName,
      seed: t.seed ?? 999,
      division: t.division ?? undefined,
      poolGroup: t.poolGroup ?? undefined,
    }));

    const config: ScheduleConfig = {
      startTime,
      courts,
      gameLength: tournament.gameLength ?? 40,
      breakLength: tournament.breakLength ?? 10,
      division: undefined,
    };

    // Generate bracket
    const slots = generateBracket(
      tournament.format as "single_elim" | "double_elim" | "round_robin" | "pool_play",
      teamEntries,
      config
    );

    // Filter out byes and create games + tournament_games
    const realGames = slots.filter((s) => !s.isBye && s.awayTeam && s.awayTeam !== "");
    // Placeholder games for TBD matchups (future rounds)
    const tbdGames = slots.filter(
      (s) =>
        !s.isBye &&
        !realGames.includes(s) &&
        (s.homeTeam === "TBD" || s.awayTeam === "TBD")
    );

    // Dry-run: return the computed bracket shape without persisting. Lets
    // admins preview seedings/byes/matchups before committing. No DB writes
    // and no audit entry because nothing actually changed.
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        format: tournament.format,
        teamCount: teamEntries.length,
        gameCount: realGames.length + tbdGames.length,
        slots: [...realGames, ...tbdGames].map((s) => ({
          round: s.round,
          bracketPosition: s.bracketPosition,
          homeTeam: s.homeTeam,
          awayTeam: s.awayTeam,
          court: s.court,
          scheduledTime: s.scheduledTime,
          poolGroup: s.poolGroup ?? null,
        })),
      });
    }

    // All-or-nothing bracket write. Previously: dozens of separate writes
    // with no rollback — a mid-loop timeout would leave the tournament
    // with a half-built bracket AND status still = "draft". Now a
    // function-level timeout rolls the whole thing back.
    await db.transaction(async (tx) => {
      for (const slot of [...realGames, ...tbdGames]) {
        const [game] = await tx
          .insert(games)
          .values({
            homeTeam: slot.homeTeam,
            awayTeam: slot.awayTeam,
            division: config.division || null,
            court: slot.court,
            eventName: tournament.name,
            scheduledTime: slot.scheduledTime,
            status: "scheduled",
          })
          .returning();

        await tx.insert(tournamentGames).values({
          tournamentId,
          gameId: game.id,
          round: slot.round,
          bracketPosition: slot.bracketPosition,
          poolGroup: slot.poolGroup || null,
          winnerAdvancesTo: slot.winnerAdvancesTo,
          loserDropsTo: slot.loserDropsTo,
        });
      }

      await tx
        .update(tournaments)
        .set({ status: "published", updatedAt: new Date().toISOString() })
        .where(eq(tournaments.id, tournamentId));
    });

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}`);
    revalidatePath("/tournaments");

    await recordAudit({
      session,
      request,
      action: "tournament.bracket_generated",
      entityType: "tournament",
      entityId: tournamentId,
      before: null,
      after: {
        gamesCreated: realGames.length + tbdGames.length,
        teamCount: teamEntries.length,
        format: tournament.format,
      },
    });

    const responseBody = {
      success: true,
      gamesCreated: realGames.length + tbdGames.length,
    };
    storeIdempotent(session.user.id, idemKey, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    logger.error("Failed to generate bracket", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to generate bracket" }, { status: 500 });
  }
}
