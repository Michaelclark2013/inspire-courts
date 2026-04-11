import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  appendSheetRow,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

// POST /api/portal/waiver — submit a player waiver
// Waivers are saved to Google Sheets (playerCheckIn sheet) with full event + waiver data.
// Each row is tagged with the event name so they can be filtered/exported per event.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    playerName,
    parentName,
    parentEmail,
    parentPhone,
    emergencyContact,
    emergencyPhone,
    allergies,
    eventName,
    submittedBy,
  } = body;

  if (!playerName || !parentName || !parentEmail) {
    return NextResponse.json(
      { error: "Player name, parent name, and email are required" },
      { status: 400 }
    );
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/Phoenix",
  });

  if (isGoogleConfigured()) {
    // Append waiver data to the playerCheckIn sheet
    // Columns: Timestamp | Player Name | Parent Name | Parent Email | Parent Phone |
    //          Emergency Contact | Emergency Phone | Allergies | Event | Submitted By | Type
    const success = await appendSheetRow(SHEETS.playerCheckIn, "A:K", [
      [
        timestamp,
        playerName,
        parentName,
        parentEmail,
        parentPhone || "",
        emergencyContact || "",
        emergencyPhone || "",
        allergies || "None",
        eventName || "",
        submittedBy || session.user.name || "",
        "WAIVER", // Tag to identify waiver submissions vs regular check-ins
      ],
    ]);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save waiver. Please try again." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
