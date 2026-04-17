import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { resetTokens, users } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip, 3, 15 * 60 * 1000)) {
    return NextResponse.json({
      success: true,
      message: "If that email is associated with an account, a reset link has been sent.",
    });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const successResponse = NextResponse.json({
      success: true,
      message: "If that email is associated with an account, a reset link has been sent.",
    });

    // Look up user in DB (case-insensitive)
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Also check env-var admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const isEnvAdmin = adminEmail && email.toLowerCase() === adminEmail.toLowerCase();

    if (!dbUser && !isEnvAdmin) {
      return successResponse; // Don't reveal if email exists
    }

    const targetEmail = dbUser?.email || adminEmail!;

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Clean expired tokens and store new one in DB
    try {
      await db.delete(resetTokens).where(lt(resetTokens.expiresAt, new Date().toISOString()));
      await db.insert(resetTokens).values({
        email: targetEmail,
        token,
        expiresAt,
      });
    } catch (err) {
      logger.error("Failed to store reset token", { error: String(err) });
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    // Send reset email
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      const baseUrl = process.env.NEXTAUTH_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: `"Inspire Courts" <${gmailUser}>`,
        to: targetEmail,
        subject: "Password Reset — Inspire Courts Dashboard",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background: #0B1D3A; padding: 32px 24px; border-radius: 8px 8px 0 0; text-align: center;">
              <img src="${baseUrl}/images/inspire-athletics-logo.png" alt="Inspire Courts" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 12px;" />
              <h2 style="color: white; margin: 0; font-size: 16px; letter-spacing: 2px;">INSPIRE COURTS</h2>
            </div>
            <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 14px; line-height: 1.6;">
                A password reset was requested for your Inspire Courts admin dashboard account. Click the button below to set a new password.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetUrl}" style="background: #CC0000; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #999; font-size: 12px; line-height: 1.5;">
                This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
              <p style="color: #bbb; font-size: 11px; text-align: center;">
                Inspire Courts AZ &bull; Gilbert, Arizona
              </p>
            </div>
          </div>
        `,
      });
    } else {
      // Email transport not configured — GMAIL_USER and GMAIL_APP_PASSWORD not set
    }

    return successResponse;
  } catch (error) {
    logger.error("Forgot password error", { error: String(error) });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
