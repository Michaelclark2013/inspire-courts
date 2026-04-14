import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkins } from "@/lib/db/schema";
import {
  appendSheetRow,
  sanitizeSheetRow,
  SHEETS,
  isGoogleConfigured,
} from "@/lib/google-sheets";

// POST /api/portal/checkin — coach check-in for their team players
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["coach", "admin", "front_desk", "staff"].includes(session.user.role || "")) {
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

  try {
    // Write to DB (source of truth)
    await db.insert(checkins).values({
      playerName: String(playerName).trim().slice(0, 100),
      teamName: teamName ? String(teamName).trim().slice(0, 100) : "",
      division: division || null,
      type: "checkin",
      checkedInBy: userId && !isNaN(userId) ? userId : null,
    });

    // Fire-and-forget: write to Google Sheets
    if (isGoogleConfigured()) {
      const timestamp = new Date().toISOString();
      appendSheetRow(SHEETS.playerCheckIn, "Sheet1!A:F", [
        sanitizeSheetRow([timestamp, playerName, teamName || "", division || "", "CHECKIN", session.user.name || ""]),
      ]).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to check in player" }, { status: 500 });
  }
}
