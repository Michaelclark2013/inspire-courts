import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workoutResults, workouts, members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// POST /api/workouts/results — log a result.
// Body: { workoutId, scoreNumeric, scoreDisplay?, scoreNote?, memberId? }
// If memberId is omitted, the caller's user is used.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body?.workoutId || !Number.isFinite(Number(body?.scoreNumeric))) {
      return NextResponse.json({ error: "Missing workoutId or scoreNumeric" }, { status: 400 });
    }
    const workoutId = Number(body.workoutId);
    const [w] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
    if (!w) return NextResponse.json({ error: "Workout not found" }, { status: 404 });

    let memberId: number | null = null;
    if (body.memberId) {
      const mid = Number(body.memberId);
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.id, mid)).limit(1);
      if (m) memberId = m.id;
    }

    const performedAt = body.performedAt
      ? new Date(body.performedAt).toISOString()
      : new Date().toISOString();
    const userId = session.user.id ? Number(session.user.id) : null;

    // Format the display string. For time scoreType, MM:SS. Otherwise raw.
    const scoreNumeric = Math.round(Number(body.scoreNumeric));
    const display = body.scoreDisplay
      ? String(body.scoreDisplay).slice(0, 30)
      : w.scoreType === "time"
      ? `${Math.floor(scoreNumeric / 60)}:${String(scoreNumeric % 60).padStart(2, "0")}`
      : String(scoreNumeric);

    const [row] = await db
      .insert(workoutResults)
      .values({
        workoutId,
        memberId,
        userId: memberId ? null : userId,
        scoreNumeric,
        scoreDisplay: display,
        scoreNote: body.scoreNote ? String(body.scoreNote).slice(0, 200) : null,
        performedAt,
        verifiedBy: session.user.role === "admin" || session.user.role === "staff" ? userId : null,
      })
      .returning({ id: workoutResults.id });

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (err) {
    logger.error("workout result create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
