import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  rosterChangeRequests,
  teams,
  tournaments,
  tournamentRegistrations,
} from "@/lib/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { isRosterLocked } from "@/lib/roster-conflicts";
import { logger } from "@/lib/logger";

// GET /api/portal/roster-change-requests
// Coach's own pending + recent change requests, newest first.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) return NextResponse.json({ requests: [] });

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);
  if (!team) return NextResponse.json({ requests: [] });

  const rows = await db
    .select()
    .from(rosterChangeRequests)
    .where(eq(rosterChangeRequests.teamId, team.id))
    .orderBy(desc(rosterChangeRequests.createdAt))
    .limit(20);
  return NextResponse.json({ requests: rows });
}

// POST /api/portal/roster-change-requests
// Coach files a change request after the lock window passes. Body:
//   { kind: "add"|"remove"|"edit"|"substitute",
//     payload: object, reason?: string, tournamentId?: number }
// Admin reviews via /admin/roster-change-requests.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: "Bad session" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const kindRaw = String(body.kind || "");
  const kind = (["add", "remove", "edit", "substitute"] as const).find((k) => k === kindRaw);
  if (!kind) {
    return NextResponse.json({ error: "kind must be add | remove | edit | substitute" }, { status: 400 });
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);
  if (!team) return NextResponse.json({ error: "No team assigned" }, { status: 404 });

  const tournamentId = Number(body.tournamentId);
  // Only allow filing when an upcoming tournament is locked. Surfaces
  // a clearer error than letting the row save and confusing admin.
  if (Number.isFinite(tournamentId) && tournamentId > 0) {
    const [t] = await db
      .select({
        startDate: tournaments.startDate,
        rosterLockHoursBefore: tournaments.rosterLockHoursBefore,
      })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);
    if (!t) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (!isRosterLocked(t.startDate, t.rosterLockHoursBefore || 24)) {
      return NextResponse.json(
        { error: "Roster isn't locked yet — edit directly via /portal/roster" },
        { status: 400 },
      );
    }
  }

  try {
    const [row] = await db
      .insert(rosterChangeRequests)
      .values({
        teamId: team.id,
        tournamentId: Number.isFinite(tournamentId) && tournamentId > 0 ? tournamentId : null,
        requestedBy: userId,
        kind,
        payloadJson: body.payload ? JSON.stringify(body.payload) : null,
        reason: typeof body.reason === "string" ? body.reason.slice(0, 500) : null,
      })
      .returning();
    await recordAudit({
      session,
      request: req,
      action: "roster_change_request.created",
      entityType: "roster_change_request",
      entityId: row.id,
      after: { teamId: team.id, kind },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    logger.error("change request insert failed", { err: String(err) });
    return NextResponse.json({ error: "Failed to file request" }, { status: 500 });
  }
}
