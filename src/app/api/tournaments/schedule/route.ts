import { NextResponse } from "next/server";
import { fetchTournamentSchedule, tournamentToEventData } from "@/lib/google-sheets";

// GET /api/tournaments/schedule — public tournament schedule from Google Sheets
export async function GET() {
  // Graceful fallback: if API key is not set, return empty data with a helpful flag
  if (!process.env.GOOGLE_SHEETS_API_KEY) {
    return NextResponse.json(
      { configured: false, headers: [], rows: [], tournaments: [], eventData: [] },
      {
        headers: { "Cache-Control": "public, max-age=60" },
      }
    );
  }

  try {
    const { headers, rows, tournaments } = await fetchTournamentSchedule();
    const eventData = tournaments.map(tournamentToEventData);
    return NextResponse.json(
      { configured: true, headers, rows, tournaments, eventData },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[api/tournaments/schedule] Error:", err);
    return NextResponse.json(
      {
        configured: true,
        headers: [],
        rows: [],
        tournaments: [],
        eventData: [],
        error: "Failed to fetch schedule",
      },
      { status: 500 }
    );
  }
}
