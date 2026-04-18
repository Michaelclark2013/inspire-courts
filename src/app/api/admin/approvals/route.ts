import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// GET — list all pending (unapproved) users
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pending = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.approved, false));

    return NextResponse.json({ users: pending }, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    logger.error("Failed to fetch pending approvals", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

// PATCH — approve or reject a user
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, userIds, action } = body as {
      userId?: number;
      userIds?: number[];
      action?: string;
    };

    // Accept either a single userId (legacy) or a bulk userIds array (new).
    const ids: number[] = Array.isArray(userIds) && userIds.length > 0
      ? userIds.filter((n) => typeof n === "number" && Number.isInteger(n) && n > 0)
      : typeof userId === "number" && Number.isInteger(userId) && userId > 0
        ? [userId]
        : [];

    if (ids.length === 0 || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "userId/userIds[] and action (approve|reject) are required" },
        { status: 400 }
      );
    }

    // Fetch all target users up front so we can verify existence, skip
    // already-approved ones, and capture before-snapshots for the audit log.
    const targetUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, ids));

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No matching users found" }, { status: 404 });
    }

    // For approve: only act on still-pending users. For reject: act on all
    // found ids (rejecting an already-approved user would be destructive —
    // block it explicitly).
    const pendingUsers = targetUsers.filter((u) => !u.approved);
    if (action === "approve" && pendingUsers.length === 0) {
      return NextResponse.json({ error: "No pending users in that set" }, { status: 400 });
    }
    if (action === "reject" && pendingUsers.length !== targetUsers.length) {
      return NextResponse.json({ error: "Cannot reject users who are already approved" }, { status: 400 });
    }

    const affectedIds = pendingUsers.map((u) => u.id);

    if (action === "approve") {
      await db
        .update(users)
        .set({ approved: true, updatedAt: new Date().toISOString() })
        .where(inArray(users.id, affectedIds));
    } else {
      // Reject = delete the user
      await db.delete(users).where(inArray(users.id, affectedIds));
    }

    // Audit every affected user individually so the log answers
    // "who approved/rejected user X" directly without parsing a list.
    for (const u of pendingUsers) {
      await recordAudit({
        session,
        action: action === "approve" ? "user.approved" : "user.rejected",
        entityType: "user",
        entityId: u.id,
        before: { approved: u.approved, role: u.role, email: u.email, name: u.name },
        after: action === "approve"
          ? { approved: true, role: u.role, email: u.email, name: u.name }
          : null,
      });
    }

    // Single-user legacy response shape vs bulk response shape
    if (ids.length === 1 && pendingUsers[0]) {
      const u = pendingUsers[0];
      return NextResponse.json({
        success: true,
        message: action === "approve" ? `${u.name} approved` : `${u.name} rejected and removed`,
      });
    }

    return NextResponse.json({
      success: true,
      count: affectedIds.length,
      message: `${affectedIds.length} user${affectedIds.length === 1 ? "" : "s"} ${action}d`,
    });
  } catch (error) {
    logger.error("Approval action failed", { error: String(error) });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
