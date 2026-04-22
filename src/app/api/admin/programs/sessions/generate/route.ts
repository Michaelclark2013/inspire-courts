import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { programSessions } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { sessionGeneratorSchema } from "@/lib/schemas";
import { parseJsonBody, apiError } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// POST /api/admin/programs/sessions/generate
// Bulk-create recurring sessions. Example: generate "every Tue/Thu
// 6-8pm through end of June" for a clinic.
//
// Body:
//   programId
//   firstStartsAt: ISO timestamp — sets start time on the first
//                  matching weekday on-or-after this date
//   durationMinutes: how long each session runs
//   weekdays: array of 0-6 (Sun-Sat)
//   untilDate: YYYY-MM-DD — inclusive last day
//   instructorUserId + location: applied to every generated session
//
// Returns the created sessions. Caps at 200 to prevent runaways.
export const POST = withTiming("admin.program_sessions.generate", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, sessionGeneratorSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const start = new Date(b.firstStartsAt);
    const until = new Date(b.untilDate + "T23:59:59");
    if (!isFinite(start.getTime()) || !isFinite(until.getTime())) {
      return apiError("Invalid dates", 400);
    }
    if (until < start) return apiError("untilDate must be on or after firstStartsAt", 400);

    // Walk day by day from start → until, creating a session for
    // every matching weekday. Preserves the hours/minutes from
    // firstStartsAt so 6:30pm carries through.
    const weekdaySet = new Set(b.weekdays);
    const sessions: Array<{
      programId: number;
      startsAt: string;
      endsAt: string;
      instructorUserId: number | null;
      location: string | null;
      status: "scheduled";
    }> = [];
    const cursor = new Date(start);
    const MAX = 200;
    while (cursor <= until && sessions.length < MAX) {
      if (weekdaySet.has(cursor.getDay())) {
        const endAt = new Date(cursor.getTime() + b.durationMinutes * 60_000);
        sessions.push({
          programId: b.programId,
          startsAt: cursor.toISOString(),
          endsAt: endAt.toISOString(),
          instructorUserId: b.instructorUserId ?? null,
          location: b.location ?? null,
          status: "scheduled",
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (sessions.length === 0) {
      return apiError("No matching dates in that window", 400);
    }

    const created = await db.insert(programSessions).values(sessions).returning();
    await recordAudit({
      session, request, action: "program_sessions.bulk_generated",
      entityType: "program", entityId: b.programId, before: null,
      after: {
        count: created.length,
        firstStartsAt: created[0]?.startsAt,
        lastStartsAt: created[created.length - 1]?.startsAt,
        capped: sessions.length === MAX,
      },
    });

    return NextResponse.json({ created, count: created.length, capped: sessions.length === MAX }, { status: 201 });
  } catch (err) {
    logger.error("Failed to generate sessions", { error: String(err) });
    return apiError("Failed to generate sessions", 500);
  }
});
