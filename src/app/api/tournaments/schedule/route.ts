import { NextResponse } from "next/server";
import { fetchTournamentSchedule, tournamentToEventData } from "@/lib/google-sheets";
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// GET /api/tournaments/schedule — public tournament schedule from Google Sheets
export async function GET(request: Request) {
  // Cap origin hits per IP. CDN handles most reads (s-maxage=300),
  // but Google Sheets has a daily quota and a single noisy script
  // could burn it.
  const ip = getClientIp(request);
  if (isRateLimited(`tournaments-schedule:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "30" } }
    );
  }

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
          // s-maxage controls CDN caching separately from the browser (max-age).
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    logger.error("Tournament schedule fetch failed", { error: String(err) });
    return NextResponse.json(
      {
        configured: true,
        headers: [],
        rows: [],
        tournaments: [],
        eventData: [],
        error: "Failed to fetch schedule",
      },
      {
        status: 500,
        // Never cache a transient error — forces retry on next request.
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
