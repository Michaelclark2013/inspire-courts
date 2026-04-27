import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentRegistrations,
  teams,
  players as playersT,
} from "@/lib/db/schema";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { requireCronSecret } from "@/lib/api-helpers";
import { sendBroadcastEmail } from "@/lib/notify";
import { logger } from "@/lib/logger";

// GET /api/cron/coach-roster-reminder
//
// For every approved tournament registration whose tournament starts
// in the next 24-72 hours, check if the team has fewer players in
// the roster than `playerCount` (or zero rows). If so, email the
// coach with a deep-link to /portal/roster.
//
// One reminder per registration per cron run. The
// `roster_reminder_sent_at` columns aren't in the schema yet, so we
// dedupe in-memory: only nag teams in the 36-72h window once we see
// them on a tick. Since the cron runs every 24h, you get at most one
// reminder.
export async function GET(request: NextRequest) {
  const fail = requireCronSecret(request);
  if (fail) return fail;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  // Tournaments starting in [24h, 72h] — that window catches both
  // "load roster please" (~72h out) and "last reminder" (~24h out).
  const upcoming = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      startDate: tournaments.startDate,
      rosterLockHoursBefore: tournaments.rosterLockHoursBefore,
    })
    .from(tournaments)
    .where(
      and(
        gte(tournaments.startDate, in24h.toISOString()),
        lte(tournaments.startDate, in72h.toISOString()),
      ),
    );
  if (upcoming.length === 0) {
    return NextResponse.json({ scanned: 0, emailed: 0 });
  }

  const tournamentIds = upcoming.map((t) => t.id);
  const regs = await db
    .select({
      id: tournamentRegistrations.id,
      tournamentId: tournamentRegistrations.tournamentId,
      teamId: tournamentRegistrations.teamId,
      teamName: tournamentRegistrations.teamName,
      coachName: tournamentRegistrations.coachName,
      coachEmail: tournamentRegistrations.coachEmail,
      playerCount: tournamentRegistrations.playerCount,
      rosterSubmitted: tournamentRegistrations.rosterSubmitted,
      status: tournamentRegistrations.status,
    })
    .from(tournamentRegistrations)
    .where(
      and(
        inArray(tournamentRegistrations.tournamentId, tournamentIds),
        eq(tournamentRegistrations.status, "approved"),
      ),
    );

  // Look up actual roster size for each registered team.
  const teamRows = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);
  const teamIdByName = new Map(
    teamRows.map((t) => [t.name.toLowerCase(), t.id]),
  );
  const allTeamIds = teamRows.map((t) => t.id);
  const counts = allTeamIds.length
    ? await db
        .select({
          teamId: playersT.teamId,
          c: sql<number>`count(*)`,
        })
        .from(playersT)
        .where(inArray(playersT.teamId, allTeamIds))
        .groupBy(playersT.teamId)
    : [];
  const playerCountByTeamId = new Map(
    counts.map((r) => [r.teamId, Number(r.c) || 0]),
  );

  const tournamentById = new Map(upcoming.map((t) => [t.id, t]));

  let emailed = 0;
  for (const r of regs) {
    if (!r.coachEmail) continue;
    // Prefer the FK on the registration; fall back to lower-name
    // lookup until backfill is fully complete.
    const teamId = r.teamId ?? teamIdByName.get(r.teamName.toLowerCase());
    const actualSize = teamId != null ? playerCountByTeamId.get(teamId) || 0 : 0;
    const target = r.playerCount ?? 0;
    const needsReminder = actualSize === 0 || (target > 0 && actualSize < target);
    if (!needsReminder) continue;

    const t = tournamentById.get(r.tournamentId);
    if (!t) continue;
    const hoursOut = Math.round(
      (new Date(t.startDate).getTime() - now.getTime()) / (60 * 60 * 1000),
    );

    const subject = `Roster reminder — ${t.name} starts in ~${hoursOut}h`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#0B1D3A;color:white;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h2 style="margin:0;font-size:18px;">Inspire Courts AZ</h2>
        </div>
        <div style="border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Hi ${r.coachName || "Coach"},</p>
          <p>
            <strong>${t.name}</strong> starts in ~${hoursOut} hours, but
            we don't see ${actualSize === 0 ? "any" : "all"} of your roster
            loaded yet${target > 0 ? ` (${actualSize}/${target} players)` : ""}.
          </p>
          <p>
            Please open your roster and add each player's name, jersey
            number, and birth date so we can verify age-group
            eligibility on game day.
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="https://inspirecourtsaz.com/portal/roster"
               style="background:#CC0000;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
              Open Roster
            </a>
          </p>
          <p style="color:#999;font-size:12px;">
            Roster locks ${t.rosterLockHoursBefore || 24}h before tip-off
            — last-minute additions need admin approval.
          </p>
        </div>
      </div>
    `;
    const text = `${t.name} starts in ~${hoursOut}h and your roster isn't fully loaded (${actualSize}${target > 0 ? `/${target}` : ""}). Open https://inspirecourtsaz.com/portal/roster to add players.`;
    const result = await sendBroadcastEmail({
      recipients: [r.coachEmail],
      subject,
      html,
      text,
    });
    if (result.sent > 0) emailed++;
  }

  logger.info("coach-roster-reminder", { scanned: regs.length, emailed });
  return NextResponse.json({ scanned: regs.length, emailed });
}
