import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  appendSheetRow,
  isGoogleConfigured,
  sanitizeSheetRow,
  SHEETS,
  DRIVE_FOLDERS,
  findOrCreateDriveFolder,
  createDriveDoc,
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
      sanitizeSheetRow([
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
        "WAIVER",
      ]),
    ]);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save waiver. Please try again." },
        { status: 500 }
      );
    }

    // Also save waiver as a Google Doc in Drive, organized by event
    const eventFolder = eventName || "General";
    const waiversFolderId = await findOrCreateDriveFolder(
      DRIVE_FOLDERS.waivers,
      "Waivers"
    );

    if (waiversFolderId) {
      const eventFolderId = await findOrCreateDriveFolder(
        waiversFolderId,
        eventFolder
      );

      if (eventFolderId) {
        const docTitle = `Waiver — ${playerName} (${timestamp})`;
        const docContent = [
          `INSPIRE COURTS AZ — PARTICIPATION WAIVER`,
          `═══════════════════════════════════════`,
          ``,
          `Event: ${eventName || "N/A"}`,
          `Date: ${timestamp}`,
          ``,
          `PLAYER INFORMATION`,
          `──────────────────`,
          `Player Name: ${playerName}`,
          ``,
          `PARENT / GUARDIAN`,
          `──────────────────`,
          `Name: ${parentName}`,
          `Email: ${parentEmail}`,
          `Phone: ${parentPhone || "N/A"}`,
          ``,
          `EMERGENCY CONTACT`,
          `──────────────────`,
          `Name: ${emergencyContact || "N/A"}`,
          `Phone: ${emergencyPhone || "N/A"}`,
          ``,
          `MEDICAL`,
          `──────────────────`,
          `Known Allergies: ${allergies || "None"}`,
          ``,
          `WAIVER AGREEMENT`,
          `──────────────────`,
          `I, the undersigned parent/guardian, hereby grant permission for the above-named player to participate in activities at Inspire Courts AZ. I understand that participation in basketball and athletic activities involves inherent risks. I agree to hold harmless Inspire Courts AZ, its staff, and affiliates from any claims arising from participation. I confirm that the player is in good physical condition and fit to participate.`,
          ``,
          `Agreed and submitted by: ${submittedBy || session.user.name || "Unknown"}`,
          `Submitted at: ${timestamp}`,
        ].join("\n");

        await createDriveDoc(eventFolderId, docTitle, docContent);
      }
    }
  }

  return NextResponse.json({ success: true });
}
