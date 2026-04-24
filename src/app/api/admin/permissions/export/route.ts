import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  ALL_ADMIN_PAGES,
  canAccess,
  canAccessWithOverrides,
  type AdminPage,
} from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

// GET /api/admin/permissions/export
// Returns a CSV snapshot of every user's effective access across all
// admin pages. Columns: name, email, role, then one column per page
// with "yes" / "no" / "yes (granted)" / "no (revoked)" so admin can
// audit in a spreadsheet.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [allUsers, allOverrides] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .orderBy(asc(users.name)),
      db.select().from(userPermissions),
    ]);

    const overridesByUser = new Map<number, Array<{ page: AdminPage; granted: boolean }>>();
    for (const o of allOverrides) {
      const list = overridesByUser.get(o.userId) || [];
      list.push({ page: o.page as AdminPage, granted: o.granted });
      overridesByUser.set(o.userId, list);
    }

    const header = [
      "Name",
      "Email",
      "Role",
      ...ALL_ADMIN_PAGES,
    ];

    const lines = allUsers.map((u) => {
      const overrides = overridesByUser.get(u.id);
      const cells = [
        u.name,
        u.email,
        u.role,
        ...ALL_ADMIN_PAGES.map((page) => {
          const roleDefault = canAccess(u.role as UserRole, page);
          const effective = canAccessWithOverrides(u.role as UserRole, page, overrides);
          if (effective && !roleDefault) return "yes (granted)";
          if (!effective && roleDefault) return "no (revoked)";
          return effective ? "yes" : "no";
        }),
      ];
      return cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="permissions-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    logger.error("permissions export failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
