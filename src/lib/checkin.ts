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
  pushSubscriptions,
  users,
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { checkEligibility } from "@/lib/eligibility";
import { logger } from "@/lib/logger";
import { sendPushNotification, isVapidConfigured } from "@/lib/push-notifications";
import { sendSms } from "@/lib/sms";

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
 *
 * Multi-day tournament behavior: if a tournamentId is supplied, we
 * scope the lookup to (a) same tournament AND (b) same calendar day
 * in Phoenix time. That way day-2 of a weekend tournament generates
 * a fresh check-in row but day-1's repeat scan dedupes.
 */
async function findExistingCheckin(opts: {
  playerName: string;
  teamName: string;
  tournamentId: number | null;
  withinHoursBack: number;
}): Promise<{ id: number; sameDayTournament: boolean } | null> {
  if (opts.tournamentId != null) {
    // Day-scoped tournament dedupe.
    const startOfDayPhx = phoenixDayStart(new Date());
    const conditions = [
      sql`lower(${checkins.playerName}) = ${opts.playerName.toLowerCase()}`,
      eq(checkins.tournamentId, opts.tournamentId),
      gte(checkins.timestamp, startOfDayPhx),
    ];
    const [row] = await db
      .select({ id: checkins.id })
      .from(checkins)
      .where(and(...conditions))
      .limit(1);
    return row ? { id: row.id, sameDayTournament: true } : null;
  }
  // Legacy fallback — name+team within N hours.
  const since = new Date(Date.now() - opts.withinHoursBack * 60 * 60 * 1000).toISOString();
  const [row] = await db
    .select({ id: checkins.id })
    .from(checkins)
    .where(
      and(
        sql`lower(${checkins.playerName}) = ${opts.playerName.toLowerCase()}`,
        sql`lower(${checkins.teamName}) = ${opts.teamName.toLowerCase()}`,
        gte(checkins.timestamp, since),
      ),
    )
    .limit(1);
  return row ? { id: row.id, sameDayTournament: false } : null;
}

/** Start-of-today in Phoenix time as ISO. AZ doesn't observe DST so
 *  the offset is always -07:00. */
function phoenixDayStart(now: Date): string {
  const phxTzOffsetMs = -7 * 60 * 60 * 1000;
  const utcMs = now.getTime();
  const phxNow = new Date(utcMs + phxTzOffsetMs);
  // Floor to start of day, then map back to UTC.
  phxNow.setUTCHours(0, 0, 0, 0);
  return new Date(phxNow.getTime() - phxTzOffsetMs).toISOString();
}

/**
 * Returns true if the player already has a *prior-day* check-in for
 * this tournament (multi-day weekend events). Used by the UI to show
 * "Already checked in yesterday — tap to confirm presence today".
 */
export async function hasPriorTournamentCheckin(
  playerId: number,
  tournamentId: number,
): Promise<boolean> {
  const startOfTodayPhx = phoenixDayStart(new Date());
  const [row] = await db
    .select({ id: checkins.id })
    .from(checkins)
    .where(
      and(
        eq(checkins.playerId, playerId),
        eq(checkins.tournamentId, tournamentId),
        sql`${checkins.timestamp} < ${startOfTodayPhx}`,
      ),
    )
    .limit(1);
  return !!row;
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

    // Fire-and-forget: notify the parent on a fresh check-in. Skip
    // for walk-ins where the player has no parent FK yet.
    if (player?.parentUserId) {
      notifyParentCheckin({
        parentUserId: player.parentUserId,
        playerName,
        teamName,
        tournamentId: input.tournamentId ?? null,
        isLate,
      }).catch((e) => logger.warn("parent notify failed", { err: String(e) }));
    }

    return { ok: true, checkinId: row.id, isLate, eligibility };
  } catch (err) {
    logger.error("checkin write failed", { err: String(err) });
    return { ok: false, code: "db_error", message: "Failed to record check-in" };
  }
}

/**
 * Tell the parent their player just checked in. Web push first
 * (free, instant), SMS fallback (or in addition) when the parent
 * has a phone on file. Reads next-game info from `games` so the
 * message can include "Court 3, 9:15".
 *
 * Honors the same notification prefs the announcement push uses.
 * Best-effort — no thrown errors.
 */
async function notifyParentCheckin(opts: {
  parentUserId: number;
  playerName: string;
  teamName: string;
  tournamentId: number | null;
  isLate: boolean;
}): Promise<void> {
  // Pull the parent's contact + prefs.
  const [parent] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      prefsJson: users.notificationPrefsJson,
    })
    .from(users)
    .where(eq(users.id, opts.parentUserId))
    .limit(1);
  if (!parent) return;

  // Optional opt-out — push.checkins (or fallback push.announcements)
  // false means we don't send.
  let pushOk = true;
  let smsOk = true;
  if (parent.prefsJson) {
    try {
      const p = JSON.parse(parent.prefsJson) as {
        push?: { announcements?: boolean; checkins?: boolean };
        sms?: { checkins?: boolean };
      };
      if (p?.push?.checkins === false) pushOk = false;
      else if (p?.push?.announcements === false && p?.push?.checkins === undefined) pushOk = false;
      if (p?.sms?.checkins === false) smsOk = false;
    } catch {
      /* ignore malformed prefs */
    }
  }

  // Compose message — include next-game info if we can find it.
  let nextLine = "";
  if (opts.tournamentId) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      const dayGames = await db
        .select({
          home: games.homeTeam,
          away: games.awayTeam,
          court: games.court,
          scheduled: games.scheduledTime,
        })
        .from(games)
        .where(
          and(
            gte(games.scheduledTime, startOfDay.toISOString()),
            lte(games.scheduledTime, endOfDay.toISOString()),
          ),
        )
        .limit(50);
      const t = opts.teamName.toLowerCase();
      const upcoming = dayGames
        .filter((g) => (g.home || "").toLowerCase() === t || (g.away || "").toLowerCase() === t)
        .map((g) => ({
          ...g,
          ms: new Date(g.scheduled || "").getTime(),
        }))
        .filter((g) => Number.isFinite(g.ms) && g.ms >= Date.now())
        .sort((a, b) => a.ms - b.ms)[0];
      if (upcoming) {
        const time = new Date(upcoming.ms).toLocaleTimeString("en-US", {
          timeZone: "America/Phoenix",
          hour: "numeric",
          minute: "2-digit",
        });
        nextLine = upcoming.court ? ` Court ${upcoming.court}, ${time}.` : ` Game at ${time}.`;
      }
    } catch {
      /* games lookup is best-effort */
    }
  }

  const lateSuffix = opts.isLate ? " (late)" : "";
  const baseMsg = `${opts.playerName} is checked in${lateSuffix}.${nextLine}`;
  const title = `Inspire Courts · ${opts.teamName}`;

  // Web push to all of this user's subscribed devices.
  if (pushOk && isVapidConfigured()) {
    try {
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, String(parent.id)));
      for (const s of subs) {
        try {
          await sendPushNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            { title, body: baseMsg, url: `/portal` },
          );
        } catch (err) {
          logger.warn("checkin push failed", { err: String(err), subId: s.id });
        }
      }
    } catch (err) {
      logger.warn("checkin push lookup failed", { err: String(err) });
    }
  }

  // SMS fallback / parallel — sends to the parent's phone if present
  // and they haven't opted out. Doesn't block on push success.
  if (smsOk && parent.phone) {
    try {
      await sendSms({
        to: parent.phone,
        body: baseMsg,
        userId: parent.id,
      });
    } catch (err) {
      logger.warn("checkin sms failed", { err: String(err) });
    }
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
