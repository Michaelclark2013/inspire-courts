import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournaments, tournamentTeams, tournamentGames } from "@/lib/db/schema";
import { asc, desc, eq, sql, inArray, and, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";
import { tournamentCreateSchema } from "@/lib/schemas";
import { apiValidationError } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// Safe sortable columns — prevents ORDER BY injection via ?sort=.
const TOURNAMENT_SORT_COLUMNS = {
  name: tournaments.name,
  status: tournaments.status,
  startDate: tournaments.startDate,
  createdAt: tournaments.createdAt,
} as const;

const VALID_STATUS = ["draft", "published", "active", "completed"] as const;

// GET /api/admin/tournaments — list tournaments with enriched counts.
//   ?status=draft|published|active|completed    filter
//   ?sort=name|status|startDate|createdAt       sortable
//   ?dir=asc|desc                               default desc for date columns
// Response: { data: Tournament[], total }
// Previously returned a bare array with no total/filter/sort.
export const GET = withTiming("admin.tournaments.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const sortKey = (sp.get("sort") || "createdAt") as keyof typeof TOURNAMENT_SORT_COLUMNS;
  const sortCol = TOURNAMENT_SORT_COLUMNS[sortKey] || tournaments.createdAt;
  const dir = sp.get("dir") === "asc" ? asc : sp.get("dir") === "desc" ? desc : null;
  const orderBy = dir
    ? dir(sortCol)
    : sortKey === "createdAt" || sortKey === "startDate"
      ? desc(sortCol)
      : asc(sortCol);

  const filters: SQL[] = [];
  if (statusFilter && (VALID_STATUS as readonly string[]).includes(statusFilter)) {
    filters.push(eq(tournaments.status, statusFilter as (typeof VALID_STATUS)[number]));
  }
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [allTournaments, [{ total }]] = await Promise.all([
    db.select().from(tournaments).where(whereClause).orderBy(orderBy),
    db.select({ total: sql<number>`count(*)` }).from(tournaments).where(whereClause),
  ]);

  if (allTournaments.length === 0) {
    return NextResponse.json({ data: [], total: Number(total) || 0 });
  }

  const ids = allTournaments.map((t) => t.id);

  // Batch: get all team counts in 1 query (instead of N)
  const teamCounts = await db
    .select({
      tournamentId: tournamentTeams.tournamentId,
      count: sql<number>`count(*)`,
    })
    .from(tournamentTeams)
    .where(inArray(tournamentTeams.tournamentId, ids))
    .groupBy(tournamentTeams.tournamentId);

  // Batch: get all game counts in 1 query (instead of N)
  const gameCounts = await db
    .select({
      tournamentId: tournamentGames.tournamentId,
      count: sql<number>`count(*)`,
    })
    .from(tournamentGames)
    .where(inArray(tournamentGames.tournamentId, ids))
    .groupBy(tournamentGames.tournamentId);

  const teamMap = new Map(teamCounts.map((r) => [r.tournamentId, r.count]));
  const gameMap = new Map(gameCounts.map((r) => [r.tournamentId, r.count]));

  const enriched = allTournaments.map((t) => ({
    ...t,
    divisions: t.divisions ? JSON.parse(t.divisions) : [],
    courts: t.courts ? JSON.parse(t.courts) : [],
    teamCount: teamMap.get(t.id) ?? 0,
    gameCount: gameMap.get(t.id) ?? 0,
  }));

  return NextResponse.json(
    { data: enriched, total: Number(total) || 0 },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
  );
});

// POST /api/admin/tournaments — create a tournament
export const POST = withTiming("admin.tournaments.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit creates. 10 new tournaments per minute is well above
  // legitimate admin use; anything higher is either a bug or abuse.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-create-tournament:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many tournament-create requests. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Idempotency: if the caller sent an Idempotency-Key header and we've
  // already seen it from this user, return the cached response so network
  // retries don't duplicate-insert a tournament.
  const idemKey = request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = tournamentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_root";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return apiValidationError(fieldErrors);
  }

  const {
    name,
    startDate,
    endDate,
    location,
    format,
    divisions,
    courts,
    gameLength,
    breakLength,
    entryFee,
    maxTeamsPerDivision,
    registrationDeadline,
    registrationOpen,
    description,
  } = parsed.data;

  const userId = session.user.id ? Number(session.user.id) : null;

  try {
    const [tournament] = await db
      .insert(tournaments)
      .values({
        name: name.trim().slice(0, 200),
        startDate,
        endDate: endDate || null,
        location: location ? location.slice(0, 500) : null,
        format: format ?? "single_elim",
        divisions: divisions ? JSON.stringify(divisions) : null,
        courts: courts ? JSON.stringify(courts) : null,
        gameLength: gameLength ?? 40,
        breakLength: breakLength ?? 10,
        entryFee: entryFee ?? null,
        maxTeamsPerDivision: maxTeamsPerDivision ?? null,
        registrationDeadline: registrationDeadline || null,
        registrationOpen: Boolean(registrationOpen),
        description: description ? description.slice(0, 5000) : null,
        status: "draft",
        createdBy: userId && !isNaN(userId) ? userId : null,
      })
      .returning();

    revalidatePath("/tournaments");
    revalidatePath("/admin/tournaments");
    storeIdempotent(session.user.id, idemKey, tournament, 201);
    return NextResponse.json(tournament, { status: 201 });
  } catch (err) {
    logger.error("Failed to create tournament", { error: String(err) });
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
});
