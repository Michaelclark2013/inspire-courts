import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resourceBookings,
  tournamentRegistrations,
  expenses,
  users,
  games,
  checkins,
  staffCertifications,
  equipment,
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { sendBroadcastEmail } from "@/lib/notify";

// GET /api/admin/weekly-digest[?email=someone@example.com&send=1]
// Assembles a weekly ops rollup (last 7 days): rental revenue,
// expenses, signups, games played, new teams, check-ins, expiring
// certifications, low stock. Returns JSON by default; with ?send=1
// emails the HTML summary to the admin (or `email` param).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const shouldSend = searchParams.get("send") === "1";
    const toEmail = searchParams.get("email") || session.user.email || "";

    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const nowIso = now.toISOString();

    const [
      rentalRevenue,
      tournamentRevenue,
      expensesWeek,
      signupsWeek,
      gamesPlayed,
      newTeams,
      checkinCount,
      expiringCerts,
      lowStock,
    ] = await Promise.all([
      db
        .select({ n: sql<number>`coalesce(sum(${resourceBookings.totalCents}), 0)` })
        .from(resourceBookings)
        .where(and(eq(resourceBookings.status, "returned"), gte(resourceBookings.checkinAt, weekAgo))),
      db
        .select({ n: sql<number>`coalesce(sum(${tournamentRegistrations.entryFee}), 0)` })
        .from(tournamentRegistrations)
        .where(and(eq(tournamentRegistrations.paymentStatus, "paid"), gte(tournamentRegistrations.updatedAt, weekAgo))),
      db
        .select({ n: sql<number>`coalesce(sum(${expenses.amountCents}), 0)` })
        .from(expenses)
        .where(gte(expenses.incurredAt, weekAgo)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, weekAgo)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(games)
        .where(and(eq(games.status, "final"), gte(games.scheduledTime, weekAgo))),
      db
        .select({ n: sql<number>`count(distinct ${tournamentRegistrations.teamName})` })
        .from(tournamentRegistrations)
        .where(gte(tournamentRegistrations.createdAt, weekAgo)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(checkins)
        .where(and(eq(checkins.type, "checkin"), gte(checkins.timestamp, weekAgo))),
      db
        .select({ n: sql<number>`count(*)` })
        .from(staffCertifications)
        .where(
          and(
            lte(staffCertifications.expiresAt, new Date(Date.now() + 30 * 864e5).toISOString()),
            gte(staffCertifications.expiresAt, nowIso)
          )
        ),
      db
        .select({ n: sql<number>`count(*)` })
        .from(equipment)
        .where(
          and(
            eq(equipment.active, true),
            sql`${equipment.onHand} <= ${equipment.minQuantity}`
          )
        ),
    ]);

    const summary = {
      periodStart: weekAgo,
      periodEnd: nowIso,
      rentalRevenueCents: Number(rentalRevenue[0]?.n) || 0,
      tournamentRevenueCents: Number(tournamentRevenue[0]?.n) || 0,
      expenseCents: Number(expensesWeek[0]?.n) || 0,
      newSignups: Number(signupsWeek[0]?.n) || 0,
      gamesPlayed: Number(gamesPlayed[0]?.n) || 0,
      newTeams: Number(newTeams[0]?.n) || 0,
      checkins: Number(checkinCount[0]?.n) || 0,
      expiringCerts: Number(expiringCerts[0]?.n) || 0,
      lowStockItems: Number(lowStock[0]?.n) || 0,
    };

    const totalRevenue = summary.rentalRevenueCents + summary.tournamentRevenueCents;
    const profit = totalRevenue - summary.expenseCents;
    const fmt = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0a1b2e; font-size: 28px;">Weekly Ops Digest</h1>
        <p style="color: #666;">Inspire Courts AZ · ${new Date(weekAgo).toLocaleDateString()} – ${new Date(nowIso).toLocaleDateString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <h2 style="color: #0a1b2e; font-size: 20px;">💰 Finance</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td>Rental revenue</td><td style="text-align: right; font-weight: bold;">${fmt(summary.rentalRevenueCents)}</td></tr>
          <tr><td>Tournament entry fees</td><td style="text-align: right; font-weight: bold;">${fmt(summary.tournamentRevenueCents)}</td></tr>
          <tr><td>Expenses</td><td style="text-align: right; font-weight: bold; color: #cc0000;">${fmt(summary.expenseCents)}</td></tr>
          <tr style="border-top: 2px solid #0a1b2e;"><td><strong>Profit</strong></td><td style="text-align: right; font-weight: bold; color: ${profit >= 0 ? "#059669" : "#cc0000"};">${fmt(profit)}</td></tr>
        </table>
        <h2 style="color: #0a1b2e; font-size: 20px; margin-top: 32px;">📈 Activity</h2>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li><strong>${summary.newSignups}</strong> new account signups</li>
          <li><strong>${summary.newTeams}</strong> new team registrations</li>
          <li><strong>${summary.gamesPlayed}</strong> games played</li>
          <li><strong>${summary.checkins}</strong> player check-ins</li>
        </ul>
        <h2 style="color: #0a1b2e; font-size: 20px; margin-top: 32px;">⚠️ Action Needed</h2>
        <ul style="padding-left: 20px; line-height: 1.8;">
          ${summary.expiringCerts > 0 ? `<li style="color: #d97706;"><strong>${summary.expiringCerts}</strong> staff certifications expire in the next 30 days</li>` : ""}
          ${summary.lowStockItems > 0 ? `<li style="color: #d97706;"><strong>${summary.lowStockItems}</strong> inventory items below reorder threshold</li>` : ""}
          ${summary.expiringCerts === 0 && summary.lowStockItems === 0 ? `<li style="color: #059669;">All compliance and inventory healthy ✓</li>` : ""}
        </ul>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #666; font-size: 12px;">Generated by Inspire Courts admin dashboard.</p>
      </div>
    `;

    if (shouldSend && toEmail) {
      await sendBroadcastEmail({
        recipients: [toEmail],
        subject: `Weekly Ops Digest · ${new Date().toLocaleDateString()}`,
        html,
      });
      return NextResponse.json({ ok: true, summary, sent: true, to: toEmail });
    }

    return NextResponse.json({ ok: true, summary, html });
  } catch (err) {
    logger.error("weekly digest failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
