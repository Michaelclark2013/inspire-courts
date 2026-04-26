import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  rosterAttestations,
  players,
  teams,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { resolveCheckinContext } from "@/lib/checkin";
import { logger } from "@/lib/logger";

// GET /api/checkin/attestation?t=TID&team=TEAMID
// Returns the most recent attestation for this (team, tournament)
// pair if one exists. Used by the /checkin page to skip the prompt
// for coaches who already signed.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const tournamentId = Number(sp.get("t"));
  const teamId = Number(sp.get("team"));
  if (!Number.isFinite(tournamentId) || !Number.isFinite(teamId)) {
    return NextResponse.json({ error: "t + team required" }, { status: 400 });
  }
  const [row] = await db
    .select({
      id: rosterAttestations.id,
      signedByName: rosterAttestations.signedByName,
      attestedAt: rosterAttestations.attestedAt,
      signatureDataUrl: rosterAttestations.signatureDataUrl,
    })
    .from(rosterAttestations)
    .where(
      and(
        eq(rosterAttestations.tournamentId, tournamentId),
        eq(rosterAttestations.teamId, teamId),
      ),
    )
    .orderBy(desc(rosterAttestations.attestedAt))
    .limit(1);
  return NextResponse.json({ attestation: row || null });
}

// POST /api/checkin/attestation
// Body: { tournamentId, teamId, signedByName, signatureDataUrl? }
// Coaches only — and only for their own team. Snapshots the current
// roster IDs so a later edit can be reconciled against what was sworn to.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "coach" && role !== "admin") {
    return NextResponse.json({ error: "Coaches only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const tournamentId = Number(body.tournamentId);
  const teamId = Number(body.teamId);
  const signedByName = (typeof body.signedByName === "string" ? body.signedByName : "").trim();
  const sig = typeof body.signatureDataUrl === "string" ? body.signatureDataUrl : null;
  if (!Number.isFinite(tournamentId) || !Number.isFinite(teamId) || !signedByName) {
    return NextResponse.json({ error: "tournamentId + teamId + signedByName required" }, { status: 400 });
  }
  // Cap signature size — base64 photos blow up the row otherwise.
  if (sig && sig.length > 60_000) {
    return NextResponse.json({ error: "Signature too large" }, { status: 400 });
  }

  // Reuse the same authorization check as /api/checkin.
  const ctx = await resolveCheckinContext({
    tournamentId,
    teamId,
    userId,
    role,
  });
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.reason }, { status: 403 });
  }

  // Snapshot the roster.
  const roster = await db
    .select({ id: players.id, name: players.name, jerseyNumber: players.jerseyNumber })
    .from(players)
    .where(eq(players.teamId, teamId));
  // Also embed the team name for human-readable audit later.
  const [team] = await db
    .select({ name: teams.name })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  try {
    const [row] = await db
      .insert(rosterAttestations)
      .values({
        tournamentId,
        teamId,
        coachUserId: userId,
        signedByName: signedByName.slice(0, 100),
        signatureDataUrl: sig,
        rosterSnapshotJson: JSON.stringify({
          team: team?.name,
          roster,
        }),
      })
      .returning();

    await recordAudit({
      session,
      request: req,
      action: "checkin.attestation_signed",
      entityType: "roster_attestation",
      entityId: row.id,
      after: { tournamentId, teamId, signedByName, rosterSize: roster.length },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    logger.error("attestation insert failed", { err: String(err) });
    return NextResponse.json({ error: "Failed to record attestation" }, { status: 500 });
  }
}
