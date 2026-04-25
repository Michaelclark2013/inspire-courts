import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, permissionTemplates, resources, equipment, tournaments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/launch-status
// Comprehensive launch-readiness report. Checks every env var listed
// in the go-live checklist, counts of critical seed data, and surfaces
// exactly what's still missing.

type Check = { key: string; present: boolean; note?: string };

function checkEnv(name: string, note?: string): Check {
  const v = process.env[name];
  return { key: name, present: !!(v && v.length > 0), note };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const env = {
      critical: [
        checkEnv("DATABASE_URL"),
        checkEnv("DATABASE_AUTH_TOKEN"),
        checkEnv("NEXTAUTH_URL"),
        checkEnv("NEXTAUTH_SECRET"),
      ],
      auth: [
        checkEnv("GOOGLE_CLIENT_ID", "Optional — only if Google OAuth login is enabled"),
        checkEnv("GOOGLE_CLIENT_SECRET", "Optional — only if Google OAuth login is enabled"),
      ],
      email: [
        checkEnv("RESEND_API_KEY", "Preferred — higher deliverability + domain auth"),
        checkEnv("RESEND_FROM_EMAIL", "e.g. noreply@inspirecourtsaz.com"),
        checkEnv("GMAIL_USER", "Fallback if Resend isn't configured"),
        checkEnv("GMAIL_APP_PASSWORD", "Fallback if Resend isn't configured"),
      ],
      payments: [
        checkEnv("SQUARE_ACCESS_TOKEN"),
        checkEnv("SQUARE_LOCATION_ID"),
        checkEnv("SQUARE_ENVIRONMENT", "Should be 'production' for live"),
        checkEnv("SQUARE_WEBHOOK_SIGNATURE_KEY"),
      ],
      sheets: [
        checkEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        checkEnv("GOOGLE_PRIVATE_KEY"),
      ],
      push: [
        checkEnv("VAPID_PUBLIC_KEY"),
        checkEnv("VAPID_PRIVATE_KEY"),
        checkEnv("VAPID_SUBJECT"),
      ],
      analytics: [
        checkEnv("NEXT_PUBLIC_GA_ID"),
        checkEnv("NEXT_PUBLIC_META_PIXEL_ID", "Optional"),
      ],
      calendar: [
        checkEnv("GYM_CAL_TOKEN"),
      ],
      cron: [
        checkEnv("CRON_SECRET"),
      ],
    };

    // Seed data counts — so admin sees whether the obvious first-run
    // items have been populated.
    const [adminCount, templateCount, fleetCount, equipmentCount, tournamentCount] = await Promise.all([
      db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin")),
      db.select({ n: sql<number>`count(*)` }).from(permissionTemplates),
      db.select({ n: sql<number>`count(*)` }).from(resources).where(eq(resources.active, true)),
      db.select({ n: sql<number>`count(*)` }).from(equipment).where(eq(equipment.active, true)),
      db.select({ n: sql<number>`count(*)` }).from(tournaments),
    ]);

    const seed = {
      adminUsers: Number(adminCount[0]?.n) || 0,
      permissionTemplates: Number(templateCount[0]?.n) || 0,
      fleetVehicles: Number(fleetCount[0]?.n) || 0,
      equipmentItems: Number(equipmentCount[0]?.n) || 0,
      tournaments: Number(tournamentCount[0]?.n) || 0,
    };

    // Roll up a "launch-ready" boolean per category.
    const critical = env.critical.every((c) => c.present);
    // Email is ready if EITHER transport is fully configured.
    const resendReady = !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL;
    const gmailReady = !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;
    const emailReady = resendReady || gmailReady;
    const paymentsReady = env.payments.every((c) => c.present) && process.env.SQUARE_ENVIRONMENT === "production";
    const pushReady = env.push.every((c) => c.present);
    const calendarReady = env.calendar.every((c) => c.present);
    const cronReady = env.cron.every((c) => c.present);

    return NextResponse.json(
      {
        env,
        seed,
        rollup: {
          critical,
          emailReady,
          paymentsReady,
          paymentsSandboxOnly: env.payments.every((c) => c.present) && process.env.SQUARE_ENVIRONMENT !== "production",
          pushReady,
          calendarReady,
          cronReady,
          hasAdmin: seed.adminUsers > 0,
          hasTournament: seed.tournaments > 0,
          hasVehicles: seed.fleetVehicles > 0,
          hasInventory: seed.equipmentItems > 0,
          hasTemplates: seed.permissionTemplates > 0,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("launch-status failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
