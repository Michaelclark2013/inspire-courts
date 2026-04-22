import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { waivers } from "@/lib/db/schema";
import { desc, eq, and, gte, lte, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Escape a value for RFC-4180 CSV (always quoted).
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/admin/waivers — read signed waivers (admin/tournaments access).
//   ?teamName=   filter by team name (case-sensitive exact match)
//   ?email=      filter by parent email
//   ?since=      ISO date, signed on/after
//   ?until=      ISO date, signed on/before
//   ?format=csv  download instead of JSON
//
// Non-paginated for now — the waivers table is expected to be small
// (hundreds per season). If it grows, add a limit+cursor like audit-log.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const teamName = sp.get("teamName");
  const email = sp.get("email");
  const since = sp.get("since");
  const until = sp.get("until");
  const format = sp.get("format");

  const filters: SQL[] = [];
  if (teamName) filters.push(eq(waivers.teamName, teamName));
  if (email) filters.push(eq(waivers.email, email.toLowerCase()));
  if (since) filters.push(gte(waivers.signedAt, since));
  if (until) filters.push(lte(waivers.signedAt, until));

  try {
    const rows = await db
      .select()
      .from(waivers)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(waivers.signedAt));

    if (format === "csv") {
      const header = ["id", "playerName", "parentName", "teamName", "email", "phone", "signedAt", "driveDocId"];
      const lines = [
        header.map(csvCell).join(","),
        ...rows.map((r) =>
          [r.id, r.playerName, r.parentName, r.teamName, r.email, r.phone, r.signedAt, r.driveDocId]
            .map(csvCell)
            .join(",")
        ),
      ];
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="waivers-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
          Vary: "Accept-Encoding",
        },
      });
    }

    // Last-Modified = newest signedAt in the result set so browsers + CDNs
    // can revalidate with If-Modified-Since and get a 304 when nothing
    // changed between polls (the data here is append-only, so "newest row's
    // signedAt" is a tight proxy for "last mutation").
    const lastModified = rows.length > 0 ? rows[0].signedAt : undefined;
    const headers: Record<string, string> = {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    };
    if (lastModified) {
      try {
        headers["Last-Modified"] = new Date(lastModified).toUTCString();
      } catch {
        // Non-fatal — a bad date just means the client can't use If-Modified-Since.
      }
    }
    return NextResponse.json(rows, { headers });
  } catch (err) {
    logger.error("Failed to fetch waivers", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch waivers" }, { status: 500 });
  }
}
