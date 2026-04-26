import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetTokens, users } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/users/[id]/reset-password
//
// Admin-triggered password reset for a specific user (e.g. a locked-out
// coach). Issues a single-use reset token, stores it in `resetTokens`,
// and emails the target user a reset link — identical flow to the public
// /api/auth/forgot-password, but admin-gated and audited.
//
// Always returns 200 with { success: true }; never leaks whether the
// target id exists. Emits user.password_reset_triggered audit entry.
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const [target] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) {
      // 404 is OK here — this endpoint is admin-only, so leaking whether
      // an id exists is not a meaningful attack surface.
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a secure token + 1-hour window (same as public flow).
    // Only the SHA-256 hash is persisted — the raw token is what we
    // email, and reset-password hashes the submitted value before lookup.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Prune expired tokens then insert fresh one.
    await db.delete(resetTokens).where(lt(resetTokens.expiresAt, new Date().toISOString()));
    await db.insert(resetTokens).values({ email: target.email, token: tokenHash, expiresAt });

    // Fire-and-forget email via the same Gmail transport the public flow uses.
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    let emailed = false;
    if (gmailUser && gmailPass) {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPass },
        });
        await transporter.sendMail({
          from: `"Inspire Courts" <${gmailUser}>`,
          to: target.email,
          subject: "Password Reset — Inspire Courts Dashboard",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background: #0B1D3A; padding: 32px 24px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="color: white; margin: 0; font-size: 16px; letter-spacing: 2px;">INSPIRE COURTS</h2>
              </div>
              <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
                <p style="color: #333; font-size: 14px; line-height: 1.6;">
                  An administrator initiated a password reset for your Inspire Courts account. Click below to choose a new password.
                </p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${resetUrl}" style="background: #CC0000; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #999; font-size: 12px; line-height: 1.5;">
                  This link expires in 1 hour. If you didn't expect this, contact your admin.
                </p>
              </div>
            </div>`,
        });
        emailed = true;
      } catch (err) {
        logger.warn("Admin password reset email failed to send", {
          userId,
          error: String(err),
        });
      }
    }

    await recordAudit({
      session,
      request,
      action: "user.password_reset_triggered",
      entityType: "user",
      entityId: userId,
      before: null,
      after: { targetEmail: target.email, emailed, tokenExpiresAt: expiresAt },
    });

    return NextResponse.json({
      success: true,
      emailed,
      message: emailed
        ? `Password reset email sent to ${target.email}.`
        : "Token created but email transport not configured. Share the token manually.",
    });
  } catch (err) {
    logger.error("Admin password reset failed", { userId, error: String(err) });
    return NextResponse.json({ error: "Failed to trigger password reset" }, { status: 500 });
  }
}
