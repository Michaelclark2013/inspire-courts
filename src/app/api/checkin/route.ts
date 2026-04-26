import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordCheckin, type CheckinSource } from "@/lib/checkin";
import { recordAudit } from "@/lib/audit";

// POST /api/checkin
// Unified single-player check-in for any role. Body:
//   { playerId?, playerName?, teamName, division?, tournamentId?,
//     source: "qr"|"coach"|"admin"|"kiosk", acceptIneligible?: bool }
//
// Roles allowed: admin, staff, front_desk, coach, parent.
// Eligibility / late-flag / dup-detection live in lib/checkin.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = ["admin", "staff", "front_desk", "coach", "parent"];
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const playerName = typeof body.playerName === "string" ? body.playerName : undefined;
  const teamName = typeof body.teamName === "string" ? body.teamName : "";
  const division = typeof body.division === "string" ? body.division : null;
  const playerIdRaw = Number(body.playerId);
  const tournamentIdRaw = Number(body.tournamentId);
  const source = (typeof body.source === "string" ? body.source : "qr") as CheckinSource;
  // Only admin/staff/front_desk can override ineligibility.
  const acceptIneligible =
    body.acceptIneligible === true &&
    ["admin", "staff", "front_desk"].includes(role);

  const userId = Number(session.user.id);
  const result = await recordCheckin({
    playerId: Number.isFinite(playerIdRaw) && playerIdRaw > 0 ? playerIdRaw : null,
    playerName,
    teamName,
    division,
    tournamentId: Number.isFinite(tournamentIdRaw) && tournamentIdRaw > 0 ? tournamentIdRaw : null,
    source,
    checkedInBy: Number.isFinite(userId) ? userId : null,
    acceptIneligible,
  });

  if (!result.ok) {
    const status = result.code === "ineligible" ? 409 : 400;
    return NextResponse.json(result, { status });
  }

  // Best-effort audit log — don't block on failure.
  recordAudit({
    session,
    request: req,
    action: result.alreadyCheckedIn ? "checkin.duplicate" : "checkin.recorded",
    entityType: "checkin",
    entityId: result.checkinId,
    after: { teamName, playerName: playerName || "(via id)", source, isLate: result.isLate },
  }).catch(() => {});

  return NextResponse.json(result);
}
