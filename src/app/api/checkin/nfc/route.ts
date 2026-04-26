import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { recordCheckin } from "@/lib/checkin";

// POST /api/checkin/nfc
// Body: { nfcUid, tournamentId }
// Looks up the player bound to this NFC UID and writes a check-in
// row. Used by the Web NFC reader on /checkin.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["admin", "staff", "front_desk", "coach"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const nfcUid = String(body.nfcUid || "").trim();
  const tournamentIdRaw = Number(body.tournamentId);
  const tournamentId =
    Number.isFinite(tournamentIdRaw) && tournamentIdRaw > 0 ? tournamentIdRaw : null;
  if (!nfcUid) {
    return NextResponse.json({ error: "nfcUid required" }, { status: 400 });
  }

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.nfcUid, nfcUid))
    .limit(1);
  if (!player) {
    return NextResponse.json({ error: "Tag not bound to a player" }, { status: 404 });
  }

  let teamName = "(unknown)";
  if (player.teamId) {
    const [t] = await db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, player.teamId))
      .limit(1);
    if (t) teamName = t.name;
  }

  const result = await recordCheckin({
    playerId: player.id,
    teamName,
    division: player.division,
    tournamentId,
    source: "kiosk",
    checkedInBy: userId,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ...result, player },
      { status: result.code === "ineligible" ? 409 : 400 },
    );
  }
  return NextResponse.json({ ...result, player });
}
