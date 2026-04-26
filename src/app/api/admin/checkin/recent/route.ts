import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkins, tournaments } from "@/lib/db/schema";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import { desc, eq } from "drizzle-orm";

// GET /api/admin/checkin/recent?tournamentId=N&limit=30
// Latest check-ins for the war-room "live feed" sidebar. Powers the
// rolling list ("Jordan Smith — Eagles — 9:08 — late") that staff
// scan to spot anomalies in real time.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !role || !canAccess(role, "checkin")) {
    return apiError("Unauthorized", 401);
  }
  const sp = req.nextUrl.searchParams;
  const tournamentIdRaw = Number(sp.get("tournamentId"));
  const limitRaw = Math.floor(Number(sp.get("limit")) || 30);
  const limit = Math.min(Math.max(limitRaw, 1), 100);

  const filters = [];
  if (Number.isFinite(tournamentIdRaw) && tournamentIdRaw > 0) {
    filters.push(eq(checkins.tournamentId, tournamentIdRaw));
  }

  const rows = await db
    .select({
      id: checkins.id,
      playerName: checkins.playerName,
      teamName: checkins.teamName,
      division: checkins.division,
      type: checkins.type,
      source: checkins.source,
      isLate: checkins.isLate,
      timestamp: checkins.timestamp,
      tournamentName: tournaments.name,
    })
    .from(checkins)
    .leftJoin(tournaments, eq(tournaments.id, checkins.tournamentId))
    .where(filters.length > 0 ? filters[0] : undefined)
    .orderBy(desc(checkins.timestamp))
    .limit(limit);

  return NextResponse.json({ checkins: rows });
}
