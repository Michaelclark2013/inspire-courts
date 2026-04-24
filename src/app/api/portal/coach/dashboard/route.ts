import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  teams,
  players,
  tournaments,
  tournamentRegistrations,
  waivers,
} from "@/lib/db/schema";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { isProfileComplete } from "@/lib/profile-complete";

// GET /api/portal/coach/dashboard
//
// Aggregates everything a coach needs to see first when they log in:
//   - their profile-completion status
//   - any action-needed todos (roster count, waiver gaps, incomplete
//     profile, unverified email)
//   - their current tournament registrations + payment/status
//   - upcoming tournaments they can still register for
//   - missing waivers on their roster
//
// Heavy query by design — called once per portal load. Cache-Control
// set to private/no-store so stale data never leaks between coaches.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    // ── User row (for profile-complete + verification status) ────
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        birthDate: users.birthDate,
        emergencyContactName: users.emergencyContactName,
        emergencyContactPhone: users.emergencyContactPhone,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Coach's team + roster ────────────────────────────────────
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        division: teams.division,
      })
      .from(teams)
      .where(eq(teams.coachUserId, userId))
      .limit(1);

    let roster: Array<{
      id: number;
      name: string;
      jerseyNumber: string | null;
      division: string | null;
    }> = [];
    let playersWithoutWaiver = 0;
    if (team) {
      roster = await db
        .select({
          id: players.id,
          name: players.name,
          jerseyNumber: players.jerseyNumber,
          division: players.division,
        })
        .from(players)
        .where(eq(players.teamId, team.id));

      // Waiver coverage — simple lookup by player name + team.
      // Not perfect (name typos lose match) but good enough to surface
      // an approximate count; exact audit happens admin-side.
      if (roster.length > 0) {
        const signedRows = await db
          .select({ playerName: waivers.playerName })
          .from(waivers)
          .where(
            and(
              eq(waivers.teamName, team.name),
              inArray(
                waivers.playerName,
                roster.map((r) => r.name)
              )
            )
          );
        const signedSet = new Set(signedRows.map((r) => r.playerName));
        playersWithoutWaiver = roster.filter((r) => !signedSet.has(r.name)).length;
      }
    }

    // ── My tournament registrations ──────────────────────────────
    const myRegistrations = await db
      .select({
        id: tournamentRegistrations.id,
        tournamentId: tournamentRegistrations.tournamentId,
        teamName: tournamentRegistrations.teamName,
        division: tournamentRegistrations.division,
        status: tournamentRegistrations.status,
        paymentStatus: tournamentRegistrations.paymentStatus,
      })
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.coachEmail, user.email.toLowerCase()))
      .orderBy(desc(tournamentRegistrations.createdAt))
      .limit(20);

    // Join tournament name/date in a second query to keep the ORM simple.
    let myRegistrationsWithTournament: Array<
      (typeof myRegistrations)[number] & {
        tournamentName: string;
        startDate: string;
      }
    > = [];
    if (myRegistrations.length > 0) {
      const ids = myRegistrations.map((r) => r.tournamentId);
      const tourneys = await db
        .select({
          id: tournaments.id,
          name: tournaments.name,
          startDate: tournaments.startDate,
        })
        .from(tournaments)
        .where(inArray(tournaments.id, ids));
      const byId = new Map(tourneys.map((t) => [t.id, t]));
      myRegistrationsWithTournament = myRegistrations.map((r) => ({
        ...r,
        tournamentName: byId.get(r.tournamentId)?.name ?? "Tournament",
        startDate: byId.get(r.tournamentId)?.startDate ?? "",
      }));
    }

    // ── Upcoming tournaments open for registration ───────────────
    const todayIso = new Date().toISOString().slice(0, 10);
    const upcoming = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        startDate: tournaments.startDate,
        location: tournaments.location,
        entryFee: tournaments.entryFee,
        registrationOpen: tournaments.registrationOpen,
        registrationDeadline: tournaments.registrationDeadline,
      })
      .from(tournaments)
      .where(
        and(
          inArray(tournaments.status, ["published"]),
          gte(tournaments.startDate, todayIso),
          eq(tournaments.registrationOpen, true)
        )
      )
      .orderBy(tournaments.startDate)
      .limit(10);

    const registeredSet = new Set(myRegistrations.map((r) => r.tournamentId));
    const upcomingOpen = upcoming.filter((t) => !registeredSet.has(t.id));

    // ── Todos derived from the above ─────────────────────────────
    const todos: Array<{
      id: string;
      label: string;
      detail: string;
      priority: "high" | "medium" | "low";
      cta?: { href: string; label: string };
    }> = [];

    if (!user.emailVerifiedAt) {
      todos.push({
        id: "verify-email",
        label: "Verify your email",
        detail: "Open the verification link we sent, or use the banner to resend.",
        priority: "high",
        cta: { href: "/verify-email", label: "Open" },
      });
    }
    if (!isProfileComplete(user)) {
      todos.push({
        id: "complete-profile",
        label: "Complete your profile",
        detail: "Birth date + emergency contact are required for tournament eligibility.",
        priority: "high",
        cta: { href: "/portal/profile", label: "Edit profile" },
      });
    }
    if (!team) {
      todos.push({
        id: "no-team",
        label: "No team assigned yet",
        detail: "Admin assigns coaches to teams. Contact us if this is wrong.",
        priority: "medium",
      });
    } else if (roster.length === 0) {
      todos.push({
        id: "build-roster",
        label: "Build your roster",
        detail: `Add players to ${team.name} so the bracket can seed correctly.`,
        priority: "high",
        cta: { href: "/portal/roster", label: "Add players" },
      });
    } else if (playersWithoutWaiver > 0) {
      todos.push({
        id: "missing-waivers",
        label: `${playersWithoutWaiver} player${playersWithoutWaiver === 1 ? "" : "s"} missing a waiver`,
        detail: "Every player must sign a waiver before game day.",
        priority: "high",
        cta: { href: "/waiver", label: "Sign waivers" },
      });
    }
    for (const reg of myRegistrationsWithTournament) {
      if (reg.status === "approved" && reg.paymentStatus === "pending") {
        todos.push({
          id: `pay-${reg.id}`,
          label: `Pay for ${reg.tournamentName}`,
          detail: `${reg.teamName}${reg.division ? ` · ${reg.division}` : ""} — payment outstanding.`,
          priority: "high",
          cta: { href: `/tournaments/${reg.tournamentId}`, label: "Pay now" },
        });
      }
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileComplete: isProfileComplete(user),
          emailVerified: !!user.emailVerifiedAt,
        },
        team,
        roster,
        rosterStats: {
          size: roster.length,
          missingWaivers: playersWithoutWaiver,
        },
        todos,
        myRegistrations: myRegistrationsWithTournament,
        upcomingOpen,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("coach dashboard failed", { error: String(err) });
    return NextResponse.json(
      { error: "Could not load dashboard" },
      { status: 500 }
    );
  }
}
