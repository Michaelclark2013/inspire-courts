import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// In-memory token store (TTL: 1 hour)
// In production with multiple instances, use Redis or a database
const resetTokens = new Map<string, { email: string; expires: number }>();

// Clean up expired tokens periodically
function cleanExpired() {
  const now = Date.now();
  for (const [token, data] of resetTokens) {
    if (data.expires < now) resetTokens.delete(token);
  }
}

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

    // Always return success (don't reveal if email exists — security best practice)
    const successResponse = NextResponse.json({
      success: true,
      message: "If that email is associated with an account, a reset link has been sent.",
    });

    // Only proceed if the email matches the admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || email.toLowerCase() !== adminEmail.toLowerCase()) {
      return successResponse;
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store token
    cleanExpired();
    resetTokens.set(token, { email: adminEmail, expires });

    // Send reset email
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: `"Inspire Courts" <${gmailUser}>`,
        to: adminEmail,
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
      // Email not configured — log a generic notice only (no token exposure)
      console.log("[Password Reset] Email transport not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD to enable email delivery.");
    }

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Export the token store so the reset route can access it
export { resetTokens };
