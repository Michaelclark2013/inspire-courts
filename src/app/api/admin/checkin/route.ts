import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkins } from "@/lib/db/schema";
import {
  appendSheetRow,
  isGoogleConfigured,
  sanitizeSheetRow,
  SHEETS,
} from "@/lib/google-sheets";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";

// POST /api/admin/checkin — check in a player (dual-write: DB + Sheets)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ["admin", "front_desk", "staff"];
  if (!session || !allowedRoles.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { playerName, teamName, division } = body;

  if (!playerName || typeof playerName !== "string") {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  // Sanitize and cap input lengths
  const safeName = String(playerName).trim().slice(0, 100);
  const safeTeam = teamName ? String(teamName).trim().slice(0, 100) : "";
  const safeDivision = division ? String(division).trim().slice(0, 50) : null;

  const userId = session.user.id ? Number(session.user.id) : null;

  try {
    // Write to DB (source of truth)
    await db.insert(checkins).values({
      playerName: safeName,
      teamName: safeTeam,
      division: safeDivision,
      type: "checkin",
      checkedInBy: userId && !isNaN(userId) ? userId : null,
    });
  } catch (err) {
    logger.error("Failed to insert check-in", { error: String(err) });
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }

  // Fire-and-forget: write to Google Sheets
  if (isGoogleConfigured()) {
    const timestamp = timestampAZ();
    appendSheetRow(SHEETS.playerCheckIn, "A:F", [
      sanitizeSheetRow([timestamp, safeName, safeTeam, safeDivision || "", "CHECKIN", session.user.name || ""]),
    ]).catch((err) => logger.warn("Failed to sync check-in to Google Sheets", { error: String(err) }));
  }

  return NextResponse.json({ success: true });
}
