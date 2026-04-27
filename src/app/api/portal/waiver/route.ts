import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireVerifiedEmail } from "@/lib/require-verified";
import { db } from "@/lib/db";
import { waivers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  appendSheetRow,
  isGoogleConfigured,
  sanitizeSheetRow,
  SHEETS,
  DRIVE_FOLDERS,
  findOrCreateDriveFolder,
  createDriveDoc,
} from "@/lib/google-sheets";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";

// GET /api/portal/waiver — returns whether the current user has a waiver on file.
// Used by the portal dashboard to drive the "Submit Waiver" registration step.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ submitted: false }, { status: 200 });
  }

  try {
    const rows = await db
      .select({ id: waivers.id })
      .from(waivers)
      .where(eq(waivers.email, session.user.email))
      .limit(1);
    return NextResponse.json(
      { submitted: rows.length > 0 },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ submitted: false });
  }
}

// POST /api/portal/waiver — submit a player waiver
// Waivers are saved to Google Sheets (playerCheckIn sheet) with full event + waiver data.
// Each row is tagged with the event name so they can be filtered/exported per event.
//
// Requires a verified email. Waivers are legal documents; we want the
// signer's email address to be provably theirs before we accept the
// signature and store it under their account.
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedEmail();
  if (guard.error) return guard.error;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
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
  } = body as Record<string, string | undefined>;

  if (!playerName || !parentName || !parentEmail) {
    return NextResponse.json(
      { error: "Player name, parent name, and email are required" },
      { status: 400 }
    );
  }

  // Validate field lengths to prevent oversized data in Sheets/Drive
  if (typeof playerName !== "string" || playerName.trim().length === 0 || playerName.length > 100) {
    return NextResponse.json({ error: "Player name must be 1–100 characters" }, { status: 400 });
  }
  if (typeof parentName !== "string" || parentName.trim().length === 0 || parentName.length > 100) {
    return NextResponse.json({ error: "Parent name must be 1–100 characters" }, { status: 400 });
  }
  if (typeof parentEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail) || parentEmail.length > 254) {
    return NextResponse.json({ error: "A valid parent email is required" }, { status: 400 });
  }
  if (parentPhone && (typeof parentPhone !== "string" || parentPhone.length > 30)) {
    return NextResponse.json({ error: "Parent phone must be 30 characters or less" }, { status: 400 });
  }
  if (emergencyContact && (typeof emergencyContact !== "string" || emergencyContact.length > 100)) {
    return NextResponse.json({ error: "Emergency contact must be 100 characters or less" }, { status: 400 });
  }
  if (emergencyPhone && (typeof emergencyPhone !== "string" || emergencyPhone.length > 30)) {
    return NextResponse.json({ error: "Emergency phone must be 30 characters or less" }, { status: 400 });
  }
  if (allergies && (typeof allergies !== "string" || allergies.length > 500)) {
    return NextResponse.json({ error: "Allergies must be 500 characters or less" }, { status: 400 });
  }
  if (eventName && (typeof eventName !== "string" || eventName.length > 200)) {
    return NextResponse.json({ error: "Event name must be 200 characters or less" }, { status: 400 });
  }

  // Use session identity for submittedBy — never trust client-supplied value
  const safeSubmittedBy = session.user.name || session.user.email || "Unknown";
  const timestamp = timestampAZ();

  // Always persist to database as the source of truth
  let dbWriteOk = false;
  try {
    await db.insert(waivers).values({
      playerName: playerName.trim(),
      parentName: parentName.trim(),
      email: parentEmail.trim().toLowerCase(),
      phone: parentPhone || null,
    });
    dbWriteOk = true;
    // Flip players.waiver_on_file for any roster row matching this
    // name — kills the "no waiver" chip on coach rosters.
    const { syncWaiverToPlayers } = await import("@/lib/waiver-sync");
    syncWaiverToPlayers(playerName).catch(() => {});
  } catch (err) {
    logger.warn("Waiver DB insert failed, falling back to Sheets", { error: String(err) });
  }

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
        safeSubmittedBy,
        "WAIVER",
      ]),
    ]);

    // If both DB AND Sheets failed, the waiver wasn't saved anywhere — return 500.
    if (!success && !dbWriteOk) {
      return NextResponse.json(
        { error: "Failed to save waiver. Please try again." },
        { status: 500 }
      );
    }

    // Also save waiver as a Google Doc in Drive, organized by event (non-blocking)
    try {
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
    } catch (err) {
      logger.warn("Drive doc creation failed (non-critical)", { error: String(err) });
    }
  }

  // If Sheets isn't configured and DB also failed, waiver was not saved.
  if (!dbWriteOk && !isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Failed to save waiver. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
