import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkins } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import {
  appendSheetRow,
  isGoogleConfigured,
  sanitizeSheetRow,
  SHEETS,
} from "@/lib/google-sheets";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";

const ALLOWED_ROLES = ["admin", "front_desk", "staff"];

// Escape a value for RFC-4180 CSV (always quoted).
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/admin/checkin — list check-ins (admin/front_desk/staff).
//   ?teamName=   filter by team (exact match)
//   ?division=   filter by division
//   ?since=      ISO date, checked-in on/after
//   ?until=      ISO date, checked-in on/before
//   ?format=csv  download CSV instead of JSON
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const teamName = sp.get("teamName");
  const division = sp.get("division");
  const since = sp.get("since");
  const until = sp.get("until");
  const format = sp.get("format");

  const filters: SQL[] = [];
  if (teamName) filters.push(eq(checkins.teamName, teamName));
  if (division) filters.push(eq(checkins.division, division));
  if (since) filters.push(gte(checkins.timestamp, since));
  if (until) filters.push(lte(checkins.timestamp, until));

  try {
    const rows = await db
      .select()
      .from(checkins)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(checkins.timestamp));

    if (format === "csv") {
      const header = ["id", "playerName", "teamName", "division", "type", "checkedInBy", "timestamp"];
      const lines = [
        header.map(csvCell).join(","),
        ...rows.map((r) =>
          [r.id, r.playerName, r.teamName, r.division, r.type, r.checkedInBy, r.timestamp]
            .map(csvCell)
            .join(",")
        ),
      ];
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="checkins-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
    });
  } catch (err) {
    logger.error("Failed to fetch check-ins", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}

// POST /api/admin/checkin — check in a player (dual-write: DB + Sheets)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { playerName, teamName, division, type } = body;

  if (!playerName || typeof playerName !== "string") {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  // type is either a regular check-in (default), a waiver submission record,
  // or an explicit no-show marker. Front desk uses "no_show" to clear
  // forfeit slots during a tournament rather than leaving them ambiguous.
  const VALID_TYPES = ["checkin", "waiver", "no_show"] as const;
  const safeType: (typeof VALID_TYPES)[number] =
    typeof type === "string" && (VALID_TYPES as readonly string[]).includes(type)
      ? (type as (typeof VALID_TYPES)[number])
      : "checkin";

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
      type: safeType,
      checkedInBy: userId && !isNaN(userId) ? userId : null,
    });
  } catch (err) {
    logger.error("Failed to insert check-in", { error: String(err) });
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }

  // Fire-and-forget: write to Google Sheets. Sheet marker mirrors type so
  // the spreadsheet view distinguishes check-ins from no-shows.
  if (isGoogleConfigured()) {
    const timestamp = timestampAZ();
    const sheetMarker = safeType === "no_show" ? "NO_SHOW" : safeType === "waiver" ? "WAIVER" : "CHECKIN";
    appendSheetRow(SHEETS.playerCheckIn, "A:F", [
      sanitizeSheetRow([timestamp, safeName, safeTeam, safeDivision || "", sheetMarker, session.user.name || ""]),
    ]).catch((err) => logger.warn("Failed to sync check-in to Google Sheets", { error: String(err) }));
  }

  return NextResponse.json({ success: true, type: safeType });
}
