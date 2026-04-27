import { db } from "@/lib/db";
import { teams, teamAliases, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Single source of truth for "given a team name + coach contact info,
// what's the canonical teams.id?". Used by:
//   - tournament registration handler (public + admin)
//   - Google Form intake cron
//   - admin walk-in check-in
//
// Resolution order:
//   1. coachUserId match: coach email → users.id → teams.coachUserId
//   2. exact name match (case-insensitive)
//   3. alias match (case-insensitive)
//   4. create new + record the supplied name as the canonical alias
//
// "Possible duplicate" cases (multiple matches at step 2 or 3) return
// `ambiguous: true` so callers can prompt admin instead of guessing.

export type ResolvedTeam = {
  ok: true;
  teamId: number;
  team: { id: number; name: string; division: string | null; coachUserId: number | null };
  created: boolean;
  matchedBy: "coach_user_id" | "exact_name" | "alias" | "created";
};

export type AmbiguousTeam = {
  ok: false;
  ambiguous: true;
  candidates: Array<{ id: number; name: string; division: string | null }>;
  reason: string;
};

export type ResolveInput = {
  teamName: string;
  coachEmail?: string | null;
  coachName?: string | null;
  division?: string | null;
  source?: "registration" | "form" | "sheet" | "manual";
};

export async function resolveOrCreateTeam(
  input: ResolveInput,
): Promise<ResolvedTeam | AmbiguousTeam> {
  const teamName = (input.teamName || "").trim();
  if (!teamName) {
    return {
      ok: false,
      ambiguous: true,
      candidates: [],
      reason: "Team name required",
    };
  }
  const teamNameLower = teamName.toLowerCase();
  const source = input.source || "registration";

  // 1. Coach user match — most reliable. Coaches don't typically share
  //    email accounts.
  if (input.coachEmail) {
    const emailLower = input.coachEmail.trim().toLowerCase();
    if (emailLower.includes("@")) {
      const [coachUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${emailLower}`)
        .limit(1);
      if (coachUser) {
        const [coachsTeam] = await db
          .select()
          .from(teams)
          .where(eq(teams.coachUserId, coachUser.id))
          .limit(1);
        if (coachsTeam) {
          // Record the supplied name as an alias if it differs from
          // the canonical name.
          await maybeRecordAlias(coachsTeam.id, teamName, source);
          return {
            ok: true,
            teamId: coachsTeam.id,
            team: {
              id: coachsTeam.id,
              name: coachsTeam.name,
              division: coachsTeam.division,
              coachUserId: coachsTeam.coachUserId,
            },
            created: false,
            matchedBy: "coach_user_id",
          };
        }
      }
    }
  }

  // 2. Exact name match (case-insensitive). Fast common case.
  const exact = await db
    .select()
    .from(teams)
    .where(sql`lower(${teams.name}) = ${teamNameLower}`)
    .limit(2);
  if (exact.length === 1) {
    return {
      ok: true,
      teamId: exact[0].id,
      team: {
        id: exact[0].id,
        name: exact[0].name,
        division: exact[0].division,
        coachUserId: exact[0].coachUserId,
      },
      created: false,
      matchedBy: "exact_name",
    };
  }
  if (exact.length > 1) {
    return {
      ok: false,
      ambiguous: true,
      candidates: exact.map((t) => ({ id: t.id, name: t.name, division: t.division })),
      reason: `Multiple teams named "${teamName}". Pick one or create new.`,
    };
  }

  // 3. Alias match.
  const aliasMatches = await db
    .select({
      id: teams.id,
      name: teams.name,
      division: teams.division,
      coachUserId: teams.coachUserId,
    })
    .from(teamAliases)
    .innerJoin(teams, eq(teams.id, teamAliases.teamId))
    .where(sql`lower(${teamAliases.alias}) = ${teamNameLower}`)
    .limit(2);
  if (aliasMatches.length === 1) {
    return {
      ok: true,
      teamId: aliasMatches[0].id,
      team: aliasMatches[0],
      created: false,
      matchedBy: "alias",
    };
  }
  if (aliasMatches.length > 1) {
    return {
      ok: false,
      ambiguous: true,
      candidates: aliasMatches.map((t) => ({ id: t.id, name: t.name, division: t.division })),
      reason: `Alias "${teamName}" maps to multiple teams. Admin needs to merge.`,
    };
  }

  // 4. Create new + record the supplied name as the canonical alias.
  let coachUserId: number | null = null;
  if (input.coachEmail) {
    const emailLower = input.coachEmail.trim().toLowerCase();
    if (emailLower.includes("@")) {
      const [coachUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${emailLower}`)
        .limit(1);
      if (coachUser) coachUserId = coachUser.id;
    }
  }
  try {
    const [created] = await db
      .insert(teams)
      .values({
        name: teamName.slice(0, 200),
        division: input.division || null,
        coachUserId,
      })
      .returning();
    await db.insert(teamAliases).values({
      teamId: created.id,
      alias: teamName,
      source,
    });
    return {
      ok: true,
      teamId: created.id,
      team: {
        id: created.id,
        name: created.name,
        division: created.division,
        coachUserId: created.coachUserId,
      },
      created: true,
      matchedBy: "created",
    };
  } catch (err) {
    logger.error("team create failed", { err: String(err), teamName });
    return {
      ok: false,
      ambiguous: true,
      candidates: [],
      reason: `Failed to create team: ${(err as Error).message}`,
    };
  }
}

async function maybeRecordAlias(
  teamId: number,
  alias: string,
  source: "registration" | "form" | "sheet" | "manual",
): Promise<void> {
  const [team] = await db
    .select({ name: teams.name })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  if (!team) return;
  if (team.name.trim().toLowerCase() === alias.trim().toLowerCase()) return;
  // Skip if already aliased.
  const existing = await db
    .select({ id: teamAliases.id })
    .from(teamAliases)
    .where(
      sql`${teamAliases.teamId} = ${teamId} AND lower(${teamAliases.alias}) = ${alias.trim().toLowerCase()}`,
    )
    .limit(1);
  if (existing.length > 0) return;
  try {
    await db.insert(teamAliases).values({ teamId, alias, source });
  } catch (err) {
    logger.warn("alias insert failed (likely race)", { err: String(err) });
  }
}

/**
 * Backfill helper — walk every tournament_registrations row that
 * doesn't yet have team_id stamped and apply the resolver.
 *
 * Idempotent. Safe to run multiple times. Used by the one-shot
 * `/api/admin/maintenance/backfill-team-fks` endpoint and the
 * apply-migrations scaffold.
 */
export async function backfillRegistrationTeamIds(): Promise<{
  scanned: number;
  stamped: number;
  ambiguous: number;
}> {
  const { tournamentRegistrations } = await import("@/lib/db/schema");
  const rows = await db
    .select()
    .from(tournamentRegistrations)
    .where(sql`${tournamentRegistrations.teamId} IS NULL`);
  let stamped = 0;
  let ambiguous = 0;
  for (const r of rows) {
    const result = await resolveOrCreateTeam({
      teamName: r.teamName,
      coachEmail: r.coachEmail,
      coachName: r.coachName,
      division: r.division,
      source: "registration",
    });
    if (result.ok) {
      await db
        .update(tournamentRegistrations)
        .set({ teamId: result.teamId })
        .where(eq(tournamentRegistrations.id, r.id));
      stamped++;
    } else {
      ambiguous++;
      logger.warn("backfill ambiguous", { regId: r.id, reason: result.reason });
    }
  }
  return { scanned: rows.length, stamped, ambiguous };
}
