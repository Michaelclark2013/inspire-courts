import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workouts, workoutResults, members, users } from "@/lib/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/workouts                      → list workouts + leaderboards
// GET /api/workouts?id=<id>              → leaderboard for one workout
// POST /api/workouts (admin)             → create new workout
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const workoutId = Number(id);
      const [w] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
      if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Best score per athlete. For time/lower_is_better, MIN; otherwise MAX.
      const lower = w.lowerIsBetter || w.scoreType === "time";
      const orderClause = lower ? asc(workoutResults.scoreNumeric) : desc(workoutResults.scoreNumeric);

      const rows = await db
        .select({
          resultId: workoutResults.id,
          scoreNumeric: workoutResults.scoreNumeric,
          scoreDisplay: workoutResults.scoreDisplay,
          scoreNote: workoutResults.scoreNote,
          performedAt: workoutResults.performedAt,
          memberId: workoutResults.memberId,
          userId: workoutResults.userId,
          memberFirst: members.firstName,
          memberLast: members.lastName,
          userName: users.name,
        })
        .from(workoutResults)
        .leftJoin(members, eq(workoutResults.memberId, members.id))
        .leftJoin(users, eq(workoutResults.userId, users.id))
        .where(eq(workoutResults.workoutId, workoutId))
        .orderBy(orderClause)
        .limit(100);

      // De-dupe to per-athlete best — first occurrence wins because sorted.
      const seen = new Set<string>();
      const leaderboard = rows.filter((r) => {
        const key = r.memberId ? `m${r.memberId}` : r.userId ? `u${r.userId}` : `r${r.resultId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({ workout: w, leaderboard });
    }

    // List all active workouts with result counts.
    const list = await db
      .select({
        id: workouts.id,
        name: workouts.name,
        description: workouts.description,
        scoreType: workouts.scoreType,
        lowerIsBetter: workouts.lowerIsBetter,
        category: workouts.category,
        resultCount: sql<number>`(SELECT COUNT(*) FROM ${workoutResults} WHERE ${workoutResults.workoutId} = ${workouts.id})`,
      })
      .from(workouts)
      .where(eq(workouts.active, true))
      .orderBy(workouts.name);

    return NextResponse.json({ workouts: list });
  } catch (err) {
    logger.error("workouts GET failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body?.name || !body?.scoreType) {
      return NextResponse.json({ error: "Missing name or scoreType" }, { status: 400 });
    }
    const lowerIsBetter = body.scoreType === "time" ? true : Boolean(body.lowerIsBetter);
    const [row] = await db
      .insert(workouts)
      .values({
        name: String(body.name).slice(0, 120),
        description: body.description ? String(body.description).slice(0, 1000) : null,
        scoreType: body.scoreType,
        lowerIsBetter,
        category: body.category || null,
      })
      .returning({ id: workouts.id });
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (err) {
    logger.error("workout create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// helper unused after refactor — keep import alive for grep tools
void and;
