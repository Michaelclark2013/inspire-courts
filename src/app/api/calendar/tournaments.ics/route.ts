import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { gte, asc, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { SITE_URL } from "@/lib/constants";

// GET /api/calendar/tournaments.ics
//
// Public iCal feed of upcoming tournaments. Travel-team coaches and
// tournament directors subscribe this URL in Apple/Google/Outlook
// calendar — every published event auto-syncs. Free distribution +
// loyalty hook because once they subscribe they stop having to check
// /tournaments manually.
//
// Notes:
// - Cancelled tournaments are excluded (we don't want phantom events
//   sitting in subscribers' calendars).
// - Past events are excluded (calendars don't need them and the file
//   stays small).
// - Each VEVENT carries a stable UID per tournament so updates replace
//   rather than duplicate. UID is `tournament-{id}@inspirecourtsaz.com`.

function fmtIcsDate(iso: string | null): string | null {
  if (!iso) return null;
  // Convert "2026-05-24" or "2026-05-24T...Z" to "20260524" (all-day) /
  // "20260524T080000Z" (timed). We treat tournament dates as all-day
  // since startDate is just YYYY-MM-DD; calendars render those nicely
  // in month view without a misleading 12am stamp.
  const ymd = iso.slice(0, 10).replace(/-/g, "");
  return /^\d{8}$/.test(ymd) ? ymd : null;
}

function escapeIcs(text: string): string {
  // RFC 5545 escaping: comma, semicolon, backslash, newline.
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545 line folding: max 75 octets; continuations begin with a space.
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + (i === 0 ? 75 : 74));
    out.push(i === 0 ? chunk : ` ${chunk}`);
    i += chunk.length;
  }
  return out.join("\r\n");
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        description: tournaments.description,
        startDate: tournaments.startDate,
        endDate: tournaments.endDate,
        status: tournaments.status,
      })
      .from(tournaments)
      // Only published / active tournaments make it into the public
      // calendar feed. Drafts are work-in-progress; completed ones
      // are history (and we already filter to startDate >= today).
      .where(
        and(
          inArray(tournaments.status, ["published", "active"]),
          gte(tournaments.startDate, today)
        )
      )
      .orderBy(asc(tournaments.startDate));

    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const events: string[] = [];
    for (const t of rows) {
      const start = fmtIcsDate(t.startDate);
      if (!start) continue;
      // ICS DTEND for all-day events is exclusive — i.e. a 1-day event
      // on May 24 needs DTEND May 25. Add 1 day to whatever the end is
      // (or to start if no end).
      const endRaw = t.endDate || t.startDate;
      const endIso = endRaw ? endRaw.slice(0, 10) : null;
      let dtend: string | null = null;
      if (endIso) {
        const d = new Date(`${endIso}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        dtend = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
      }

      const summary = `${t.name} — Inspire Courts AZ`;
      const description = t.description?.trim() || `Details + registration: ${SITE_URL}/tournaments/${t.id}`;
      const url = `${SITE_URL}/tournaments/${t.id}`;

      const lines = [
        "BEGIN:VEVENT",
        `UID:tournament-${t.id}@inspirecourtsaz.com`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        dtend ? `DTEND;VALUE=DATE:${dtend}` : "",
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        `URL:${url}`,
        "LOCATION:Inspire Courts AZ\\, Gilbert\\, AZ",
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      ].filter(Boolean) as string[];
      events.push(lines.map(foldLine).join("\r\n"));
    }

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Inspire Courts AZ//Tournaments//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Inspire Courts Tournaments",
      "X-WR-CALDESC:Upcoming tournaments at Inspire Courts AZ — Gilbert, Arizona",
      "X-WR-TIMEZONE:America/Phoenix",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="inspire-courts-tournaments.ics"',
        // Calendar clients refresh on their own schedule (typically every
        // few hours). 1-hour cache is plenty fresh while keeping the
        // lambda cold-start frequency low.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    logger.error("tournaments.ics failed", { error: String(err) });
    return new NextResponse("ICS generation failed", { status: 500 });
  }
}
