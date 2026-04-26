import { db } from "@/lib/db";
import { members, memberVisits, memberRiskScores } from "@/lib/db/schema";
import { gte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ── Churn scoring engine ─────────────────────────────────────────────
// Deterministic, transparent scoring. Each signal contributes points;
// total clamped to [0, 100]. Three tiers drive the UI:
//   low    0-30   (healthy or new — leave alone)
//   medium 31-70  (watch list — proactive check-in)
//   high   71-100 (call this week or lose them)
//
// Why deterministic? Owners need to TRUST the list. "Sarah scored 84"
// is way more credible when the breakdown is "no visit in 18 days
// (+40), down 60% from last 7d (+20), past due (+24)" than "the AI
// thinks so."

type Components = {
  daysSinceLastVisit: number | null;
  visitsTrend: number;     // visits last 7d - visits prior 7d
  isPastDue: boolean;
  tenureDays: number;
  visitsLast7: number;
};

function scoreFromComponents(c: Components): {
  score: number;
  tier: "low" | "medium" | "high";
  primaryReason: string;
} {
  let score = 0;
  let primary = "";
  let primaryWeight = 0;

  // Signal 1: Days since last visit. The single best churn predictor.
  // Weight ramps fast: 7d=10, 14d=25, 21d=40, 28d=50, 35+d=60
  if (c.daysSinceLastVisit === null) {
    // Never visited — but tenure-aware. New members get a short grace.
    if (c.tenureDays > 14) {
      score += 50;
      if (50 > primaryWeight) { primary = "Has never visited"; primaryWeight = 50; }
    }
  } else {
    const d = c.daysSinceLastVisit;
    let pts = 0;
    if (d >= 35) pts = 60;
    else if (d >= 28) pts = 50;
    else if (d >= 21) pts = 40;
    else if (d >= 14) pts = 25;
    else if (d >= 7) pts = 10;
    score += pts;
    if (pts > primaryWeight) {
      primary = `${d} days since last visit`;
      primaryWeight = pts;
    }
  }

  // Signal 2: Trend — declining usage is a leading indicator.
  if (c.visitsTrend < 0) {
    const drop = Math.abs(c.visitsTrend);
    const pts = Math.min(drop * 5, 25); // 1 fewer visit = 5pts, capped at 25
    score += pts;
    if (pts > primaryWeight) {
      primary = `Visits dropped by ${drop} this week`;
      primaryWeight = pts;
    }
  }

  // Signal 3: Past-due — they're already telling us with their wallet.
  if (c.isPastDue) {
    score += 25;
    if (25 > primaryWeight) {
      primary = "Payment past due";
      primaryWeight = 25;
    }
  }

  // Signal 4: Tenure — newer members are statistically much more likely
  // to churn. Sliding bonus that fades by day 90.
  if (c.tenureDays < 30) {
    const pts = Math.round(15 * (1 - c.tenureDays / 30));
    score += pts;
  } else if (c.tenureDays < 90) {
    const pts = Math.round(8 * (1 - (c.tenureDays - 30) / 60));
    score += pts;
  }

  // Clamp.
  score = Math.max(0, Math.min(100, score));

  const tier = score >= 71 ? "high" : score >= 31 ? "medium" : "low";
  if (!primary) {
    primary = score >= 31 ? "Multiple low-grade signals" : "Looking healthy";
  }
  return { score, tier, primaryReason: primary };
}

/**
 * Recompute every member's risk score. Idempotent — upserts to
 * member_risk_scores.member_id (unique). Preserves dismissedUntil.
 * Targets: full pass in <2s for ~5,000 members on Turso.
 */
export async function recomputeAllRiskScores(): Promise<{ scored: number }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();

  // Pull every active/past_due/paused member. Cancelled members don't need scoring.
  const memberRows = await db
    .select({
      id: members.id,
      status: members.status,
      joinedAt: members.joinedAt,
    })
    .from(members);

  // Pull visits in the last 14d in one query, group by member.
  const visitsRows = await db
    .select({
      memberId: memberVisits.memberId,
      visitedAt: memberVisits.visitedAt,
    })
    .from(memberVisits)
    .where(gte(memberVisits.visitedAt, fourteenDaysAgo));

  // Bucket per member.
  const visitsByMember = new Map<number, string[]>();
  for (const v of visitsRows) {
    if (!visitsByMember.has(v.memberId)) visitsByMember.set(v.memberId, []);
    visitsByMember.get(v.memberId)!.push(v.visitedAt);
  }

  // Last visit per member (any time) — separate query so we don't
  // pull the entire visit history.
  const lastVisits = await db
    .select({
      memberId: memberVisits.memberId,
      last: sql<string>`MAX(${memberVisits.visitedAt})`,
    })
    .from(memberVisits)
    .groupBy(memberVisits.memberId);
  const lastVisitMap = new Map<number, string>();
  for (const r of lastVisits) lastVisitMap.set(r.memberId, String(r.last));

  // Existing dismissedUntil values to preserve.
  const existing = await db.select({ memberId: memberRiskScores.memberId, dismissedUntil: memberRiskScores.dismissedUntil }).from(memberRiskScores);
  const dismissedMap = new Map<number, string | null>();
  for (const r of existing) dismissedMap.set(r.memberId, r.dismissedUntil);

  let scored = 0;
  for (const m of memberRows) {
    if (m.status === "cancelled") continue;
    const last = lastVisitMap.get(m.id) || null;
    const daysSinceLastVisit = last
      ? Math.floor((now.getTime() - new Date(last).getTime()) / 86_400_000)
      : null;
    const recentVisits = visitsByMember.get(m.id) || [];
    const visitsLast7 = recentVisits.filter((v) => v >= sevenDaysAgo).length;
    const visitsPrior7 = recentVisits.length - visitsLast7;
    const visitsTrend = visitsLast7 - visitsPrior7;
    const tenureDays = Math.floor(
      (now.getTime() - new Date(m.joinedAt).getTime()) / 86_400_000
    );

    const { score, tier, primaryReason } = scoreFromComponents({
      daysSinceLastVisit,
      visitsTrend,
      isPastDue: m.status === "past_due",
      tenureDays,
      visitsLast7,
    });

    const dismissedUntil = dismissedMap.get(m.id) || null;
    // Upsert. SQLite doesn't have nice upsert via Drizzle for unique
    // columns the way Postgres does, so insert with ON CONFLICT DO UPDATE.
    await db
      .insert(memberRiskScores)
      .values({
        memberId: m.id,
        score,
        tier,
        primaryReason,
        daysSinceLastVisit,
        visitsTrend,
        isPastDue: m.status === "past_due",
        tenureDays,
        dismissedUntil,
        computedAt: now.toISOString(),
      })
      .onConflictDoUpdate({
        target: memberRiskScores.memberId,
        set: {
          score,
          tier,
          primaryReason,
          daysSinceLastVisit,
          visitsTrend,
          isPastDue: m.status === "past_due",
          tenureDays,
          computedAt: now.toISOString(),
        },
      });
    scored++;
  }

  logger.info("churn risk recomputed", { scored });
  return { scored };
}

/**
 * Generate a draft win-back message for a high-risk member. Plain
 * template for v1 — Claude API can replace this for personalization.
 */
export function draftWinbackMessage(opts: {
  firstName: string;
  daysSinceLastVisit: number | null;
  primaryReason: string;
}): { sms: string; email: { subject: string; body: string } } {
  const name = opts.firstName || "there";
  const sms = opts.daysSinceLastVisit && opts.daysSinceLastVisit > 14
    ? `Hey ${name}, it's Inspire Courts. Haven't seen you in a bit — everything good? Stop by this week and your next class is on us. - Coach`
    : `Hey ${name}, it's Inspire Courts. Just checking in. Anything we can do to make your training better? - Coach`;
  const subject = `${name}, we miss you at Inspire Courts`;
  const body = `Hi ${name},\n\nWe noticed you haven't been in lately — ${opts.primaryReason.toLowerCase()}. We'd love to have you back.\n\nReply to this email or text the front desk and we'll work out whatever's getting in the way. Your next session is on us.\n\n— The Inspire Courts team`;
  return { sms, email: { subject, body } };
}
