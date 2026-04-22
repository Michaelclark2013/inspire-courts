import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffCertifications, users } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, isNotNull, lt, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  certificationCreateSchema,
  certificationUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/certifications
//   ?userId=X — filter to one worker's certs
//   ?expiringInDays=30 — return certs expiring within N days (alert view)
//   ?expired=true — return only already-expired certs
export const GET = withTiming("admin.certifications.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "certifications")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const userIdRaw = sp.get("userId");
  const expiringInDaysRaw = sp.get("expiringInDays");
  const expired = sp.get("expired") === "true";

  const filters: SQL[] = [];
  const userId = Number(userIdRaw);
  if (userIdRaw && Number.isInteger(userId) && userId > 0) {
    filters.push(eq(staffCertifications.userId, userId));
  }
  const nowIso = new Date().toISOString();
  if (expired) {
    filters.push(isNotNull(staffCertifications.expiresAt));
    filters.push(lt(staffCertifications.expiresAt, nowIso));
  } else if (expiringInDaysRaw) {
    const days = Math.max(1, Math.min(365, Number(expiringInDaysRaw) || 30));
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    filters.push(isNotNull(staffCertifications.expiresAt));
    filters.push(gte(staffCertifications.expiresAt, nowIso));
    filters.push(lt(staffCertifications.expiresAt, cutoff));
  }

  try {
    const rows = await db
      .select({
        id: staffCertifications.id,
        userId: staffCertifications.userId,
        name: users.name,
        email: users.email,
        type: staffCertifications.type,
        label: staffCertifications.label,
        issuedAt: staffCertifications.issuedAt,
        expiresAt: staffCertifications.expiresAt,
        documentUrl: staffCertifications.documentUrl,
        verifiedBy: staffCertifications.verifiedBy,
        verifiedAt: staffCertifications.verifiedAt,
        notes: staffCertifications.notes,
      })
      .from(staffCertifications)
      .leftJoin(users, eq(users.id, staffCertifications.userId))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(staffCertifications.expiresAt), desc(staffCertifications.issuedAt));
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch certifications", { error: String(err) });
    return apiError("Failed to fetch certifications", 500);
  }
});

export const POST = withTiming("admin.certifications.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "certifications")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, certificationCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [created] = await db
      .insert(staffCertifications)
      .values({
        userId: b.userId,
        type: b.type,
        label: b.label ?? null,
        issuedAt: b.issuedAt ?? null,
        expiresAt: b.expiresAt ?? null,
        documentUrl: b.documentUrl ?? null,
        notes: b.notes ?? null,
      })
      .returning();
    await recordAudit({
      session, request, action: "certification.created",
      entityType: "staff_certification", entityId: created.id, before: null,
      after: { userId: b.userId, type: created.type, expiresAt: created.expiresAt },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create certification", { error: String(err) });
    return apiError("Failed to create certification", 500);
  }
});

export const PUT = withTiming("admin.certifications.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "certifications")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, certificationUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(staffCertifications).where(eq(staffCertifications.id, id)).limit(1);
    if (!before) return apiNotFound("Certification not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(staffCertifications).set(updates).where(eq(staffCertifications.id, id)).returning();
    await recordAudit({
      session, request, action: "certification.updated",
      entityType: "staff_certification", entityId: id,
      before: { expiresAt: before.expiresAt, type: before.type },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update certification", { error: String(err) });
    return apiError("Failed to update certification", 500);
  }
});

// POST /api/admin/certifications/verify?id=X — one-click verify mark
export const PATCH = withTiming("admin.certifications.verify", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "certifications")) {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const verifier = session.user.id ? Number(session.user.id) : null;
    const [updated] = await db.update(staffCertifications)
      .set({
        verifiedAt: new Date().toISOString(),
        verifiedBy: verifier && !isNaN(verifier) ? verifier : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(staffCertifications.id, id))
      .returning();
    if (!updated) return apiNotFound("Certification not found");
    await recordAudit({
      session, request, action: "certification.verified",
      entityType: "staff_certification", entityId: id, before: null,
      after: { verifiedBy: verifier, verifiedAt: updated.verifiedAt },
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to verify certification", { error: String(err) });
    return apiError("Failed to verify certification", 500);
  }
});

export const DELETE = withTiming("admin.certifications.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const [before] = await db.select().from(staffCertifications).where(eq(staffCertifications.id, id)).limit(1);
    if (!before) return apiNotFound("Certification not found");
    await db.delete(staffCertifications).where(eq(staffCertifications.id, id));
    await recordAudit({
      session, request, action: "certification.deleted",
      entityType: "staff_certification", entityId: id,
      before: { userId: before.userId, type: before.type }, after: null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to delete certification", { error: String(err) });
    return apiError("Failed to delete certification", 500);
  }
});
