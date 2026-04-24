import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentGames,
  games,
  gameScores,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import {
  generateBracket,
  type TeamEntry,
  type ScheduleConfig,
} from "@/lib/tournament-engine";
import { safeJsonParse } from "@/lib/api-helpers";

// POST /api/admin/launch-readiness/regenerate-brackets
//
// Bulk action used once before public launch to fix tournaments generated
// before the 2026-11-24 bracket-seeding bug fix. Only touches brackets
// that are SAFE to regenerate (no live/final games). Tournaments with any
// played games are skipped — they need a manual migration because a
// regeneration would wipe real scores.
//
// Per tournament, in a single transaction:
//   1. Delete tournamentGames, gameScores (by gameId), games
//   2. Reset status to "draft"
//   3. Re-run generateBracket with the corrected seededPairings
//   4. Insert the new games + tournamentGames
//   5. Flip status back to "published"
//
// Returns a per-tournament result summary.

type RegenerateResult = {
  id: number;
  name: string;
  ok: boolean;
  gamesCreated?: number;
  error?: string;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: RegenerateResult[] = [];

  try {
    // 1. Find candidates — single_elim tournaments that are published/active.
    const candidates = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        format: tournaments.format,
        status: tournaments.status,
        startDate: tournaments.startDate,
        courts: tournaments.courts,
        gameLength: tournaments.gameLength,
        breakLength: tournaments.breakLength,
      })
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active"]));

    const singleElim = candidates.filter((t) => t.format === "single_elim");

    for (const t of singleElim) {
      try {
        // Safety check: skip if any game has been played. The reset path
        // below would delete game rows, losing the score history.
        const bracketEntries = await db
          .select({ gameId: tournamentGames.gameId })
          .from(tournamentGames)
          .where(eq(tournamentGames.tournamentId, t.id));

        const gameIds = bracketEntries.map((b) => b.gameId);

        if (gameIds.length > 0) {
          const existingGames = await db
            .select({ id: games.id, status: games.status })
            .from(games)
            .where(inArray(games.id, gameIds));
          const played = existingGames.filter(
            (g) => g.status === "live" || g.status === "final"
          );
          if (played.length > 0) {
            results.push({
              id: t.id,
              name: t.name,
              ok: false,
              error: `${played.length} game(s) already played — manual migration required.`,
            });
            continue;
          }
        }

        // Re-fetch teams (may have changed since last generation).
        const teamRows = await db
          .select()
          .from(tournamentTeams)
          .where(eq(tournamentTeams.tournamentId, t.id))
          .orderBy(tournamentTeams.seed);

        if (teamRows.length < 2) {
          results.push({
            id: t.id,
            name: t.name,
            ok: false,
            error: "Fewer than 2 teams — can't regenerate.",
          });
          continue;
        }

        const teamEntries: TeamEntry[] = teamRows.map((tm) => ({
          id: tm.teamId ?? undefined,
          teamName: tm.teamName,
          seed: tm.seed ?? 999,
          division: tm.division ?? undefined,
          poolGroup: tm.poolGroup ?? undefined,
        }));

        const courts = safeJsonParse<string[]>(t.courts, ["Court 1"]);
        const startTime = new Date(
          t.startDate + "T09:00:00-07:00"
        ).toISOString();

        const config: ScheduleConfig = {
          startTime,
          courts,
          gameLength: t.gameLength ?? 40,
          breakLength: t.breakLength ?? 10,
          division: undefined,
        };

        const slots = generateBracket("single_elim", teamEntries, config);
        const realGames = slots.filter(
          (s) => !s.isBye && s.awayTeam && s.awayTeam !== ""
        );
        const tbdGames = slots.filter(
          (s) =>
            !s.isBye &&
            !realGames.includes(s) &&
            (s.homeTeam === "TBD" || s.awayTeam === "TBD")
        );

        // Atomic teardown + rebuild so we never leave a tournament with
        // half an old bracket and half a new one.
        await db.transaction(async (tx) => {
          if (gameIds.length > 0) {
            await tx
              .delete(gameScores)
              .where(inArray(gameScores.gameId, gameIds));
            await tx
              .delete(tournamentGames)
              .where(eq(tournamentGames.tournamentId, t.id));
            await tx.delete(games).where(inArray(games.id, gameIds));
          }

          for (const slot of [...realGames, ...tbdGames]) {
            const [game] = await tx
              .insert(games)
              .values({
                homeTeam: slot.homeTeam,
                awayTeam: slot.awayTeam,
                division: null,
                court: slot.court,
                eventName: t.name,
                scheduledTime: slot.scheduledTime,
                status: "scheduled",
              })
              .returning();
            await tx.insert(tournamentGames).values({
              tournamentId: t.id,
              gameId: game.id,
              round: slot.round,
              bracketPosition: slot.bracketPosition,
              poolGroup: slot.poolGroup || null,
              winnerAdvancesTo: slot.winnerAdvancesTo,
              loserDropsTo: slot.loserDropsTo,
            });
          }

          // Status stays "published" — we don't want to unpublish and
          // hide the public tournament page from fans who already have
          // the URL. The bracket is simply updated in place.
        });

        await recordAudit({
          session,
          request,
          action: "tournament.bracket_regenerated_bulk",
          entityType: "tournament",
          entityId: t.id,
          before: { reason: "pre-launch seedings fix 4d4aebb" },
          after: {
            gamesCreated: realGames.length + tbdGames.length,
            teamCount: teamEntries.length,
          },
        });

        revalidatePath(`/admin/tournaments/${t.id}`);
        revalidatePath(`/tournaments/${t.id}`);

        results.push({
          id: t.id,
          name: t.name,
          ok: true,
          gamesCreated: realGames.length + tbdGames.length,
        });
      } catch (err) {
        logger.error("Bulk bracket regenerate failed for tournament", {
          tournamentId: t.id,
          error: String(err),
        });
        results.push({
          id: t.id,
          name: t.name,
          ok: false,
          error: String(err).slice(0, 200),
        });
      }
    }

    revalidatePath("/tournaments");
    revalidatePath("/admin/tournaments/manage");

    return NextResponse.json({
      attempted: results.length,
      succeeded: results.filter((r) => r.ok).length,
      skipped: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    logger.error("Bulk bracket regenerate endpoint failed", {
      error: String(err),
    });
    return NextResponse.json(
      { error: "Bulk regenerate failed", details: String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}
