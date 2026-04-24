import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { waivers } from "@/lib/db/schema";
import { desc, eq, and, gte, isNotNull, lt, lte, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { waiverSignSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, csvCell } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import { getClientIp } from "@/lib/rate-limit";

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
  // Waivers 2.0 filters — expiration-aware lookups.
  const memberIdRaw = sp.get("memberId");
  const memberId = Number(memberIdRaw);
  if (memberIdRaw && Number.isInteger(memberId) && memberId > 0) {
    filters.push(eq(waivers.memberId, memberId));
  }
  const programIdRaw = sp.get("programId");
  const programId = Number(programIdRaw);
  if (programIdRaw && Number.isInteger(programId) && programId > 0) {
    filters.push(eq(waivers.programId, programId));
  }
  const nowIso = new Date().toISOString();
  if (sp.get("expired") === "true") {
    filters.push(isNotNull(waivers.expiresAt));
    filters.push(lt(waivers.expiresAt, nowIso));
  }
  const expiringInDaysRaw = sp.get("expiringInDays");
  if (expiringInDaysRaw) {
    const days = Math.max(1, Math.min(365, Number(expiringInDaysRaw) || 30));
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    filters.push(isNotNull(waivers.expiresAt));
    filters.push(gte(waivers.expiresAt, nowIso));
    filters.push(lt(waivers.expiresAt, cutoff));
  }

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

// POST /api/admin/waivers — admin-assisted waiver signing. Parent or
// player signs on a front-desk tablet; this captures:
//   - the typed name (legal reinforcement)
//   - the drawn signature as a base64 PNG data URL
//   - IP + User-Agent at sign time
//   - version string so future waiver text changes are auditable
// Default 1-year expiration if none supplied.
export const POST = withTiming("admin.waivers.sign", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, waiverSignSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const ip = getClientIp(request);
    const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;
    const expiresAt =
      b.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const [created] = await db
      .insert(waivers)
      .values({
        playerName: b.playerName,
        parentName: b.parentName ?? null,
        teamName: b.teamName ?? null,
        email: b.email ? b.email.toLowerCase() : null,
        phone: b.phone ?? null,
        signatureDataUrl: b.signatureDataUrl,
        signedByName: b.signedByName,
        waiverType: b.waiverType ?? "general",
        programId: b.programId ?? null,
        memberId: b.memberId ?? null,
        waiverVersion: b.waiverVersion ?? "v1",
        expiresAt,
        signedUserAgent: ua,
        signedIp: ip,
      })
      .returning({
        id: waivers.id,
        playerName: waivers.playerName,
        signedAt: waivers.signedAt,
        expiresAt: waivers.expiresAt,
      });
    await recordAudit({
      session,
      request,
      action: "waiver.signed",
      entityType: "waiver",
      entityId: created.id,
      before: null,
      after: {
        player: b.playerName,
        signer: b.signedByName,
        waiverType: b.waiverType ?? "general",
        expiresAt,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to sign waiver", { error: String(err) });
    return apiError("Failed to sign waiver", 500);
  }
});
