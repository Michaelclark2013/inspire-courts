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

// POST /api/admin/checkin — check in a player (dual-write: DB + Sheets)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ["admin", "front_desk", "staff"];
  if (!session || !allowedRoles.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { playerName, teamName, division } = body;

  if (!playerName) {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  const userId = session.user.id ? Number(session.user.id) : null;

  // Write to DB (source of truth)
  await db.insert(checkins).values({
    playerName,
    teamName: teamName || "",
    division: division || null,
    type: "checkin",
    checkedInBy: userId && !isNaN(userId) ? userId : null,
  });

  // Fire-and-forget: write to Google Sheets
  if (isGoogleConfigured()) {
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/Phoenix",
    });
    appendSheetRow(SHEETS.playerCheckIn, "A:F", [
      sanitizeSheetRow([timestamp, playerName, teamName || "", division || "", "CHECKIN", session.user.name || ""]),
    ]).catch((err) => logger.warn("Failed to sync check-in to Google Sheets", { error: String(err) }));
  }

  return NextResponse.json({ success: true });
}
