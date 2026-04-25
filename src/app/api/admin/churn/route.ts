import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberRiskScores, members, subscriptions } from "@/lib/db/schema";
import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { draftWinbackMessage, recomputeAllRiskScores } from "@/lib/churn";

// GET /api/admin/churn?tier=high|medium|low — admin-only at-risk list.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tier = request.nextUrl.searchParams.get("tier");
  const now = new Date().toISOString();

  try {
    const filters = [
      // Hide dismissed rows that haven't expired.
      or(isNull(memberRiskScores.dismissedUntil), gte(sql`${now}`, memberRiskScores.dismissedUntil)),
    ] as ReturnType<typeof or>[];
    if (tier === "high" || tier === "medium" || tier === "low") {
      filters.push(eq(memberRiskScores.tier, tier) as ReturnType<typeof or>);
    }

    const rows = await db
      .select({
        id: memberRiskScores.id,
        memberId: memberRiskScores.memberId,
        score: memberRiskScores.score,
        tier: memberRiskScores.tier,
        primaryReason: memberRiskScores.primaryReason,
        daysSinceLastVisit: memberRiskScores.daysSinceLastVisit,
        visitsTrend: memberRiskScores.visitsTrend,
        tenureDays: memberRiskScores.tenureDays,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        phone: members.phone,
        status: members.status,
        priceCents: subscriptions.priceCents,
      })
      .from(memberRiskScores)
      .leftJoin(members, eq(memberRiskScores.memberId, members.id))
      .leftJoin(
        subscriptions,
        and(eq(subscriptions.memberId, memberRiskScores.memberId), eq(subscriptions.status, "active"))
      )
      .where(and(...filters))
      .orderBy(desc(memberRiskScores.score))
      .limit(200);

    // Project total MRR at risk among high-tier rows.
    const mrrAtRisk = rows
      .filter((r) => r.tier === "high")
      .reduce((acc, r) => acc + (r.priceCents || 0), 0);

    return NextResponse.json(
      { rows, mrrAtRisk },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (err) {
    logger.error("churn list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/churn { action: "recompute" | "draft", memberId? }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action === "recompute") {
    const r = await recomputeAllRiskScores();
    return NextResponse.json(r);
  }

  if (action === "draft" && body?.memberId) {
    const memberId = Number(body.memberId);
    const [score] = await db
      .select({
        firstName: members.firstName,
        daysSinceLastVisit: memberRiskScores.daysSinceLastVisit,
        primaryReason: memberRiskScores.primaryReason,
      })
      .from(memberRiskScores)
      .leftJoin(members, eq(memberRiskScores.memberId, members.id))
      .where(eq(memberRiskScores.memberId, memberId))
      .limit(1);
    if (!score) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    const draft = draftWinbackMessage({
      firstName: score.firstName || "there",
      daysSinceLastVisit: score.daysSinceLastVisit,
      primaryReason: score.primaryReason || "Looking healthy",
    });
    return NextResponse.json(draft);
  }

  if (action === "dismiss" && body?.memberId) {
    const memberId = Number(body.memberId);
    const days = Number(body?.days) || 14;
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await db
      .update(memberRiskScores)
      .set({ dismissedUntil: until })
      .where(eq(memberRiskScores.memberId, memberId));
    return NextResponse.json({ ok: true, dismissedUntil: until });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
