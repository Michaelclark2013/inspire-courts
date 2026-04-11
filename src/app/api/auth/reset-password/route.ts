import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Import the token store from the forgot-password route
// Since they share the same server process, the in-memory Map is shared
import { resetTokens } from "../forgot-password/route";

const OVERRIDE_PATH = path.join(process.cwd(), "data", "auth-override.json");

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 3) {
      return NextResponse.json(
        { error: "Password must be at least 3 characters." },
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    if (tokenData.expires < Date.now()) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const newHash = await bcrypt.hash(password, 12);

    // Save the override
    const dataDir = path.dirname(OVERRIDE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      OVERRIDE_PATH,
      JSON.stringify(
        {
          passwordHash: newHash,
          updatedAt: new Date().toISOString(),
          updatedBy: tokenData.email,
        },
        null,
        2
      )
    );

    // Invalidate the used token
    resetTokens.delete(token);

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
