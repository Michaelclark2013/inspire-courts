import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workoutResults, workouts, members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api-helpers";
import { z } from "zod";

const workoutResultSchema = z.object({
  workoutId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  scoreNumeric: z.union([z.number(), z.string()]).refine(
    (v) => Number.isFinite(Number(v)),
    { message: "scoreNumeric must be a number" }
  ),
  scoreDisplay: z.string().max(30).optional(),
  scoreNote: z.string().max(200).optional(),
  memberId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional().nullable(),
  performedAt: z.string().datetime({ offset: true }).optional(),
});

// POST /api/workouts/results — log a result.
// Body: { workoutId, scoreNumeric, scoreDisplay?, scoreNote?, memberId? }
// If memberId is omitted, the caller's user is used.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(request, workoutResultSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  try {
    const workoutId = Number(body.workoutId);
    const [w] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
    if (!w) return NextResponse.json({ error: "Workout not found" }, { status: 404 });

    const userId = session.user.id ? Number(session.user.id) : null;
    const role = session.user.role;
    const isStaffish = role === "admin" || role === "staff";

    // memberId is user-controlled; treat any non-self member as a privileged
    // operation (admin/staff only) so a logged-in user can't post results
    // against another member's account.
    let memberId: number | null = null;
    if (body.memberId != null) {
      const mid = Number(body.memberId);
      const [m] = await db
        .select({ id: members.id, userId: members.userId })
        .from(members)
        .where(eq(members.id, mid))
        .limit(1);
      if (!m) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      const ownsMember = userId !== null && m.userId === userId;
      if (!ownsMember && !isStaffish) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      memberId = m.id;
    }

    const performedAt = body.performedAt
      ? new Date(body.performedAt).toISOString()
      : new Date().toISOString();

    // Format the display string. For time scoreType, MM:SS. Otherwise raw.
    const scoreNumeric = Math.round(Number(body.scoreNumeric));
    const display = body.scoreDisplay
      ? body.scoreDisplay
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
        scoreNote: body.scoreNote ?? null,
        performedAt,
        verifiedBy: isStaffish ? userId : null,
      })
      .returning({ id: workoutResults.id });

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (err) {
    logger.error("workout result create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
