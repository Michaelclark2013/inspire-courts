import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkins } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import {
  appendSheetRow,
  isGoogleConfigured,
  sanitizeSheetRow,
  SHEETS,
} from "@/lib/google-sheets";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";
import { checkinSchema } from "@/lib/schemas";
import { apiValidationError } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const ALLOWED_ROLES = ["admin", "front_desk", "staff"];

// Escape a value for RFC-4180 CSV (always quoted).
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/admin/checkin — list check-ins (admin/front_desk/staff).
//   ?teamName=   filter by team (exact match)
//   ?division=   filter by division
//   ?since=      ISO date, checked-in on/after
//   ?until=      ISO date, checked-in on/before
//   ?format=csv  download CSV instead of JSON
export const GET = withTiming("admin.checkin.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const teamName = sp.get("teamName");
  const division = sp.get("division");
  const since = sp.get("since");
  const until = sp.get("until");
  const format = sp.get("format");

  const filters: SQL[] = [];
  if (teamName) filters.push(eq(checkins.teamName, teamName));
  if (division) filters.push(eq(checkins.division, division));
  if (since) filters.push(gte(checkins.timestamp, since));
  if (until) filters.push(lte(checkins.timestamp, until));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  try {
    if (format === "csv") {
      // CSV: unbounded — admins want the full filtered set.
      const rows = await db
        .select()
        .from(checkins)
        .where(whereClause)
        .orderBy(desc(checkins.timestamp));

      const header = ["id", "playerName", "teamName", "division", "type", "checkedInBy", "timestamp"];
      const lines = [
        header.map(csvCell).join(","),
        ...rows.map((r) =>
          [r.id, r.playerName, r.teamName, r.division, r.type, r.checkedInBy, r.timestamp]
            .map(csvCell)
            .join(",")
        ),
      ];
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="checkins-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
          Vary: "Accept-Encoding",
        },
      });
    }

    // JSON: paginated. Default 50, capped at 200.
    const CHECKIN_MAX_LIMIT = 200;
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const rawLimit = Math.floor(Number(sp.get("limit")) || 50);
    const limit = Math.min(Math.max(1, rawLimit || 50), CHECKIN_MAX_LIMIT);
    const offset = (page - 1) * limit;

    const [pagedRows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(checkins)
        .where(whereClause)
        .orderBy(desc(checkins.timestamp))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)` }).from(checkins).where(whereClause),
    ]);

    // Cheap ETag — total + newest row timestamp. Front-desk tablets poll
    // this list during tournaments; a 304 saves the full payload.
    const newest = pagedRows[0]?.timestamp ?? "";
    const etag = `"${total}-${newest}-p${page}l${limit}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        },
      });
    }

    return NextResponse.json(
      {
        data: pagedRows,
        total: Number(total) || 0,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil((Number(total) || 0) / limit)),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
          ETag: etag,
        },
      }
    );
  } catch (err) {
    logger.error("Failed to fetch check-ins", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
});

// POST /api/admin/checkin — check in a player (dual-write: DB + Sheets)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit check-in POSTs. A misbehaving tablet / compromised
  // front-desk session could otherwise blast the DB + Sheets endpoint.
  // 120/min per IP is well above even a busy tournament weigh-in.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-checkin:${ip}`, 120, 60_000)) {
    return NextResponse.json(
      { error: "Too many check-in attempts. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkinSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_root";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return apiValidationError(fieldErrors);
  }

  // Idempotency — a front-desk tablet with flaky wifi can otherwise
  // double-check-in the same player.
  const idemKey = request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  const { playerName, teamName, division, type } = parsed.data;
  const safeType = type ?? "checkin";
  const safeName = playerName.trim().slice(0, 100);
  const safeTeam = teamName ? teamName.trim().slice(0, 100) : "";
  const safeDivision = division ? String(division).trim().slice(0, 50) : null;

  const userId = session.user.id ? Number(session.user.id) : null;

  let insertedRow: typeof checkins.$inferSelect | undefined;
  try {
    // Write to DB (source of truth) — .returning() so the caller gets the
    // new row's id, matching the pattern used by every other admin POST.
    const [row] = await db
      .insert(checkins)
      .values({
        playerName: safeName,
        teamName: safeTeam,
        division: safeDivision,
        type: safeType,
        checkedInBy: userId && !isNaN(userId) ? userId : null,
      })
      .returning();
    insertedRow = row;
  } catch (err) {
    logger.error("Failed to insert check-in", { error: String(err) });
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }

  // Fire-and-forget: write to Google Sheets. Sheet marker mirrors type so
  // the spreadsheet view distinguishes check-ins from no-shows.
  if (isGoogleConfigured()) {
    const timestamp = timestampAZ();
    const sheetMarker = safeType === "no_show" ? "NO_SHOW" : safeType === "waiver" ? "WAIVER" : "CHECKIN";
    appendSheetRow(SHEETS.playerCheckIn, "A:F", [
      sanitizeSheetRow([timestamp, safeName, safeTeam, safeDivision || "", sheetMarker, session.user.name || ""]),
    ]).catch((err) => logger.warn("Failed to sync check-in to Google Sheets", { error: String(err) }));
  }

  const responseBody = { success: true, type: safeType, checkin: insertedRow };
  storeIdempotent(session.user.id, idemKey, responseBody, 201);
  // Return 201 for create consistency with every other admin create endpoint.
  return NextResponse.json(responseBody, { status: 201 });
}
