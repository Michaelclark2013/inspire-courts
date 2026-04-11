import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

// GET /api/admin/my-history?type=staff|ref&name=John
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (!["admin", "staff", "ref"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured()) {
    return NextResponse.json({ shifts: [] });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "staff";
  // Non-admin users can only view their own history
  const name = role === "admin"
    ? (searchParams.get("name") || session.user.name || "")
    : (session.user.name || "");

  const sheetId = type === "ref" ? SHEETS.refCheckOut : SHEETS.staffCheckOut;
  const { rows } = await fetchSheetWithHeaders(sheetId);

  const NAME_COLS = ["Name", "Staff Name", "Employee", "Worker", "Ref", "Referee", "Ref Name"];
  const DATE_COLS = ["Timestamp", "Date", "Check-Out Date", "Shift Date"];
  const HOURS_COLS = ["Hours", "Hours Worked", "Total Hours", "Time"];
  const EVENT_COLS = ["Event", "Event Name", "Tournament", "Game"];
  const NOTES_COLS = ["Notes", "Note", "Comments"];
  const AMOUNT_COLS = ["Amount", "Pay", "Total", "Earned", "$", "Payment"];

  // Filter rows where name matches (case-insensitive partial match)
  const nameLower = name.toLowerCase();
  const shifts = rows
    .filter((row) => {
      const rowName = getCol(row, ...NAME_COLS).toLowerCase();
      return rowName.includes(nameLower) || nameLower.includes(rowName);
    })
    .map((row) => {
      const rawDate = getCol(row, ...DATE_COLS);
      let date = rawDate;
      try {
        if (rawDate) {
          date = new Date(rawDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      } catch {
        // keep raw
      }

      return {
        date,
        name: getCol(row, ...NAME_COLS),
        hoursWorked: getCol(row, ...HOURS_COLS),
        event: getCol(row, ...EVENT_COLS),
        notes: getCol(row, ...NOTES_COLS),
        amount: getCol(row, ...AMOUNT_COLS),
      };
    })
    .reverse(); // Most recent first

  return NextResponse.json({ shifts });
}
