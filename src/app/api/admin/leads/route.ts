import { NextRequest, NextResponse } from "next/server";
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
//   ?status=New — filter by status (case-insensitive)
//   ?source=Chat Widget — filter by source (case-insensitive)
//   ?interest=Tournament — filter by interest (case-insensitive)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "prospects")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Surface data-source health instead of silently returning [].
  // Admin UIs that want a warning banner can check the
  // X-Data-Source header and/or the response body.
  if (!isGoogleConfigured()) {
    return NextResponse.json([], {
      headers: { "X-Data-Source": "unavailable", "X-Data-Source-Reason": "sheets-not-configured" },
    });
  }

  try {
    const { rows } = await fetchSheetWithHeaders(SHEETS.prospectPipeline);

    let leads = rows
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

    // Optional URL-param filters (case-insensitive exact match).
    const sp = request.nextUrl.searchParams;
    const statusFilter = sp.get("status")?.toLowerCase();
    const sourceFilter = sp.get("source")?.toLowerCase();
    const interestFilter = sp.get("interest")?.toLowerCase();
    if (statusFilter || sourceFilter || interestFilter) {
      leads = leads.filter(
        (l) =>
          (!statusFilter || l.status.toLowerCase() === statusFilter) &&
          (!sourceFilter || l.source.toLowerCase() === sourceFilter) &&
          (!interestFilter || l.interest.toLowerCase() === interestFilter)
      );
    }

    return NextResponse.json(leads, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        "X-Data-Source": "sheets",
      },
    });
  } catch (error) {
    // Sheets outage: return empty array with 503 + source header so the
    // admin UI can show a "Sheets unavailable" banner rather than silently
    // display zero leads as if there genuinely are none.
    logger.error("Failed to fetch leads from Google Sheets", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch leads from Google Sheets", source: "sheets", items: [] },
      {
        status: 503,
        headers: { "X-Data-Source": "unavailable", "X-Data-Source-Reason": "sheets-error" },
      }
    );
  }
}
