import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  members,
  users,
  players,
  teams,
  tournaments,
  tournamentRegistrations,
  checkins,
  waivers,
  pushSubscriptions,
  rosterAttestations,
  rosterChangeRequests,
  inquiries,
  invoices,
  conversationParticipants,
} from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { apiError } from "@/lib/api-helpers";

// GET /api/admin/connections?kind=member|team|player|user&id=N
//
// One endpoint, one rendered card. Pulls together every related row
// for an entity so admins/coaches/parents don't bounce between five
// different pages to see the full picture. Used by the Connections
// card on member/team/player/user detail pages (admin) AND the
// /portal/players/[id] page (parent + coach).
//
// Authorization is per-kind:
//   - admin / staff / front_desk: any kind, any id
//   - coach: their own team (kind=team) + their team's players
//     (kind=player) + their own user record (kind=user)
//   - parent: their children (kind=player) + their own user record
//
// Each kind returns a different JSON shape since the relevant
// connections differ by entity.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return apiError("Unauthorized", 401);
  }
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind");
  const id = Number(sp.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return apiError("id required", 400);
  }

  const isStaff = role === "admin" || role === "staff" || role === "front_desk";
  // Per-kind authorization for non-staff roles.
  if (!isStaff) {
    if (kind === "member") return apiError("Forbidden", 403);
    if (kind === "user" && id !== userId) return apiError("Forbidden", 403);
    if (kind === "team") {
      const [own] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(and(eq(teams.id, id), eq(teams.coachUserId, userId)))
        .limit(1);
      if (!own) return apiError("Forbidden", 403);
    }
    if (kind === "player") {
      const [p] = await db
        .select({ parentUserId: players.parentUserId, teamId: players.teamId })
        .from(players)
        .where(eq(players.id, id))
        .limit(1);
      if (!p) return apiError("Player not found", 404);
      let allowed = role === "parent" && p.parentUserId === userId;
      if (!allowed && role === "coach" && p.teamId) {
        const [own] = await db
          .select({ id: teams.id })
          .from(teams)
          .where(and(eq(teams.id, p.teamId), eq(teams.coachUserId, userId)))
          .limit(1);
        allowed = !!own;
      }
      if (!allowed) return apiError("Forbidden", 403);
    }
  }

  switch (kind) {
    case "member":
      return NextResponse.json(await memberConnections(id));
    case "user":
      return NextResponse.json(await userConnections(id));
    case "team":
      return NextResponse.json(await teamConnections(id));
    case "player":
      return NextResponse.json(await playerConnections(id));
    default:
      return apiError("kind must be member|user|team|player", 400);
  }
}

async function memberConnections(memberId: number) {
  const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!m) return { error: "not_found" };

  // Linked user (portal account on same email).
  let user: { id: number; name: string; email: string; role: string } | null = null;
  if (m.userId) {
    const [u] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, m.userId))
      .limit(1);
    user = u || null;
  }

  // Children (players whose parentUserId matches this member's userId).
  let children: Array<{ id: number; name: string; teamId: number | null; jerseyNumber: string | null }> = [];
  if (m.userId) {
    children = await db
      .select({
        id: players.id,
        name: players.name,
        teamId: players.teamId,
        jerseyNumber: players.jerseyNumber,
      })
      .from(players)
      .where(eq(players.parentUserId, m.userId));
  }

  // Recent waivers under same name (waivers don't FK to members today).
  const lastName = m.lastName || "";
  const firstName = m.firstName || "";
  const recentWaivers = await db
    .select({
      id: waivers.id,
      playerName: waivers.playerName,
      signedAt: waivers.signedAt,
      expiresAt: waivers.expiresAt,
    })
    .from(waivers)
    .where(sql`${waivers.email} = ${(m.email || "").toLowerCase()} OR ${waivers.parentName} LIKE ${`%${firstName}%${lastName}%`}`)
    .orderBy(desc(waivers.signedAt))
    .limit(5);

  // Recent invoices.
  const recentInvoices = await db
    .select({
      id: invoices.id,
      amountCents: invoices.amountCents,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(eq(invoices.memberId, memberId))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  // Push subscriptions linked to user.
  let pushSubsCount = 0;
  if (m.userId) {
    const subs = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, String(m.userId)));
    pushSubsCount = subs.length;
  }

  // DM threads they're in.
  let dmThreadCount = 0;
  if (m.userId) {
    const t = await db
      .select({ id: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, m.userId));
    dmThreadCount = t.length;
  }

  return {
    summary: {
      hasUserAccount: !!user,
      childrenCount: children.length,
      waivers: recentWaivers.length,
      invoices: recentInvoices.length,
      pushSubs: pushSubsCount,
      dmThreads: dmThreadCount,
    },
    user,
    children,
    recentWaivers,
    recentInvoices,
  };
}

async function userConnections(userId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { error: "not_found" };

  // Linked member rows.
  const memberRows = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      status: members.status,
    })
    .from(members)
    .where(eq(members.userId, userId));

  // Coached teams.
  const coachTeams = await db
    .select({ id: teams.id, name: teams.name, division: teams.division })
    .from(teams)
    .where(eq(teams.coachUserId, userId));

  // Children (players where they're parent).
  const children = await db
    .select({ id: players.id, name: players.name, teamId: players.teamId })
    .from(players)
    .where(eq(players.parentUserId, userId));

  // Push subs.
  const subs = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, String(userId)));

  return {
    summary: {
      members: memberRows.length,
      coachTeams: coachTeams.length,
      children: children.length,
      pushSubs: subs.length,
    },
    members: memberRows,
    coachTeams,
    children,
  };
}

async function teamConnections(teamId: number) {
  const [t] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!t) return { error: "not_found" };

  // Roster.
  const roster = await db
    .select({
      id: players.id,
      name: players.name,
      jerseyNumber: players.jerseyNumber,
      waiverOnFile: players.waiverOnFile,
    })
    .from(players)
    .where(eq(players.teamId, teamId));

  // Tournaments registered (FK or string-name fallback).
  const regs = await db
    .select({
      id: tournamentRegistrations.id,
      tournamentId: tournamentRegistrations.tournamentId,
      status: tournamentRegistrations.status,
      paymentStatus: tournamentRegistrations.paymentStatus,
      tournamentName: tournaments.name,
      startDate: tournaments.startDate,
    })
    .from(tournamentRegistrations)
    .leftJoin(tournaments, eq(tournaments.id, tournamentRegistrations.tournamentId))
    .where(
      sql`${tournamentRegistrations.teamId} = ${teamId} OR lower(${tournamentRegistrations.teamName}) = ${t.name.toLowerCase()}`,
    )
    .orderBy(desc(tournaments.startDate))
    .limit(20);

  // Recent attestations.
  const attestations = await db
    .select({
      id: rosterAttestations.id,
      tournamentId: rosterAttestations.tournamentId,
      signedByName: rosterAttestations.signedByName,
      attestedAt: rosterAttestations.attestedAt,
    })
    .from(rosterAttestations)
    .where(eq(rosterAttestations.teamId, teamId))
    .orderBy(desc(rosterAttestations.attestedAt))
    .limit(10);

  // Pending change requests.
  const changeRequests = await db
    .select({
      id: rosterChangeRequests.id,
      kind: rosterChangeRequests.kind,
      status: rosterChangeRequests.status,
      createdAt: rosterChangeRequests.createdAt,
    })
    .from(rosterChangeRequests)
    .where(
      and(eq(rosterChangeRequests.teamId, teamId), eq(rosterChangeRequests.status, "pending")),
    )
    .limit(10);

  // Recent check-ins (last 20).
  const recentCheckins = await db
    .select({
      id: checkins.id,
      playerName: checkins.playerName,
      timestamp: checkins.timestamp,
      isLate: checkins.isLate,
      tournamentId: checkins.tournamentId,
    })
    .from(checkins)
    .where(sql`lower(${checkins.teamName}) = ${t.name.toLowerCase()}`)
    .orderBy(desc(checkins.timestamp))
    .limit(20);

  return {
    summary: {
      rosterSize: roster.length,
      waiversOnFile: roster.filter((p) => p.waiverOnFile).length,
      tournamentsRegistered: regs.length,
      pendingChangeRequests: changeRequests.length,
      recentCheckins: recentCheckins.length,
    },
    team: { id: t.id, name: t.name, division: t.division, coachUserId: t.coachUserId },
    roster,
    tournaments: regs,
    attestations,
    changeRequests,
    recentCheckins,
  };
}

async function playerConnections(playerId: number) {
  const [p] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!p) return { error: "not_found" };

  let parent: { id: number; name: string; email: string } | null = null;
  if (p.parentUserId) {
    const [u] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, p.parentUserId))
      .limit(1);
    parent = u || null;
  }

  let team: { id: number; name: string; division: string | null } | null = null;
  if (p.teamId) {
    const [t] = await db
      .select({ id: teams.id, name: teams.name, division: teams.division })
      .from(teams)
      .where(eq(teams.id, p.teamId))
      .limit(1);
    team = t || null;
  }

  // Check-in history.
  const checkinRows = await db
    .select({
      id: checkins.id,
      timestamp: checkins.timestamp,
      tournamentId: checkins.tournamentId,
      tournamentName: tournaments.name,
      isLate: checkins.isLate,
      source: checkins.source,
    })
    .from(checkins)
    .leftJoin(tournaments, eq(tournaments.id, checkins.tournamentId))
    .where(eq(checkins.playerId, playerId))
    .orderBy(desc(checkins.timestamp))
    .limit(20);

  // Waivers under same name.
  const playerWaivers = await db
    .select({
      id: waivers.id,
      signedAt: waivers.signedAt,
      expiresAt: waivers.expiresAt,
    })
    .from(waivers)
    .where(sql`lower(${waivers.playerName}) = ${p.name.toLowerCase()}`)
    .orderBy(desc(waivers.signedAt))
    .limit(5);

  return {
    summary: {
      hasParent: !!parent,
      hasTeam: !!team,
      checkins: checkinRows.length,
      tournaments: new Set(checkinRows.map((c) => c.tournamentId).filter(Boolean)).size,
      waivers: playerWaivers.length,
    },
    player: {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      division: p.division,
      birthDate: p.birthDate,
      grade: p.grade,
      photoUrl: p.photoUrl,
      waiverOnFile: p.waiverOnFile,
      nfcUid: p.nfcUid,
    },
    parent,
    team,
    checkins: checkinRows,
    waivers: playerWaivers,
  };
}
