import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";

// POST /api/portal/players/nfc-bind
// Body: { playerId, nfcUid }
// Coach binds an NFC tag UID to a player on their roster. UID is
// unique across players — re-binding to a new player clears the old
// binding.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["coach", "admin", "staff", "front_desk"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const playerId = Number(body.playerId);
  const nfcUid = String(body.nfcUid || "").trim().toUpperCase();
  if (!Number.isFinite(playerId) || !nfcUid || nfcUid.length < 4) {
    return NextResponse.json({ error: "playerId + nfcUid required" }, { status: 400 });
  }

  // Coaches can only rebind on their own team's players. Staff can
  // rebind anywhere.
  if (role === "coach") {
    const [own] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.coachUserId, userId))
      .limit(1);
    if (!own) return NextResponse.json({ error: "No team" }, { status: 403 });
    const [p] = await db
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.id, playerId), eq(players.teamId, own.id)))
      .limit(1);
    if (!p) return NextResponse.json({ error: "Player not on your team" }, { status: 403 });
  }

  // Clear any other player using this UID (UNIQUE constraint).
  await db
    .update(players)
    .set({ nfcUid: null })
    .where(and(eq(players.nfcUid, nfcUid), ne(players.id, playerId)));

  const [updated] = await db
    .update(players)
    .set({ nfcUid })
    .where(eq(players.id, playerId))
    .returning({ id: players.id, name: players.name, nfcUid: players.nfcUid });

  await recordAudit({
    session,
    request: req,
    action: "player.nfc_bound",
    entityType: "player",
    entityId: playerId,
    after: { nfcUid },
  });

  return NextResponse.json(updated);
}
