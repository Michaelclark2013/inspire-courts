import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  rosterChangeRequests,
  teams,
  tournaments,
  players,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";

// GET /api/admin/roster-change-requests?status=pending
// All change requests across teams. Defaults to status=pending so
// admin sees the queue first.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") || "pending";

  const rows = await db
    .select({
      id: rosterChangeRequests.id,
      teamId: rosterChangeRequests.teamId,
      tournamentId: rosterChangeRequests.tournamentId,
      requestedBy: rosterChangeRequests.requestedBy,
      kind: rosterChangeRequests.kind,
      payloadJson: rosterChangeRequests.payloadJson,
      reason: rosterChangeRequests.reason,
      status: rosterChangeRequests.status,
      decidedBy: rosterChangeRequests.decidedBy,
      decidedAt: rosterChangeRequests.decidedAt,
      decisionNote: rosterChangeRequests.decisionNote,
      createdAt: rosterChangeRequests.createdAt,
      teamName: teams.name,
      tournamentName: tournaments.name,
    })
    .from(rosterChangeRequests)
    .leftJoin(teams, eq(teams.id, rosterChangeRequests.teamId))
    .leftJoin(tournaments, eq(tournaments.id, rosterChangeRequests.tournamentId))
    .where(eq(rosterChangeRequests.status, status as "pending" | "approved" | "rejected"))
    .orderBy(desc(rosterChangeRequests.createdAt))
    .limit(100);

  return NextResponse.json({ requests: rows });
}

// PATCH /api/admin/roster-change-requests
// Body: { id, decision: "approve" | "reject", note? }
// On approve, applies the requested mutation. On reject, just stamps.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const id = Number(body.id);
  const decisionRaw = String(body.decision || "");
  const decision = decisionRaw === "approve" ? "approved" : decisionRaw === "reject" ? "rejected" : null;
  if (!Number.isFinite(id) || !decision) {
    return apiError("id + decision required", 400);
  }

  const [existing] = await db
    .select()
    .from(rosterChangeRequests)
    .where(eq(rosterChangeRequests.id, id))
    .limit(1);
  if (!existing) return apiError("Not found", 404);
  if (existing.status !== "pending") {
    return apiError(`Already ${existing.status}`, 400);
  }

  // On approve, apply the mutation. Best-effort — if the apply
  // fails, the request stays pending so admin can retry.
  if (decision === "approved") {
    try {
      const payload = existing.payloadJson ? JSON.parse(existing.payloadJson) : {};
      if (existing.kind === "add" && payload?.name) {
        await db.insert(players).values({
          name: String(payload.name).slice(0, 100),
          teamId: existing.teamId,
          jerseyNumber: payload.jerseyNumber || null,
          division: payload.division || null,
          birthDate: payload.birthDate || null,
          grade: payload.grade || null,
        });
      } else if (existing.kind === "remove" && payload?.playerId) {
        await db
          .delete(players)
          .where(
            and(eq(players.id, Number(payload.playerId)), eq(players.teamId, existing.teamId)),
          );
      } else if (existing.kind === "edit" && payload?.playerId) {
        const updates: Record<string, unknown> = {};
        if (payload.name) updates.name = String(payload.name).slice(0, 100);
        if (payload.jerseyNumber !== undefined) updates.jerseyNumber = payload.jerseyNumber;
        if (payload.birthDate !== undefined) updates.birthDate = payload.birthDate;
        if (payload.grade !== undefined) updates.grade = payload.grade;
        if (Object.keys(updates).length > 0) {
          await db
            .update(players)
            .set(updates)
            .where(
              and(eq(players.id, Number(payload.playerId)), eq(players.teamId, existing.teamId)),
            );
        }
      }
      // "substitute" applies via /api/checkin/substitute (separate
      // flow); approval here just unlocks it.
    } catch (err) {
      logger.error("approving change request failed", { err: String(err), id });
      return apiError("Failed to apply change", 500);
    }
  }

  const [updated] = await db
    .update(rosterChangeRequests)
    .set({
      status: decision,
      decidedBy: Number(session.user.id),
      decidedAt: new Date().toISOString(),
      decisionNote: typeof body.note === "string" ? body.note.slice(0, 500) : null,
    })
    .where(eq(rosterChangeRequests.id, id))
    .returning();

  await recordAudit({
    session,
    request: req,
    action: `roster_change_request.${decision}`,
    entityType: "roster_change_request",
    entityId: id,
    before: { status: "pending" },
    after: { status: decision },
  });

  return NextResponse.json(updated);
}
