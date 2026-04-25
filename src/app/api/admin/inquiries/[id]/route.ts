import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { inquiries, inquiryNotes, users } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { canAccess } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api-helpers";
import { z } from "zod";

const inquiryPatchSchema = z.object({
  status: z.enum(["new", "contacted", "qualifying", "won", "lost"]).optional(),
  assignedTo: z
    .union([z.number().int().positive(), z.string().regex(/^\d+$/), z.null()])
    .optional(),
  note: z.string().max(2000).optional(),
  closeReason: z.string().max(500).nullable().optional(),
});

// GET /api/admin/inquiries/[id] — full detail + notes timeline
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "inquiries")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const [row] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const notes = await db
      .select({
        id: inquiryNotes.id,
        body: inquiryNotes.body,
        kind: inquiryNotes.kind,
        createdAt: inquiryNotes.createdAt,
        authorName: users.name,
      })
      .from(inquiryNotes)
      .leftJoin(users, eq(inquiryNotes.authorUserId, users.id))
      .where(eq(inquiryNotes.inquiryId, id))
      .orderBy(asc(inquiryNotes.createdAt));

    return NextResponse.json({ inquiry: row, notes });
  } catch (err) {
    logger.error("inquiry detail failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/inquiries/[id]  body: { status?, assignedTo?, note?, closeReason? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "inquiries")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const parsed = await parseJsonBody(request, inquiryPatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  try {
    const [before] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { updatedAt: now };

    if (body.status) {
      update.status = body.status;
      if (body.status === "won" || body.status === "lost") update.closedAt = now;
      if (before.status === "new" && body.status !== "new" && !before.firstTouchAt) {
        update.firstTouchAt = now;
      }
    }
    if (body.assignedTo !== undefined) {
      update.assignedTo = body.assignedTo != null ? Number(body.assignedTo) : null;
    }
    if (body.closeReason !== undefined) update.closeReason = body.closeReason;

    await db.update(inquiries).set(update).where(eq(inquiries.id, id));

    if (body.note) {
      await db.insert(inquiryNotes).values({
        inquiryId: id,
        authorUserId: session.user.id ? Number(session.user.id) : null,
        body: body.note,
        kind: "note",
      });
    }
    if (body.status && body.status !== before.status) {
      await db.insert(inquiryNotes).values({
        inquiryId: id,
        authorUserId: session.user.id ? Number(session.user.id) : null,
        body: `Status changed: ${before.status} → ${body.status}`,
        kind: "status_change",
      });
    }

    await recordAudit({
      session,
      request,
      action: "inquiry.updated",
      entityType: "inquiry",
      entityId: String(id),
      before: { status: before.status, assignedTo: before.assignedTo },
      after: update,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("inquiry patch failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
