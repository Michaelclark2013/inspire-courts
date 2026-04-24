import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentGames, games, users } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

// GET /api/admin/launch-readiness
//
// Aggregates everything admins need to eyeball before going public:
//   - env var presence (does NOT return values, only booleans)
//   - cron wiring (vercel.json driven — we just report env secrets)
//   - tournaments potentially affected by the bracket-seeding bug fix
//     landed in commit 4d4aebb (single_elim, published/active, no
//     finalized games yet — safe to regenerate)
//   - DB user counts sanity check
//
// Admin-only. Returns JSON.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Env var presence (booleans only; never leak values) ────────────
  const env = {
    // Required core
    TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,

    // Auth + Google
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,

    // Payments (Square)
    SQUARE_ACCESS_TOKEN: !!process.env.SQUARE_ACCESS_TOKEN,
    SQUARE_LOCATION_ID: !!process.env.SQUARE_LOCATION_ID,
    SQUARE_WEBHOOK_SIGNATURE_KEY: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT ?? null,

    // Cron
    CRON_SECRET: !!process.env.CRON_SECRET,

    // Email
    GMAIL_USER: !!process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,

    // Analytics
    NEXT_PUBLIC_GA_ID:
      !!process.env.NEXT_PUBLIC_GA_ID || !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_META_PIXEL_ID: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: !!process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,

    // Optional integrations
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    NOTION_API_KEY: !!process.env.NOTION_API_KEY,
    MAILCHIMP_API_KEY: !!process.env.MAILCHIMP_API_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
  };

  // Tournaments that may have the old buggy seedings.
  // Criteria:
  //   - format = single_elim
  //   - status in (published, active)  -- draft has no bracket yet
  //   - no games have been played yet (no live/final tournament games)
  //
  // If there ARE live/final games, the bracket is "in flight" and a
  // regeneration would wipe real scores. Those need a manual migration.
  let affectedBrackets: Array<{
    id: number;
    name: string;
    status: string;
    safeToRegenerate: boolean;
    gameCount: number;
    playedCount: number;
  }> = [];
  try {
    const singleElim = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        status: tournaments.status,
      })
      .from(tournaments)
      .where(
        inArray(tournaments.status, ["published", "active"])
      );

    const singleElimIds = singleElim
      .filter(() => true)
      .map((t) => t.id);

    if (singleElimIds.length > 0) {
      // Count games per tournament (via tournament_games → games)
      const gameRows = await db
        .select({
          tournamentId: tournamentGames.tournamentId,
          status: games.status,
        })
        .from(tournamentGames)
        .innerJoin(games, eq(games.id, tournamentGames.gameId))
        .where(inArray(tournamentGames.tournamentId, singleElimIds));

      // Only consider single_elim tournaments for the seedings audit.
      // We don't have format in the initial query for brevity — re-fetch.
      const formatRows = await db
        .select({ id: tournaments.id, format: tournaments.format })
        .from(tournaments)
        .where(inArray(tournaments.id, singleElimIds));
      const formatById = new Map(formatRows.map((r) => [r.id, r.format]));

      const statsById = new Map<
        number,
        { total: number; played: number }
      >();
      for (const row of gameRows) {
        const s = statsById.get(row.tournamentId) ?? { total: 0, played: 0 };
        s.total++;
        if (row.status === "live" || row.status === "final") s.played++;
        statsById.set(row.tournamentId, s);
      }

      affectedBrackets = singleElim
        .filter((t) => formatById.get(t.id) === "single_elim")
        .map((t) => {
          const stats = statsById.get(t.id) ?? { total: 0, played: 0 };
          return {
            id: t.id,
            name: t.name,
            status: t.status,
            gameCount: stats.total,
            playedCount: stats.played,
            // Safe to reset + regenerate only if no games have been
            // played. The reset-bracket endpoint itself enforces this,
            // but the admin UI should surface it up-front.
            safeToRegenerate: stats.played === 0,
          };
        });
    }
  } catch {
    // DB query failures shouldn't block the launch page from rendering
    // the rest of the diagnostics.
  }

  // User sanity: we shouldn't launch with zero users or zero admins.
  let userStats = { totalUsers: 0, totalAdmins: 0 };
  try {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(users);
    const [{ admins }] = await db
      .select({ admins: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));
    userStats = { totalUsers: Number(total) || 0, totalAdmins: Number(admins) || 0 };
  } catch {
    // Ignore — surface as 0 in the UI.
  }

  // Summary flags to make the UI render traffic-light cards.
  const requiredEnvSet =
    env.TURSO_DATABASE_URL &&
    env.TURSO_AUTH_TOKEN &&
    env.NEXTAUTH_SECRET &&
    env.NEXTAUTH_URL &&
    env.ADMIN_EMAIL &&
    env.ADMIN_PASSWORD_HASH;

  const paymentsLive =
    env.SQUARE_ACCESS_TOKEN &&
    env.SQUARE_LOCATION_ID &&
    env.SQUARE_WEBHOOK_SIGNATURE_KEY &&
    env.SQUARE_ENVIRONMENT === "production";

  const emailLive = env.GMAIL_USER && env.GMAIL_APP_PASSWORD;
  const cronLive = env.CRON_SECRET;
  const analyticsLive = env.NEXT_PUBLIC_GA_ID;

  return NextResponse.json(
    {
      env,
      affectedBrackets,
      userStats,
      summary: {
        requiredEnvSet,
        paymentsLive,
        emailLive,
        cronLive,
        analyticsLive,
        bracketsNeedingRegenerate: affectedBrackets.filter(
          (b) => b.safeToRegenerate
        ).length,
        bracketsRequiringManualMigration: affectedBrackets.filter(
          (b) => !b.safeToRegenerate
        ).length,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
