import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { inquiries, users } from "@/lib/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { canAccess } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// GET /api/admin/inquiries?status=new&kind=training&format=csv
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "inquiries")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const kind = sp.get("kind");
  const format = sp.get("format");
  try {
    const filters = [];
    if (status === "open") filters.push(and(ne(inquiries.status, "won"), ne(inquiries.status, "lost")));
    else if (status) filters.push(eq(inquiries.status, status as "new"));
    if (kind) filters.push(eq(inquiries.kind, kind as "court_rental"));

    const rows = await db
      .select({
        id: inquiries.id,
        kind: inquiries.kind,
        status: inquiries.status,
        name: inquiries.name,
        email: inquiries.email,
        phone: inquiries.phone,
        sports: inquiries.sports,
        source: inquiries.source,
        message: inquiries.message,
        slaDueAt: inquiries.slaDueAt,
        firstTouchAt: inquiries.firstTouchAt,
        createdAt: inquiries.createdAt,
        assignedTo: inquiries.assignedTo,
        assignedName: users.name,
      })
      .from(inquiries)
      .leftJoin(users, eq(inquiries.assignedTo, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(inquiries.createdAt))
      .limit(200);

    // CSV export — same filters, marketing pulls these into Sheets weekly.
    if (format === "csv") {
      const headers = [
        "id", "kind", "status", "name", "email", "phone", "sports",
        "source", "createdAt", "slaDueAt", "firstTouchAt", "assignedTo",
      ].join(",");
      const escape = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return s.includes(",") || s.includes("\"") || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      const lines = rows.map((r) =>
        [r.id, r.kind, r.status, r.name, r.email, r.phone, r.sports, r.source,
         r.createdAt, r.slaDueAt, r.firstTouchAt, r.assignedName ?? r.assignedTo]
          .map(escape)
          .join(",")
      );
      const csv = [headers, ...lines].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Funnel rollup for the dashboard cards.
    const funnel = await db
      .select({
        kind: inquiries.kind,
        status: inquiries.status,
        n: sql<number>`count(*)`,
      })
      .from(inquiries)
      .groupBy(inquiries.kind, inquiries.status);

    return NextResponse.json({ rows, funnel });
  } catch (err) {
    logger.error("admin inquiries failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
