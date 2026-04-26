import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  staffCertifications,
  users,
  members,
  equipment,
  auditLog,
} from "@/lib/db/schema";
import { and, asc, desc, eq, lte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/ops-alerts
// Compliance + engagement roll-up: expiring certs, today's member
// birthdays, low-stock inventory, recent admin audit actions.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const now = new Date();
    const thirtyDaysAhead = new Date(Date.now() + 30 * 864e5).toISOString();
    const nowIso = now.toISOString();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const [expiringCerts, todaysBirthdays, lowStock, recentAudits] = await Promise.all([
      db
        .select({
          id: staffCertifications.id,
          type: staffCertifications.type,
          label: staffCertifications.label,
          expiresAt: staffCertifications.expiresAt,
          userId: staffCertifications.userId,
          userName: users.name,
          userPhotoUrl: users.photoUrl,
        })
        .from(staffCertifications)
        .leftJoin(users, eq(users.id, staffCertifications.userId))
        .where(
          and(
            lte(staffCertifications.expiresAt, thirtyDaysAhead),
            // Include expired too — admin still wants to see them
          )
        )
        .orderBy(asc(staffCertifications.expiresAt))
        .limit(10),
      db
        .select({
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          birthDate: members.birthDate,
        })
        .from(members)
        .where(
          and(
            eq(members.status, "active"),
            // Match MM-DD regardless of year. SQLite substr is 1-indexed.
            sql`substr(${members.birthDate}, 6, 5) = ${mmdd}`
          )
        )
        .limit(20),
      db
        .select({
          id: equipment.id,
          name: equipment.name,
          onHand: equipment.onHand,
          minQuantity: equipment.minQuantity,
          supplier: equipment.supplier,
        })
        .from(equipment)
        .where(
          and(
            eq(equipment.active, true),
            sql`${equipment.onHand} <= ${equipment.minQuantity}`
          )
        )
        .orderBy(asc(equipment.onHand))
        .limit(10),
      db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          actorEmail: auditLog.actorEmail,
          entityType: auditLog.entityType,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(10),
    ]);

    // Mark expired certs
    const expiringAnnotated = expiringCerts.map((c) => ({
      ...c,
      expired: c.expiresAt ? new Date(c.expiresAt).getTime() < now.getTime() : false,
    }));

    return NextResponse.json(
      {
        expiringCerts: expiringAnnotated,
        todaysBirthdays,
        lowStock,
        recentAudits,
        asOf: nowIso,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("ops-alerts failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
