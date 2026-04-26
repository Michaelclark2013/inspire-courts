import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gymEvents } from "@/lib/db/schema";
import { and, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/gym-events/ical?token=...
// Public-ish iCal feed so admins + staff can subscribe in Apple / Google
// Calendar. Gated by a query-string token (default: GYM_CAL_TOKEN env)
// so the URL can't be guessed. Set a calendar-specific token rather
// than sharing a session cookie because calendar apps only do GET.
//
// Subscribe via:  webcal://<host>/api/gym-events/ical?token=XXX
// iOS Calendar + Google Calendar both support webcal://.

function escapeICS(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

function toICSDate(iso: string): string {
  // YYYYMMDDTHHMMSSZ (UTC)
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const expected = process.env.GYM_CAL_TOKEN || process.env.NEXTAUTH_SECRET || "";
  if (!expected || token !== expected.slice(0, 32)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const startWindow = new Date(Date.now() - 7 * 864e5).toISOString();
    const rows = await db
      .select()
      .from(gymEvents)
      .where(and(gte(gymEvents.endAt, startWindow)))
      .limit(500);

    const now = toICSDate(new Date().toISOString());
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Inspire Courts//Gym Schedule//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Inspire Courts Gym",
      "X-WR-TIMEZONE:America/Phoenix",
    ];

    for (const e of rows) {
      const uid = `gymevent-${e.id}@inspirecourtsaz`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${toICSDate(e.startAt)}`,
        `DTEND:${toICSDate(e.endAt)}`,
        `SUMMARY:${escapeICS(`${e.title}${e.category ? ` [${e.category}]` : ""}`)}`,
        e.location ? `LOCATION:${escapeICS(e.location)}` : "",
        e.notes ? `DESCRIPTION:${escapeICS(e.notes)}` : "",
        `CATEGORIES:${escapeICS(e.category)}`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");

    const body = lines.filter(Boolean).join("\r\n");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Content-Disposition": 'inline; filename="inspire-courts.ics"',
      },
    });
  } catch (err) {
    logger.error("ical feed failed", { error: String(err) });
    return new NextResponse("Error", { status: 500 });
  }
}
