/**
 * Generate an .ics calendar file and trigger download.
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO or YYYY-MM-DD
  endDate?: string; // ISO or YYYY-MM-DD
  url?: string;
}

function formatICSDate(dateStr: string): string {
  // Convert ISO or YYYY-MM-DD to ICS format: YYYYMMDD or YYYYMMDDTHHMMSSZ
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.replace(/[-:]/g, "").replace(/\.\d+/, "");
  // All-day event if no time component
  if (dateStr.length <= 10) {
    return dateStr.replace(/-/g, "");
  }
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateICS(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@inspirecourtsaz.com`;
  const dtStart = formatICSDate(event.startDate);
  const dtEnd = event.endDate ? formatICSDate(event.endDate) : dtStart;
  const isAllDay = event.startDate.length <= 10;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Inspire Courts//Tournament//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
  ];

  if (isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    // For all-day events, end date should be the next day
    const endDate = new Date(event.endDate || event.startDate);
    endDate.setDate(endDate.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${endDate.toISOString().slice(0, 10).replace(/-/g, "")}`);
  } else {
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
  }

  lines.push(`SUMMARY:${escapeICS(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(event: CalendarEvent) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
