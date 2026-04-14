import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveRegistrationToDrive, appendSheetRow, sanitizeSheetRow, SHEETS } from "@/lib/google-sheets";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per 10 minutes per IP
  const ip = getClientIp(request);
  if (isRateLimited(ip, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const allowedRoles = ["parent", "coach", "staff", "ref"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const needsApproval = ["staff", "ref"].includes(role);

    await db.insert(users).values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      role,
      phone: phone || null,
      approved: !needsApproval,
    });

    // Save contact info to Google Drive and Sheets (non-blocking)
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });
    Promise.allSettled([
      saveRegistrationToDrive(name, email.toLowerCase(), role, phone),
      appendSheetRow(SHEETS.prospectPipeline, "Sheet1!A:G", [
        sanitizeSheetRow([
          timestamp,
          name,
          email.toLowerCase(),
          phone || "",
          role,
          "Website Registration",
          "Active",
        ]),
      ]),
    ]).catch(() => {});

    return NextResponse.json(
      { success: true, pendingApproval: needsApproval },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
