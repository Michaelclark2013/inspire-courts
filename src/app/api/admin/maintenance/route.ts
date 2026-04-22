import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { maintenanceTickets, users, resources } from "@/lib/db/schema";
import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  maintenanceTicketCreateSchema,
  maintenanceTicketUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/maintenance
//   ?status=open|in_progress|waiting_vendor|resolved|closed (default: non-closed)
//   ?priority=low|medium|high|urgent
//   ?assignedTo=userId
export const GET = withTiming("admin.maintenance.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "maintenance")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const priority = sp.get("priority");
  const assignedToRaw = sp.get("assignedTo");

  const filters: SQL[] = [];
  if (statusFilter && ["open", "in_progress", "waiting_vendor", "resolved", "closed"].includes(statusFilter)) {
    filters.push(eq(maintenanceTickets.status, statusFilter as "open" | "in_progress" | "waiting_vendor" | "resolved" | "closed"));
  } else {
    // Default: hide closed tickets so the list stays focused.
    const activeClause = or(
      eq(maintenanceTickets.status, "open"),
      eq(maintenanceTickets.status, "in_progress"),
      eq(maintenanceTickets.status, "waiting_vendor"),
      eq(maintenanceTickets.status, "resolved"),
    );
    if (activeClause) filters.push(activeClause);
  }
  if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
    filters.push(eq(maintenanceTickets.priority, priority as "low" | "medium" | "high" | "urgent"));
  }
  const assignedTo = Number(assignedToRaw);
  if (assignedToRaw && Number.isInteger(assignedTo) && assignedTo > 0) {
    filters.push(eq(maintenanceTickets.assignedTo, assignedTo));
  }

  try {
    // Order: urgent first, then by created desc. Using a CASE to sort
    // the priority enum numerically.
    const rows = await db
      .select({
        id: maintenanceTickets.id,
        title: maintenanceTickets.title,
        description: maintenanceTickets.description,
        location: maintenanceTickets.location,
        priority: maintenanceTickets.priority,
        status: maintenanceTickets.status,
        assignedTo: maintenanceTickets.assignedTo,
        assignedToName: users.name,
        resourceId: maintenanceTickets.resourceId,
        resourceName: resources.name,
        vendorName: maintenanceTickets.vendorName,
        costCents: maintenanceTickets.costCents,
        createdAt: maintenanceTickets.createdAt,
        resolvedAt: maintenanceTickets.resolvedAt,
        photoUrls: maintenanceTickets.photoUrls,
      })
      .from(maintenanceTickets)
      .leftJoin(users, eq(users.id, maintenanceTickets.assignedTo))
      .leftJoin(resources, eq(resources.id, maintenanceTickets.resourceId))
      .where(and(...filters))
      .orderBy(
        sql`CASE ${maintenanceTickets.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
        desc(maintenanceTickets.createdAt),
      );
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch maintenance tickets", { error: String(err) });
    return apiError("Failed to fetch tickets", 500);
  }
});

export const POST = withTiming("admin.maintenance.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "maintenance")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, maintenanceTicketCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const reporter = session.user.id ? Number(session.user.id) : null;
    const [created] = await db
      .insert(maintenanceTickets)
      .values({
        title: b.title,
        description: b.description ?? null,
        location: b.location ?? null,
        priority: b.priority ?? "medium",
        status: b.status ?? "open",
        reportedBy: reporter && !isNaN(reporter) ? reporter : null,
        assignedTo: b.assignedTo ?? null,
        resourceId: b.resourceId ?? null,
        photoUrls: b.photoUrls ? JSON.stringify(b.photoUrls) : null,
        vendorName: b.vendorName ?? null,
        costCents: b.costCents ?? null,
        notes: b.notes ?? null,
      })
      .returning();
    await recordAudit({
      session, request, action: "maintenance.ticket_opened",
      entityType: "maintenance_ticket", entityId: created.id, before: null,
      after: { title: created.title, priority: created.priority, location: created.location },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create ticket", { error: String(err) });
    return apiError("Failed to create ticket", 500);
  }
});

export const PUT = withTiming("admin.maintenance.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "maintenance")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, maintenanceTicketUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, id)).limit(1);
    if (!before) return apiNotFound("Ticket not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined) continue;
      if (k === "photoUrls" && Array.isArray(v)) updates[k] = JSON.stringify(v);
      else updates[k] = v;
    }
    // Auto-stamp resolvedAt when status flips to resolved/closed.
    if (
      rest.status &&
      (rest.status === "resolved" || rest.status === "closed") &&
      before.status !== "resolved" &&
      before.status !== "closed"
    ) {
      updates.resolvedAt = new Date().toISOString();
    }
    const [updated] = await db.update(maintenanceTickets).set(updates).where(eq(maintenanceTickets.id, id)).returning();
    const statusChanged = rest.status !== undefined && rest.status !== before.status;
    await recordAudit({
      session, request,
      action: statusChanged ? `maintenance.${rest.status}` : "maintenance.ticket_updated",
      entityType: "maintenance_ticket", entityId: id,
      before: { status: before.status, priority: before.priority, assignedTo: before.assignedTo },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update ticket", { error: String(err) });
    return apiError("Failed to update ticket", 500);
  }
});
