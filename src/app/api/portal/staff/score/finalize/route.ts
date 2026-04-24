import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, pushSubscriptions, tournamentRegistrations } from "@/lib/db/schema";
import { eq, inArray, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { sendPushNotification, isVapidConfigured } from "@/lib/push-notifications";

// POST /api/portal/staff/score/finalize
// Body: { gameId, homeScore, awayScore, photoDataUrl? }
// Marks a game final, stamps finalizedBy/finalizedAt, stores the
// scoreboard photo, and pushes a notification (no email) to both
// teams' coaches.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);

  try {
    const body = await request.json();
    const gameId = Number(body?.gameId);
    const homeScore = Number(body?.homeScore);
    const awayScore = Number(body?.awayScore);
    const photoDataUrl = typeof body?.photoDataUrl === "string" ? body.photoDataUrl : null;

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
      return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
    }
    // Cap data URL size at ~300KB to avoid blowing up the DB row.
    if (photoDataUrl && photoDataUrl.length > 400_000) {
      return NextResponse.json({ error: "Photo too large (max ~300KB)" }, { status: 400 });
    }

    const [before] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nowIso = new Date().toISOString();
    await db
      .update(games)
      .set({
        status: "final",
        finalizedBy: uid,
        finalizedAt: nowIso,
        finalScoreboardPhotoUrl: photoDataUrl || before.finalScoreboardPhotoUrl,
      })
      .where(eq(games.id, gameId));

    await recordAudit({
      session,
      request,
      action: "game.finalized",
      entityType: "game",
      entityId: gameId,
      before: { status: before.status },
      after: {
        status: "final",
        homeTeam: before.homeTeam,
        awayTeam: before.awayTeam,
        homeScore,
        awayScore,
        hasPhoto: !!photoDataUrl,
      },
    });

    // Push to both teams' coaches (no email). We find coach emails on
    // any registration matching the team names, then push to every
    // push_subscription that's tied to those emails.
    try {
      if (isVapidConfigured()) {
        const regs = await db
          .select({ coachEmail: tournamentRegistrations.coachEmail, teamName: tournamentRegistrations.teamName })
          .from(tournamentRegistrations)
          .where(
            or(
              eq(tournamentRegistrations.teamName, before.homeTeam),
              eq(tournamentRegistrations.teamName, before.awayTeam)
            )
          );
          const emails = Array.from(new Set(regs.map((r) => (r.coachEmail || "").toLowerCase()).filter(Boolean)));
        if (emails.length > 0) {
          const subs = await db
            .select()
            .from(pushSubscriptions)
            .where(inArray(pushSubscriptions.userEmail, emails));
          const title = "Final Score";
          const pushBody = `${before.homeTeam} ${homeScore} — ${awayScore} ${before.awayTeam}`;
          for (const s of subs) {
            try {
              await sendPushNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                { title, body: pushBody, url: `/scores/live/${gameId}` }
              );
            } catch (err) {
              logger.warn("final push delivery failed", { error: String(err), subId: s.id });
            }
          }
        }
      }
    } catch (err) {
      logger.warn("finalize push fan-out failed", { error: String(err) });
    }

    revalidatePath("/scores");
    revalidatePath(`/scores/live/${gameId}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("finalize failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
