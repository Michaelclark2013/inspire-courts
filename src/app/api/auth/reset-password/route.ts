import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetTokens, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = getClientIp(request);
  if (isRateLimited(ip, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Look up token in DB
    const [tokenData] = await db
      .select()
      .from(resetTokens)
      .where(eq(resetTokens.token, token))
      .limit(1);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    if (tokenData.usedAt || new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const newHash = await bcrypt.hash(password, 12);

    // Check if this is the env-var admin or a DB user
    const adminEmail = process.env.ADMIN_EMAIL;
    const isEnvAdmin = adminEmail && tokenData.email.toLowerCase() === adminEmail.toLowerCase();

    if (isEnvAdmin) {
      // For env-var admin: upsert a DB user record with the new password
      // Auth checks DB users first, so this will take precedence over the env hash
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, tokenData.email))
        .limit(1);

      if (existing) {
        await db
          .update(users)
          .set({ passwordHash: newHash, updatedAt: new Date().toISOString() })
          .where(eq(users.id, existing.id));
      } else {
        await db.insert(users).values({
          email: tokenData.email,
          name: "Admin",
          passwordHash: newHash,
          role: "admin",
        });
      }
    } else {
      // For regular DB users
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, tokenData.email))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { error: "User not found." },
          { status: 404 }
        );
      }

      await db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date().toISOString() })
        .where(eq(users.id, user.id));
    }

    // Mark token as used
    await db
      .update(resetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(resetTokens.id, tokenData.id));

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
