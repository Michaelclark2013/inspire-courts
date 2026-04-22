import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipPlans, members } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  membershipPlanCreateSchema,
  membershipPlanUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/membership-plans — list plans with active-member counts
// so the admin can see "how many people are on each plan" at a glance.
export const GET = withTiming("admin.membership_plans.list", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  try {
    const plans = await db.select().from(membershipPlans).orderBy(membershipPlans.name);
    const counts = await db
      .select({ planId: members.membershipPlanId, c: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.status, "active"))
      .groupBy(members.membershipPlanId);
    const byPlan = new Map(counts.map((r) => [r.planId, Number(r.c) || 0]));
    const enriched = plans.map((p) => ({
      ...p,
      activeMemberCount: byPlan.get(p.id) ?? 0,
    }));
    return NextResponse.json(
      { data: enriched, total: enriched.length },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (err) {
    logger.error("Failed to fetch membership plans", { error: String(err) });
    return apiError("Failed to fetch plans", 500);
  }
});

export const POST = withTiming("admin.membership_plans.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, membershipPlanCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [created] = await db
      .insert(membershipPlans)
      .values({
        name: b.name,
        type: b.type ?? "unlimited",
        description: b.description ?? null,
        priceMonthlyCents: b.priceMonthlyCents ?? null,
        priceAnnualCents: b.priceAnnualCents ?? null,
        priceOnceCents: b.priceOnceCents ?? null,
        includes: b.includes ?? "",
        maxVisitsPerMonth: b.maxVisitsPerMonth ?? null,
        maxVisitsPerWeek: b.maxVisitsPerWeek ?? null,
        active: b.active ?? true,
        notes: b.notes ?? null,
      })
      .returning();
    await recordAudit({
      session, request, action: "membership_plan.created",
      entityType: "membership_plan", entityId: created.id,
      before: null,
      after: { name: created.name, type: created.type, priceMonthlyCents: created.priceMonthlyCents },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create plan", { error: String(err) });
    return apiError("Failed to create plan", 500);
  }
});

export const PUT = withTiming("admin.membership_plans.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, membershipPlanUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id)).limit(1);
    if (!before) return apiNotFound("Plan not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(membershipPlans).set(updates).where(eq(membershipPlans.id, id)).returning();
    await recordAudit({
      session, request, action: "membership_plan.updated",
      entityType: "membership_plan", entityId: id,
      before: { name: before.name, priceMonthlyCents: before.priceMonthlyCents, active: before.active },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update plan", { error: String(err) });
    return apiError("Failed to update plan", 500);
  }
});

export const DELETE = withTiming("admin.membership_plans.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const [before] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id)).limit(1);
    if (!before) return apiNotFound("Plan not found");
    // Always soft-archive — members may still reference the plan.
    await db.update(membershipPlans).set({ active: false, updatedAt: new Date().toISOString() }).where(eq(membershipPlans.id, id));
    await recordAudit({
      session, request, action: "membership_plan.archived",
      entityType: "membership_plan", entityId: id,
      before: { active: before.active }, after: { active: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to archive plan", { error: String(err) });
    return apiError("Failed to archive plan", 500);
  }
});
