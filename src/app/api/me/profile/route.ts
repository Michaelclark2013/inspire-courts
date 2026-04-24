import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

// GET /api/me/profile — read current user's own profile.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [me] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        photoUrl: users.photoUrl,
        birthDate: users.birthDate,
        emergencyContactName: users.emergencyContactName,
        emergencyContactPhone: users.emergencyContactPhone,
        addressLine: users.addressLine,
        city: users.city,
        state: users.state,
        postalCode: users.postalCode,
        notificationPrefsJson: users.notificationPrefsJson,
        memberSince: users.memberSince,
        emailVerifiedAt: users.emailVerifiedAt,
        profileComplete: users.profileComplete,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);
    if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(me, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    logger.error("me profile read failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PATCH /api/me/profile — update my own profile fields. Cannot touch
// role, approved, email, or password via this endpoint.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ALLOWED = [
      "name", "phone", "photoUrl",
      "birthDate",
      "emergencyContactName", "emergencyContactPhone",
      "addressLine", "city", "state", "postalCode",
    ] as const;

    const update: Record<string, unknown> = {};
    for (const k of ALLOWED) {
      if (k in (body || {})) {
        const v = body[k];
        update[k] = typeof v === "string" ? (v.trim() || null) : v ?? null;
      }
    }

    // Notification prefs — accept a nested object and store as JSON.
    if (body && typeof body.notificationPrefs === "object" && body.notificationPrefs !== null) {
      update.notificationPrefsJson = JSON.stringify(body.notificationPrefs);
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Maintain profile_complete flag — require DOB + emergency contact.
    const [current] = await db
      .select({
        birthDate: users.birthDate,
        emergencyContactName: users.emergencyContactName,
        emergencyContactPhone: users.emergencyContactPhone,
      })
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);
    if (current) {
      const bd = (update.birthDate ?? current.birthDate) as string | null;
      const ecn = (update.emergencyContactName ?? current.emergencyContactName) as string | null;
      const ecp = (update.emergencyContactPhone ?? current.emergencyContactPhone) as string | null;
      update.profileComplete = !!(bd && ecn && ecp);
    }
    update.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, uid))
      .returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        photoUrl: users.photoUrl,
        profileComplete: users.profileComplete,
      });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("me profile update failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// POST /api/me/profile — with subAction field:
//   { action: "changePassword", current, next }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (body?.action !== "changePassword") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    const current = typeof body?.current === "string" ? body.current : "";
    const next = typeof body?.next === "string" ? body.next : "";
    if (!current || !next) {
      return NextResponse.json({ error: "Current + new password required" }, { status: 400 });
    }
    if (next.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const [me] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);
    if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ok = await bcrypt.compare(current, me.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
    const nextHash = await bcrypt.hash(next, 12);
    await db
      .update(users)
      .set({ passwordHash: nextHash, updatedAt: new Date().toISOString() })
      .where(eq(users.id, uid));
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("me password change failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
