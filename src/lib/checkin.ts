// Unified check-in path. Used by:
//   /api/checkin                   — new self-service QR + portal flow
//   /api/portal/checkin            — coach legacy endpoint (delegates here)
//   /api/admin/checkin             — front desk endpoint (delegates here)
//
// One write path means consistent eligibility/late-flag/audit
// behavior across surfaces.

import { db } from "@/lib/db";
import {
  checkins,
  players,
  teams,
  tournaments,
  tournamentRegistrations,
  games,
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { checkEligibility } from "@/lib/eligibility";
import { logger } from "@/lib/logger";

export type CheckinSource = "qr" | "coach" | "admin" | "kiosk";

export type CheckinInput = {
  playerId?: number | null;     // FK — preferred
  playerName?: string;          // Fallback (walk-in, no roster row yet)
  teamName: string;
  division?: string | null;
  tournamentId?: number | null;
  type?: "checkin" | "waiver" | "no_show";
  source: CheckinSource;
  checkedInBy?: number | null;
  acceptIneligible?: boolean;   // Override flag for staff
};

export type CheckinResult = {
  ok: true;
  checkinId: number;
  isLate: boolean;
  eligibility?: ReturnType<typeof checkEligibility>;
  alreadyCheckedIn?: boolean;
};

export type CheckinError = {
  ok: false;
  code: "ineligible" | "duplicate" | "missing_team" | "db_error";
  message: string;
  eligibility?: ReturnType<typeof checkEligibility>;
};

/**
 * Was this team already checked in for this tournament today?
 * Idempotent guard — repeat scans don't double-write.
 */
async function findExistingCheckin(opts: {
  playerName: string;
  teamName: string;
  tournamentId: number | null;
  withinHoursBack: number;
}): Promise<{ id: number } | null> {
  const since = new Date(Date.now() - opts.withinHoursBack * 60 * 60 * 1000).toISOString();
  const conditions = [
    sql`lower(${checkins.playerName}) = ${opts.playerName.toLowerCase()}`,
    sql`lower(${checkins.teamName}) = ${opts.teamName.toLowerCase()}`,
    gte(checkins.timestamp, since),
  ];
  if (opts.tournamentId != null) {
    conditions.push(eq(checkins.tournamentId, opts.tournamentId));
  }
  const [row] = await db
    .select({ id: checkins.id })
    .from(checkins)
    .where(and(...conditions))
    .limit(1);
  return row || null;
}

/**
 * Compute isLate by comparing now vs the team's first scheduled game
 * for the tournament day. Returns false if we can't determine the game.
 */
async function detectLate(opts: {
  teamName: string;
  tournamentId: number | null;
}): Promise<boolean> {
  if (!opts.tournamentId) return false;
  // Find the soonest game today involving this team (by team-name
  // string match — `games` doesn't carry tournamentId today, so we
  // scope by date window).
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  try {
    const rows = await db
      .select({
        scheduledTime: games.scheduledTime,
        homeTeam: games.homeTeam,
        awayTeam: games.awayTeam,
      })
      .from(games)
      .where(
        and(
          gte(games.scheduledTime, startOfDay.toISOString()),
          lte(games.scheduledTime, endOfDay.toISOString()),
        ),
      )
      .limit(50);
    const teamLower = opts.teamName.toLowerCase();
    const ownGames = rows.filter(
      (g) =>
        (g.homeTeam || "").toLowerCase() === teamLower ||
        (g.awayTeam || "").toLowerCase() === teamLower,
    );
    if (ownGames.length === 0) return false;
    const earliest = ownGames
      .map((g) => new Date(g.scheduledTime || ""))
      .filter((d) => Number.isFinite(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (!earliest) return false;
    return Date.now() > earliest.getTime();
  } catch (err) {
    logger.warn("late-flag detection failed", { err: String(err) });
    return false;
  }
}

/**
 * Write a single check-in row.
 *
 * Eligibility is enforced unless `acceptIneligible: true` (staff
 * override). Duplicate detection looks for an existing check-in for
 * the same player+team in the last 12h; on dup, returns
 * `alreadyCheckedIn: true` instead of writing.
 */
export async function recordCheckin(input: CheckinInput): Promise<CheckinResult | CheckinError> {
  const teamName = (input.teamName || "").trim();
  if (!teamName) {
    return { ok: false, code: "missing_team", message: "Team name required" };
  }

  // Resolve player + team rows — players FK is preferred for history.
  let player: typeof players.$inferSelect | null = null;
  if (input.playerId) {
    const [p] = await db
      .select()
      .from(players)
      .where(eq(players.id, input.playerId))
      .limit(1);
    if (p) player = p;
  }
  const playerName = (player?.name || input.playerName || "").trim();
  if (!playerName) {
    return { ok: false, code: "missing_team", message: "Player name required" };
  }

  // Eligibility check — only if we have a player row + division.
  const division =
    input.division || player?.division || null;
  let eligibility: ReturnType<typeof checkEligibility> | undefined;
  if (player && division) {
    eligibility = checkEligibility({
      birthDate: player.birthDate,
      division,
    });
    if (!eligibility.eligible && !input.acceptIneligible) {
      return {
        ok: false,
        code: "ineligible",
        message: `Not eligible for ${division}: ${eligibility.reason}`,
        eligibility,
      };
    }
  }

  // Duplicate guard — same player+team within 12h. Most teams play
  // multiple games per tournament day; we don't want each game to
  // generate a new check-in.
  const existing = await findExistingCheckin({
    playerName,
    teamName,
    tournamentId: input.tournamentId ?? null,
    withinHoursBack: 12,
  });
  if (existing) {
    return {
      ok: true,
      checkinId: existing.id,
      isLate: false,
      eligibility,
      alreadyCheckedIn: true,
    };
  }

  const isLate = await detectLate({
    teamName,
    tournamentId: input.tournamentId ?? null,
  });

  try {
    const [row] = await db
      .insert(checkins)
      .values({
        playerName,
        teamName,
        division: division || undefined,
        playerId: player?.id ?? null,
        tournamentId: input.tournamentId ?? null,
        type: input.type ?? "checkin",
        source: input.source,
        checkedInBy: input.checkedInBy ?? null,
        isLate,
      })
      .returning();

    // Mirror to the linked tournament_registrations row so the admin
    // dashboard's "team checked in" indicator stays in sync. Best-effort.
    if (input.tournamentId) {
      try {
        await db
          .update(tournamentRegistrations)
          .set({ rosterSubmitted: true })
          .where(
            and(
              eq(tournamentRegistrations.tournamentId, input.tournamentId),
              sql`lower(${tournamentRegistrations.teamName}) = ${teamName.toLowerCase()}`,
            ),
          );
      } catch {
        /* non-fatal */
      }
    }

    return { ok: true, checkinId: row.id, isLate, eligibility };
  } catch (err) {
    logger.error("checkin write failed", { err: String(err) });
    return { ok: false, code: "db_error", message: "Failed to record check-in" };
  }
}

/**
 * Look up the team + tournament context for a QR scan. Validates
 * that the requesting user is authorized for this team:
 *   - admin/staff/front_desk: always
 *   - coach: only their own team
 *   - parent: only if their child is on the team
 */
export async function resolveCheckinContext(opts: {
  tournamentId: number;
  teamId?: number | null;
  teamName?: string | null;
  userId: number;
  role: string;
}): Promise<
  | {
      ok: true;
      tournament: { id: number; name: string; startDate: string };
      team: { id: number; name: string; division: string | null };
      authorized: true;
    }
  | { ok: false; reason: string }
> {
  const [t] = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      startDate: tournaments.startDate,
    })
    .from(tournaments)
    .where(eq(tournaments.id, opts.tournamentId))
    .limit(1);
  if (!t) return { ok: false, reason: "Tournament not found" };

  let team: { id: number; name: string; division: string | null } | null = null;
  if (opts.teamId) {
    const [row] = await db
      .select({ id: teams.id, name: teams.name, division: teams.division })
      .from(teams)
      .where(eq(teams.id, opts.teamId))
      .limit(1);
    team = row || null;
  } else if (opts.teamName) {
    const [row] = await db
      .select({ id: teams.id, name: teams.name, division: teams.division })
      .from(teams)
      .where(sql`lower(${teams.name}) = ${opts.teamName.toLowerCase()}`)
      .limit(1);
    team = row || null;
  }
  if (!team) return { ok: false, reason: "Team not found" };

  const role = opts.role;
  if (role === "admin" || role === "staff" || role === "front_desk") {
    return { ok: true, tournament: t, team, authorized: true };
  }
  if (role === "coach") {
    const [own] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.id, team.id), eq(teams.coachUserId, opts.userId)))
      .limit(1);
    if (!own) return { ok: false, reason: "Not your team" };
    return { ok: true, tournament: t, team, authorized: true };
  }
  if (role === "parent") {
    const [child] = await db
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.teamId, team.id), eq(players.parentUserId, opts.userId)))
      .limit(1);
    if (!child) return { ok: false, reason: "No child on this team" };
    return { ok: true, tournament: t, team, authorized: true };
  }
  return { ok: false, reason: "Role not allowed to check in" };
}

// ── Geofencing ────────────────────────────────────────────────────
// Soft check — if env vars are configured and the caller is on a
// device with geolocation, we warn (not block) when they're outside
// the radius. The intent is to surface "are you actually at the
// gym?" not to block offsite check-ins (refs/coaches sometimes prep
// from off-site).

export type GymGeo = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

export function getGymGeo(): GymGeo | null {
  const lat = Number(process.env.GYM_LAT);
  const lng = Number(process.env.GYM_LNG);
  const radius = Number(process.env.GYM_GEOFENCE_METERS) || 250;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, radiusMeters: radius };
}

/** Haversine distance in meters between two lat/lng pairs. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}
