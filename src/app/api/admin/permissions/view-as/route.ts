import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Admin-only "view as this user" mode. We don't swap the actual
// session (that would disclose the target's credentials) — instead
// we stash the target's effective permission set + role in an
// HTTP-only cookie that lib/auth reads on the next JWT refresh and
// overlays onto the main admin's permissions.
//
// POST /api/admin/permissions/view-as  { userId }
// DELETE /api/admin/permissions/view-as   — exit preview
const COOKIE = "icaz-view-as";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const userId = Number(body?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const [target] = await db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const overrides = await db
      .select({
        page: userPermissions.page,
        granted: userPermissions.granted,
        expiresAt: userPermissions.expiresAt,
      })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    // Cookie payload — small enough to fit comfortably under the 4KB limit.
    const payload = JSON.stringify({
      userId: target.id,
      name: target.name,
      role: target.role,
      overrides,
    });

    const res = NextResponse.json({ ok: true, target: { id: target.id, name: target.name, role: target.role } });
    res.cookies.set(COOKIE, payload, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour — short enough that accidentally leaving it on auto-expires
      path: "/",
    });
    return res;
  } catch (err) {
    logger.error("view-as set failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = request.cookies.get(COOKIE)?.value;
  if (!raw) return NextResponse.json({ active: false });
  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      active: true,
      target: { id: parsed.userId, name: parsed.name, role: parsed.role },
    });
  } catch {
    return NextResponse.json({ active: false });
  }
}
