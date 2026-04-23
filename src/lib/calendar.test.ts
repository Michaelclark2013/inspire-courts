import { describe, it, expect } from "vitest";
import { generateICS } from "./calendar";

describe("calendar / generateICS", () => {
  it("produces a valid VCALENDAR + VEVENT wrapper", () => {
    const ics = generateICS({
      title: "Test Event",
      startDate: "2026-05-01",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("VERSION:2.0");
  });

  it("uses CRLF line endings per RFC-5545", () => {
    const ics = generateICS({ title: "T", startDate: "2026-05-01" });
    expect(ics).toContain("\r\n");
    expect(ics.split("\r\n").length).toBeGreaterThan(5);
  });

  it("formats all-day events with DATE value and next-day DTEND", () => {
    const ics = generateICS({
      title: "All Day",
      startDate: "2026-05-01",
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20260501");
    // All-day DTEND is exclusive — next day.
    expect(ics).toContain("DTEND;VALUE=DATE:20260502");
  });

  it("formats timed events without DATE parameter", () => {
    const ics = generateICS({
      title: "Timed",
      startDate: "2026-05-01T14:30:00Z",
      endDate: "2026-05-01T16:00:00Z",
    });
    expect(ics).toMatch(/DTSTART:20260501T143000Z/);
    expect(ics).toMatch(/DTEND:20260501T160000Z/);
  });

  it("escapes special characters in description/location/title", () => {
    const ics = generateICS({
      title: "Cup, 2026",
      description: "Line1\nLine2; with semi",
      location: "Court, 1",
      startDate: "2026-05-01",
    });
    expect(ics).toContain("SUMMARY:Cup\\, 2026");
    expect(ics).toContain("DESCRIPTION:Line1\\nLine2\\; with semi");
    expect(ics).toContain("LOCATION:Court\\, 1");
  });

  it("includes URL when provided", () => {
    const ics = generateICS({
      title: "T",
      startDate: "2026-05-01",
      url: "https://inspirecourtsaz.com/tournaments/42",
    });
    expect(ics).toContain("URL:https://inspirecourtsaz.com/tournaments/42");
  });

  it("generates unique UID per call", () => {
    const a = generateICS({ title: "A", startDate: "2026-05-01" });
    const b = generateICS({ title: "B", startDate: "2026-05-01" });
    const uidA = a.match(/UID:([^\r\n]+)/)?.[1];
    const uidB = b.match(/UID:([^\r\n]+)/)?.[1];
    expect(uidA).toBeDefined();
    expect(uidB).toBeDefined();
    expect(uidA).not.toBe(uidB);
  });
});
