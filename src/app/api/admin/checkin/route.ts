import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  appendSheetRow,
  isGoogleConfigured,
  sanitizeSheetRow,
  SHEETS,
} from "@/lib/google-sheets";

// POST /api/admin/checkin — check in a player
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ["admin", "front_desk", "staff"];
  if (!session || !allowedRoles.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { playerName, teamName, division } = body;

  if (!playerName) {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/Phoenix",
  });

  const success = await appendSheetRow(SHEETS.playerCheckIn, "A:D", [
    sanitizeSheetRow([timestamp, playerName, teamName || "", division || ""]),
  ]);

  if (!success) {
    return NextResponse.json(
      { error: "Failed to write to Google Sheets" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
