import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffProfiles, users } from "@/lib/db/schema";
import { and, asc, desc, eq , type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  staffProfileCreateSchema,
  staffProfileUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { ytdGrossByUser, form1099Status } from "@/lib/payroll";

// GET /api/admin/staff — list the staff roster, joined with user info
// and enriched with year-to-date gross pay so admins can see 1099
// threshold risk at a glance.
//   ?status=active|on_leave|terminated  (default: active)
//   ?classification=w2|1099|cash_no_1099|volunteer|stipend
//   ?sort=name|hire_date|pay_rate
//   ?dir=asc|desc
export const GET = withTiming("admin.staff.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status") || "active";
  const classification = sp.get("classification");
  const sortKey = sp.get("sort") || "name";
  const dir = sp.get("dir") === "desc" ? desc : asc;

  const filters: SQL[] = [];
  if (["active", "on_leave", "terminated"].includes(status)) {
    filters.push(eq(staffProfiles.status, status as "active" | "on_leave" | "terminated"));
  }
  if (classification) {
    filters.push(
      eq(
        staffProfiles.employmentClassification,
        classification as "w2" | "1099" | "cash_no_1099" | "volunteer" | "stipend"
      )
    );
  }
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  try {
    const sortCol =
      sortKey === "hire_date"
        ? staffProfiles.hireDate
        : sortKey === "pay_rate"
          ? staffProfiles.payRateCents
          : users.name;

    // Roster query and YTD payroll roll-up are independent — fan them out
    // in parallel so we wait on max(roster, ytd) instead of their sum.
    const [rows, ytd] = await Promise.all([
      db
        .select({
          userId: staffProfiles.userId,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          employmentClassification: staffProfiles.employmentClassification,
          paymentMethod: staffProfiles.paymentMethod,
          payRateCents: staffProfiles.payRateCents,
          payRateType: staffProfiles.payRateType,
          roleTags: staffProfiles.roleTags,
          payoutHandle: staffProfiles.payoutHandle,
          hireDate: staffProfiles.hireDate,
          notes: staffProfiles.notes,
          status: staffProfiles.status,
          updatedAt: staffProfiles.updatedAt,
        })
        .from(staffProfiles)
        .leftJoin(users, eq(users.id, staffProfiles.userId))
        .where(whereClause)
        .orderBy(dir(sortCol)),
      ytdGrossByUser(),
    ]);
    const enriched = rows.map((r) => {
      const ytdCents = ytd.get(r.userId) ?? 0;
      return {
        ...r,
        ytdGrossCents: ytdCents,
        form1099: form1099Status(r.employmentClassification, ytdCents),
      };
    });

    return NextResponse.json(
      { data: enriched, total: enriched.length },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("Failed to fetch staff roster", { error: String(err) });
    return apiError("Failed to fetch staff", 500);
  }
});

// POST /api/admin/staff — promote a user to the staff roster. If the
// user already has a staff_profiles row, returns 409 (use PUT instead).
export const POST = withTiming("admin.staff.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }

  const ip = getClientIp(request);
  if (isRateLimited(`admin-staff-create:${ip}`, 30, 60_000)) {
    return apiError("Too many staff-create requests. Slow down.", 429, {
      headers: { "Retry-After": "60" },
    });
  }

  const parsed = await parseJsonBody(request, staffProfileCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    // Verify the user exists before we try to insert.
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);
    if (!user) return apiNotFound("User not found");

    const [existing] = await db
      .select({ userId: staffProfiles.userId })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, body.userId))
      .limit(1);
    if (existing) {
      return apiError("Staff profile already exists for this user — use PUT to edit", 409);
    }

    const [created] = await db
      .insert(staffProfiles)
      .values({
        userId: body.userId,
        employmentClassification: body.employmentClassification ?? "cash_no_1099",
        paymentMethod: body.paymentMethod ?? "venmo",
        payRateCents: body.payRateCents ?? 0,
        payRateType: body.payRateType ?? "hourly",
        roleTags: body.roleTags ?? "",
        payoutHandle: body.payoutHandle ?? null,
        hireDate: body.hireDate ?? null,
        emergencyContactJson: body.emergencyContactJson ?? null,
        notes: body.notes ?? null,
        status: body.status ?? "active",
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "staff.created",
      entityType: "staff_profile",
      entityId: created.userId,
      before: null,
      after: {
        userEmail: user.email,
        classification: created.employmentClassification,
        payRateCents: created.payRateCents,
        payRateType: created.payRateType,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create staff profile", { error: String(err) });
    return apiError("Failed to create staff profile", 500);
  }
});

// PUT /api/admin/staff — update pay rate, classification, roles, or
// status. Fully audited with before/after snapshots because pay-rate
// changes are a fraud-relevant event.
export const PUT = withTiming("admin.staff.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, staffProfileUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [before] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, body.userId))
      .limit(1);
    if (!before) return apiNotFound("Staff profile not found");

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.employmentClassification !== undefined)
      updates.employmentClassification = body.employmentClassification;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
    if (body.payRateCents !== undefined) updates.payRateCents = body.payRateCents;
    if (body.payRateType !== undefined) updates.payRateType = body.payRateType;
    if (body.roleTags !== undefined) updates.roleTags = body.roleTags;
    if (body.payoutHandle !== undefined) updates.payoutHandle = body.payoutHandle;
    if (body.hireDate !== undefined) updates.hireDate = body.hireDate;
    if (body.emergencyContactJson !== undefined)
      updates.emergencyContactJson = body.emergencyContactJson;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status !== undefined) updates.status = body.status;

    const [updated] = await db
      .update(staffProfiles)
      .set(updates)
      .where(eq(staffProfiles.userId, body.userId))
      .returning();

    // Pay rate changes get their own audit action so they're easy
    // to filter in the audit log (fraud / dispute investigations).
    const payChanged =
      (body.payRateCents !== undefined && body.payRateCents !== before.payRateCents) ||
      (body.payRateType !== undefined && body.payRateType !== before.payRateType);

    await recordAudit({
      session,
      request,
      action: payChanged ? "staff.pay_changed" : "staff.updated",
      entityType: "staff_profile",
      entityId: body.userId,
      before: {
        payRateCents: before.payRateCents,
        payRateType: before.payRateType,
        classification: before.employmentClassification,
        paymentMethod: before.paymentMethod,
        status: before.status,
      },
      after: updates,
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update staff profile", { error: String(err) });
    return apiError("Failed to update staff", 500);
  }
});

// DELETE /api/admin/staff?userId=123 — soft-terminate. Never actually
// drops the row (payroll history needs to stay intact). Use status
// transitions for onboarding lifecycle.
export const DELETE = withTiming("admin.staff.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }

  const userIdRaw = request.nextUrl.searchParams.get("userId");
  const userId = Number(userIdRaw);
  if (!userIdRaw || !Number.isInteger(userId) || userId <= 0) {
    return apiError("Valid userId required", 400);
  }

  try {
    const [before] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .limit(1);
    if (!before) return apiNotFound("Staff profile not found");

    await db
      .update(staffProfiles)
      .set({ status: "terminated", updatedAt: new Date().toISOString() })
      .where(eq(staffProfiles.userId, userId));

    await recordAudit({
      session,
      request,
      action: "staff.terminated",
      entityType: "staff_profile",
      entityId: userId,
      before: { status: before.status },
      after: { status: "terminated" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to terminate staff", { error: String(err) });
    return apiError("Failed to terminate staff", 500);
  }
});
