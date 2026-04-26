import type { Metadata } from "next";
import { UserCheck, UsersRound, Trophy } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import PlayersSheetClient from "@/components/admin/PlayersSheetClient";

export const metadata: Metadata = { title: "Players | Inspire Courts AZ" };

import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import { formatDateShort } from "@/lib/utils";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentRegistrations,
  checkins,
} from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";

export const revalidate = 60;

// Same two-section treatment as the Teams page:
//   Top: players checked in for the active/upcoming tournament (from the
//        DB checkins table, scoped to teams registered for that tourney)
//   Bottom: full historical player-check-in log from Google Sheets
async function loadTournamentPlayers(): Promise<{
  activeTournament: { id: number; name: string; status: string } | null;
  recentCheckins: Array<{
    id: number;
    playerName: string;
    teamName: string;
    division: string | null;
    type: string;
    timestamp: string;
  }>;
}> {
  try {
    const upcoming = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        startDate: tournaments.startDate,
        status: tournaments.status,
      })
      .from(tournaments)
      .where(inArray(tournaments.status, ["active", "published"]))
      .orderBy(desc(tournaments.startDate))
      .limit(1);

    if (upcoming.length === 0) return { activeTournament: null, recentCheckins: [] };
    const active = upcoming[0];

    // Scope check-ins to teams registered for this tournament — gives
    // the "who's actually here for the weekend" view rather than every
    // walk-in we've ever had.
    const regs = await db
      .select({ teamName: tournamentRegistrations.teamName })
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.tournamentId, [active.id]));
    const teamNames = regs.map((r) => r.teamName).filter(Boolean);

    if (teamNames.length === 0) {
      return {
        activeTournament: { id: active.id, name: active.name, status: active.status },
        recentCheckins: [],
      };
    }

    // Only last 7 days of check-ins — keeps the section small.
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const rows = await db
      .select({
        id: checkins.id,
        playerName: checkins.playerName,
        teamName: checkins.teamName,
        division: checkins.division,
        type: checkins.type,
        timestamp: checkins.timestamp,
      })
      .from(checkins)
      .where(inArray(checkins.teamName, teamNames))
      .orderBy(desc(checkins.timestamp))
      .limit(200);
    const recent = rows.filter((r) => r.timestamp >= weekAgo);

    return {
      activeTournament: { id: active.id, name: active.name, status: active.status },
      recentCheckins: recent,
    };
  } catch {
    return { activeTournament: null, recentCheckins: [] };
  }
}

export default async function PlayersPage() {
  const { activeTournament, recentCheckins } = await loadTournamentPlayers();

  // Sheets is optional. When unconfigured the page renders with the
  // tournament-scoped DB check-ins (loaded above) and empty Sheets
  // history so the admin can still see who's checked in today.
  const { rows } = isGoogleConfigured()
    ? await fetchSheetWithHeaders(SHEETS.playerCheckIn)
    : { rows: [] as Record<string, string>[] };

  const PLAYER_COLS = ["Player Name", "Player", "First Name", "Full Name", "Name"];
  const LAST_COLS = ["Last Name", "Last"];
  const PARENT_COLS = ["Parent Name", "Parent", "Guardian", "Parent/Guardian"];
  const TEAM_COLS = ["Team", "Team Name", "Club", "Organization"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Grade", "Level"];
  const PHONE_COLS = ["Phone", "Parent Phone", "Cell", "Contact Phone", "Phone Number"];
  const EMAIL_COLS = ["Email", "Parent Email", "Contact Email"];
  const DATE_COLS = ["Timestamp", "Check-In Date", "Date", "Time"];

  const players = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const firstName = getCol(row, ...PLAYER_COLS);
      const lastName = getCol(row, ...LAST_COLS);
      const name = lastName ? `${firstName} ${lastName}`.trim() : firstName || "—";
      const rawDate = getCol(row, ...DATE_COLS);
      return {
        name,
        parent: getCol(row, ...PARENT_COLS) || "—",
        team: getCol(row, ...TEAM_COLS) || "—",
        division: getCol(row, ...DIV_COLS) || "—",
        phone: getCol(row, ...PHONE_COLS) || "—",
        email: getCol(row, ...EMAIL_COLS) || "—",
        date: rawDate
          ? (() => { try { return formatDateShort(rawDate); } catch { return rawDate; } })()
          : "—",
      };
    });

  // Division breakdown chart
  const divCounts: Record<string, number> = {};
  players.forEach((p) => { divCounts[p.division] = (divCounts[p.division] || 0) + 1; });
  const divData = Object.entries(divCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  // Team breakdown
  const teamCounts: Record<string, number> = {};
  players.forEach((p) => { if (p.team !== "—") teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  const teamData = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <PageHeader
        title="Players"
        subtitle={`${players.length} players checked in`}
        icon={UsersRound}
      />

      {/* Top section: check-ins from the active tournament */}
      <section className="mb-6 bg-white border border-border rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
              {activeTournament
                ? `This Weekend — ${activeTournament.name}`
                : "No active tournament"}
            </h2>
            <p className="text-xs text-text-secondary">
              {activeTournament
                ? `${recentCheckins.length} recent check-in${recentCheckins.length === 1 ? "" : "s"} (last 7 days)`
                : "Register teams to a tournament to see check-ins here"}
            </p>
          </div>
        </div>
        {activeTournament && recentCheckins.length > 0 ? (
          <>
            {/* Mobile: stacked cards */}
            <ul className="md:hidden space-y-2">
              {recentCheckins.slice(0, 25).map((c) => (
                <li
                  key={c.id}
                  className="bg-off-white border border-border rounded-xl p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy truncate">
                        {c.playerName}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {c.teamName}
                        {c.division ? ` · ${c.division}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-navy text-white flex-shrink-0">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary/80">
                    {(() => {
                      try { return formatDateShort(c.timestamp); }
                      catch { return c.timestamp.slice(0, 10); }
                    })()}
                  </p>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-text-secondary border-b border-border bg-white sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-2 py-2 font-semibold">Player</th>
                    <th className="text-left px-2 py-2 font-semibold">Team</th>
                    <th className="text-left px-2 py-2 font-semibold">Division</th>
                    <th className="text-left px-2 py-2 font-semibold">Type</th>
                    <th className="text-left px-2 py-2 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckins.slice(0, 25).map((c) => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-2 text-navy font-medium">{c.playerName}</td>
                      <td className="px-2 py-2 text-navy">{c.teamName}</td>
                      <td className="px-2 py-2 text-text-secondary">{c.division || "—"}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-off-white text-navy">
                          {c.type}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-text-secondary text-xs">
                        {(() => {
                          try { return formatDateShort(c.timestamp); }
                          catch { return c.timestamp.slice(0, 10); }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentCheckins.length > 25 && (
                <p className="text-[11px] text-text-secondary mt-2 text-right">
                  Showing 25 of {recentCheckins.length}.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-text-secondary text-sm text-center py-6">
            {activeTournament
              ? "No check-ins yet this week."
              : "Create a tournament and register teams to see active-weekend check-ins here."}
          </p>
        )}
      </section>

      {/* Bottom section: full master player-check-in database */}
      <div className="mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
          All Players Database
        </h2>
        <p className="text-text-secondary text-xs mt-0.5">
          Every player we&apos;ve ever checked in — full historical log from Google Sheets.
        </p>
      </div>
      <PlayersSheetClient players={players} divData={divData} teamData={teamData} />
    </div>
  );
}
