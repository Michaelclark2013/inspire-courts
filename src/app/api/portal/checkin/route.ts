import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkins, teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  appendSheetRow,
  sanitizeSheetRow,
  SHEETS,
  isGoogleConfigured,
} from "@/lib/google-sheets";
import { logger } from "@/lib/logger";

// POST /api/portal/checkin — coach check-in for their team players
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["coach", "admin", "front_desk", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const playerName = typeof body.playerName === "string" ? body.playerName : "";
  const teamName = typeof body.teamName === "string" ? body.teamName : "";
  const division = typeof body.division === "string" ? body.division : null;

  if (!playerName) {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  const userId = session.user.id ? Number(session.user.id) : null;

  // Coach role: verify the team belongs to this coach — prevents a coach
  // from checking in players under another coach's team name.
  if (session.user.role === "coach" && teamName && userId) {
    try {
      const [ownedTeam] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.coachUserId, userId))
        .limit(1);
      const submittedTeam = String(teamName).trim();
      if (!ownedTeam || ownedTeam.name !== submittedTeam) {
        logger.warn("Coach attempted check-in for team they do not own", {
          userId,
          submittedTeam,
          ownedTeam: ownedTeam?.name,
        });
        return NextResponse.json(
          { error: "You can only check in players on your own team." },
          { status: 403 }
        );
      }
    } catch (err) {
      logger.error("Team ownership check failed", { error: String(err) });
      return NextResponse.json({ error: "Authorization check failed" }, { status: 500 });
    }
  }

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
      ]).catch((err) => logger.warn("Failed to sync portal check-in to Google Sheets", { error: String(err) }));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Don't log full playerName — just its length so we can debug sizing issues without logging PII.
    logger.error("Portal check-in failed", {
      error: String(err),
      playerNameLength: typeof playerName === "string" ? playerName.length : null,
    });
    return NextResponse.json({ error: "Failed to check in player" }, { status: 500 });
  }
}
