// Roster integrity checks — surface duplicate jersey numbers,
// duplicate names, and players who appear on multiple rosters across
// the same tournament. Run on register, on roster save, and at
// check-in so problems are caught early.

import { db } from "@/lib/db";
import { players, teams, tournamentRegistrations } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";

export type RosterConflict = {
  kind: "duplicate_jersey" | "duplicate_name" | "cross_team";
  message: string;
  playerIds: number[];
};

/**
 * Look for jersey-number collisions and same-name collisions within
 * a single team. Two players with the same jersey is a referee
 * problem; two with the same name is usually a copy-paste mistake.
 */
export async function findIntraTeamConflicts(teamId: number): Promise<RosterConflict[]> {
  const roster = await db
    .select({
      id: players.id,
      name: players.name,
      jerseyNumber: players.jerseyNumber,
    })
    .from(players)
    .where(eq(players.teamId, teamId));

  const conflicts: RosterConflict[] = [];

  // Jersey duplicates — group by trimmed jersey number, ignoring
  // empties.
  const byJersey = new Map<string, number[]>();
  for (const p of roster) {
    const j = (p.jerseyNumber || "").trim();
    if (!j) continue;
    if (!byJersey.has(j)) byJersey.set(j, []);
    byJersey.get(j)!.push(p.id);
  }
  for (const [jersey, ids] of byJersey) {
    if (ids.length >= 2) {
      conflicts.push({
        kind: "duplicate_jersey",
        message: `Jersey #${jersey} listed on ${ids.length} players`,
        playerIds: ids,
      });
    }
  }

  // Name duplicates — case-insensitive trim. Common when a coach
  // re-imports a roster on top of an existing one.
  const byName = new Map<string, number[]>();
  for (const p of roster) {
    const n = p.name.trim().toLowerCase();
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n)!.push(p.id);
  }
  for (const [name, ids] of byName) {
    if (ids.length >= 2) {
      conflicts.push({
        kind: "duplicate_name",
        message: `"${name}" appears ${ids.length} times`,
        playerIds: ids,
      });
    }
  }

  return conflicts;
}

/**
 * Find players appearing on more than one team registered for the
 * same tournament (anti-ringer / league integrity). Match on
 * lowercase trimmed name — DOB would be more reliable but isn't
 * required on every roster yet.
 */
export async function findCrossTeamConflicts(
  tournamentId: number,
  excludeTeamId?: number,
): Promise<RosterConflict[]> {
  // All teams registered for this tournament. Match team names from
  // tournamentRegistrations to teams.name to get team IDs.
  const regs = await db
    .select({ teamName: tournamentRegistrations.teamName })
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.tournamentId, tournamentId));
  if (regs.length === 0) return [];

  const teamRows = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);
  const registeredTeamIds = teamRows
    .filter((t) => regs.some((r) => r.teamName.toLowerCase() === t.name.toLowerCase()))
    .map((t) => t.id);
  if (registeredTeamIds.length === 0) return [];

  // All players on those teams. We don't push the IN clause through
  // drizzle inArray here because the small set + clearer code wins.
  const allPlayers = await db
    .select({
      id: players.id,
      name: players.name,
      teamId: players.teamId,
    })
    .from(players)
    .where(
      and(
        sql`${players.teamId} IN (${sql.join(registeredTeamIds.map((id) => sql`${id}`), sql`, `)})`,
        excludeTeamId ? ne(players.teamId, excludeTeamId) : sql`1=1`,
      ),
    );

  // Group by lowercase name → if same name appears on >1 distinct
  // team, flag it.
  const byName = new Map<string, { teamIds: Set<number>; ids: number[] }>();
  for (const p of allPlayers) {
    const n = p.name.trim().toLowerCase();
    if (!n) continue;
    const entry = byName.get(n) ?? { teamIds: new Set(), ids: [] };
    if (p.teamId != null) entry.teamIds.add(p.teamId);
    entry.ids.push(p.id);
    byName.set(n, entry);
  }
  const conflicts: RosterConflict[] = [];
  for (const [name, entry] of byName) {
    if (entry.teamIds.size >= 2) {
      conflicts.push({
        kind: "cross_team",
        message: `"${name}" is on ${entry.teamIds.size} different teams in this tournament`,
        playerIds: entry.ids,
      });
    }
  }
  return conflicts;
}

/**
 * Has the roster lock window passed? `tournament.startDate` minus
 * `rosterLockHoursBefore` hours. Returns true once we're inside the
 * lock window; coach edits then require admin approval.
 */
export function isRosterLocked(
  startDate: string,
  lockHoursBefore: number = 24,
  now: Date = new Date(),
): boolean {
  const start = new Date(startDate);
  if (!Number.isFinite(start.getTime())) return false;
  const lockMs = start.getTime() - lockHoursBefore * 60 * 60 * 1000;
  return now.getTime() >= lockMs;
}

/**
 * Hours until roster lock — useful for surfacing a countdown chip on
 * the coach portal. Negative means we're already locked.
 */
export function hoursUntilRosterLock(
  startDate: string,
  lockHoursBefore: number = 24,
  now: Date = new Date(),
): number | null {
  const start = new Date(startDate);
  if (!Number.isFinite(start.getTime())) return null;
  const lockMs = start.getTime() - lockHoursBefore * 60 * 60 * 1000;
  return (lockMs - now.getTime()) / (60 * 60 * 1000);
}
