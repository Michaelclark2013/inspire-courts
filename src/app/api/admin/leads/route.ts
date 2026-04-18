import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

// GET /api/admin/leads — read prospect pipeline from Google Sheets
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "prospects")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const { rows } = await fetchSheetWithHeaders(SHEETS.prospectPipeline);

    const leads = rows
      .filter((row) => Object.values(row).some((v) => v !== ""))
      .map((row) => ({
        timestamp: getCol(row, "Timestamp", "Date", "Created", "Time") || "",
        name: getCol(row, "Name", "Full Name", "Contact Name") || "",
        email: getCol(row, "Email", "Email Address") || "",
        phone: getCol(row, "Phone", "Phone Number", "Mobile") || "",
        interest: getCol(row, "Interest", "Role", "Subject", "Topic") || "",
        source: getCol(row, "Source", "Lead Source", "Origin") || "",
        status: getCol(row, "Status", "Lead Status", "Urgency") || "",
      }))
      .reverse(); // newest first

    return NextResponse.json(leads, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    logger.error("Failed to fetch leads from Google Sheets", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
