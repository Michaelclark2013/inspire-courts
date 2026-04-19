import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  auditLog,
  tournamentRegistrations,
  games,
  users,
} from "@/lib/db/schema";
import { and, desc, gte, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

// POST /api/admin/cron/digest
//
// Daily digest cron. Summarises the last 24 hours of admin activity and
// emails it to ADMIN_EMAIL. Intended to be triggered by Vercel Cron once
// per day (auth via CRON_SECRET Bearer, same pattern as maintenance).
//
// Gives admins passive oversight without polling the audit log — they see
// approvals, rejections, score entries, announcement changes, and tourney
// mutations as a one-glance email.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Digest cron disabled (CRON_SECRET not configured)" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const cronHeader = request.headers.get("x-cron-secret") || "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : cronHeader;
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      actionHistogram,
      [{ newRegistrations }],
      [{ finalGames }],
      [{ newUsers }],
      recent,
    ] = await Promise.all([
      db
        .select({ action: auditLog.action, count: sql<number>`count(*)` })
        .from(auditLog)
        .where(gte(auditLog.createdAt, since))
        .groupBy(auditLog.action)
        .orderBy(desc(sql`count(*)`)),
      db
        .select({ newRegistrations: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(gte(tournamentRegistrations.createdAt, since)),
      db
        .select({ finalGames: sql<number>`count(*)` })
        .from(games)
        .where(and(gte(games.createdAt, since))),
      db
        .select({ newUsers: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, since)),
      db
        .select()
        .from(auditLog)
        .where(gte(auditLog.createdAt, since))
        .orderBy(desc(auditLog.createdAt))
        .limit(20),
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    let emailed = false;
    if (adminEmail && gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPass },
        });

        const histHtml = actionHistogram
          .map((a) => `<li><code>${a.action}</code> × ${a.count}</li>`)
          .join("");
        const recentHtml = recent
          .map(
            (r) =>
              `<tr><td>${new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/Phoenix" })}</td><td>${r.action}</td><td>${r.entityType}${r.entityId ? `#${r.entityId}` : ""}</td><td>${r.actorEmail ?? ""}</td></tr>`
          )
          .join("");

        await transporter.sendMail({
          from: `"Inspire Courts Digest" <${gmailUser}>`,
          to: adminEmail,
          subject: `Inspire Courts — 24h admin digest (${new Date().toISOString().slice(0, 10)})`,
          html: `
            <div style="font-family:system-ui,sans-serif;font-size:14px;color:#0B1D3A;">
              <h2>Last 24 hours</h2>
              <ul>
                <li><strong>${newRegistrations}</strong> new registrations</li>
                <li><strong>${finalGames}</strong> games created</li>
                <li><strong>${newUsers}</strong> new users</li>
              </ul>
              <h3>Audit actions</h3>
              <ul>${histHtml || "<li>No audit activity</li>"}</ul>
              <h3>Recent entries (20 newest)</h3>
              <table style="border-collapse:collapse;font-size:12px;">
                <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Actor</th></tr></thead>
                <tbody>${recentHtml}</tbody>
              </table>
            </div>`,
        });
        emailed = true;
      } catch (err) {
        logger.error("Digest email send failed", { error: String(err) });
      }
    }

    return NextResponse.json({
      ok: true,
      since,
      emailed,
      totals: {
        newRegistrations: Number(newRegistrations) || 0,
        gamesCreated: Number(finalGames) || 0,
        newUsers: Number(newUsers) || 0,
        auditActions: actionHistogram.length,
        recentCount: recent.length,
      },
    });
  } catch (err) {
    logger.error("Digest cron failed", { error: String(err) });
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
