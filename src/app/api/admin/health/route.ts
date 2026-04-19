import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isGoogleConfigured } from "@/lib/google-sheets";
import { logger } from "@/lib/logger";

// Track when the server process started so we can report uptime.
// Module-level so it's set once per Lambda / node process.
const BOOT_TIME = Date.now();

type HealthStatus = "ok" | "error" | "unconfigured";

interface HealthResponse {
  status: HealthStatus;
  checkedAt: string;
  uptimeSeconds: number;
  checks: {
    db: HealthStatus;
    sheets: HealthStatus;
    nodemailer: HealthStatus;
    auth: HealthStatus;
  };
  errors?: Record<string, string>;
}

// GET /api/admin/health — admin-facing health/readiness probe.
//
// Admin-only so the checks list (which confirms exact env var presence)
// isn't public. Runs a lightweight DB ping, checks Google Sheets config,
// checks nodemailer + next-auth env state, and returns structured JSON
// with a per-check status. HTTP 200 when everything is ok, 503 when the
// DB check fails (hard dependency). Non-DB misconfig returns 200 with
// per-check "unconfigured" — those are degradations, not outages.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: Record<string, string> = {};

  // DB: SELECT 1 is the cheapest liveness probe.
  let dbStatus: HealthStatus = "ok";
  try {
    await db.run(sql`SELECT 1`);
  } catch (err) {
    dbStatus = "error";
    errors.db = String(err);
    logger.error("Health probe: DB check failed", { error: String(err) });
  }

  // Google Sheets: wrapper already returns a boolean.
  const sheetsStatus: HealthStatus = isGoogleConfigured() ? "ok" : "unconfigured";

  // Nodemailer: same gmail env pair notify.ts uses.
  const nodemailerStatus: HealthStatus =
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD ? "ok" : "unconfigured";

  // NextAuth: NEXTAUTH_SECRET must be set or sessions won't decode.
  const authStatus: HealthStatus = process.env.NEXTAUTH_SECRET ? "ok" : "error";
  if (authStatus === "error") errors.auth = "NEXTAUTH_SECRET is not set";

  // Overall status: error if DB or auth is down (hard deps); otherwise ok.
  const overall: HealthStatus = dbStatus === "error" || authStatus === "error" ? "error" : "ok";

  const body: HealthResponse = {
    status: overall,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - BOOT_TIME) / 1000),
    checks: { db: dbStatus, sheets: sheetsStatus, nodemailer: nodemailerStatus, auth: authStatus },
    ...(Object.keys(errors).length > 0 ? { errors } : {}),
  };

  return NextResponse.json(body, {
    status: overall === "error" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
